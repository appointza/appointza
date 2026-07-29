using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;
using Microsoft.Extensions.Configuration;

namespace appointza.Services.AppointzaStay;

/// <summary>
/// Creates and verifies Razorpay orders.
/// Guest booking payments use the property's own credentials.
/// Credit Wallet recharges use Appointza platform credentials from appsettings.
/// </summary>
public class StayPaymentService
{
    private readonly AppDataStore _data;
    private readonly BookingDetailService _bookings;
    private readonly CustomerService _customers;
    private readonly LogService _logs;
    private readonly CreditService _credits;
    private readonly OrganisationResolver _org;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    private static readonly ConcurrentDictionary<string, PendingWalletRecharge> PendingRecharges = new();

    public StayPaymentService(
        AppDataStore data,
        BookingDetailService bookings,
        CustomerService customers,
        LogService logs,
        CreditService credits,
        OrganisationResolver org,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _data = data;
        _bookings = bookings;
        _customers = customers;
        _logs = logs;
        _credits = credits;
        _org = org;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task<StayCreatePaymentOrderRes> CreateBookingOrderAsync(string bookingId)
    {
        if (string.IsNullOrWhiteSpace(bookingId))
            throw new ArgumentException("Booking id is required.");

        var booking = _bookings.GetById(bookingId)
            ?? throw new ArgumentException("Booking not found.");
        if (booking.Status == BookingDetailStatus.cancelled)
            throw new ArgumentException("This booking was cancelled.");
        if (booking.Balance <= 0 || booking.Paid >= booking.Total)
            throw new ArgumentException("This booking is already paid.");

        var org = _data.GetOrganisation(booking.OrganisationId)
            ?? throw new ArgumentException("Organisation not found.");
        var credentials = org.PaymentGateway;
        if (!credentials.IsOnlineReady || !credentials.CollectAtBooking)
            throw new ArgumentException(
                "Online payment at booking is not enabled for this property. Enable Razorpay and turn on Collect at booking.");

        var amount = booking.Balance;
        var amountPaise = (int)Math.Round(amount * 100m, MidpointRounding.AwayFromZero);
        if (amountPaise < 100)
            throw new ArgumentException("Payable amount must be at least ₹1.");

        var orderBody = new Dictionary<string, object?>
        {
            ["amount"] = amountPaise,
            ["currency"] = "INR",
            ["receipt"] = booking.BookingCode.Length <= 40
                ? booking.BookingCode
                : booking.BookingCode[..40],
            ["notes"] = new Dictionary<string, string>
            {
                ["booking_id"] = booking.Id,
                ["booking_code"] = booking.BookingCode,
                ["organisation_id"] = org.Id,
            },
        };

        var order = await PostRazorpayAsync(credentials.ApiKey, credentials.ApiSecret, "orders", orderBody);
        var orderId = order.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
        if (string.IsNullOrWhiteSpace(orderId))
            throw new Exception("Razorpay did not return an order id.");

        booking.RazorpayOrderId = orderId;
        _bookings.Save(booking);

        var customer = _customers.GetById(booking.CustomerId);
        return new StayCreatePaymentOrderRes
        {
            OrderId = orderId,
            Key = credentials.ApiKey,
            Amount = amount,
            Currency = "INR",
            Receipt = booking.BookingCode,
            BookingCode = booking.BookingCode,
            PropertyName = org.Name,
            GuestName = customer?.Name ?? "",
            GuestEmail = customer?.Email ?? "",
            GuestPhone = customer?.Phone ?? "",
        };
    }

    public async Task<StayVerifyPaymentRes> VerifyBookingPaymentAsync(StayVerifyPaymentReq req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.BookingId))
            return new StayVerifyPaymentRes { IsValid = false, Message = "Booking id is required." };
        if (string.IsNullOrWhiteSpace(req.RazorpayOrderId) ||
            string.IsNullOrWhiteSpace(req.RazorpayPaymentId) ||
            string.IsNullOrWhiteSpace(req.RazorpaySignature))
            return new StayVerifyPaymentRes { IsValid = false, Message = "Payment details are incomplete." };

        var booking = _bookings.GetById(req.BookingId);
        if (booking == null)
            return new StayVerifyPaymentRes { IsValid = false, Message = "Booking not found." };

        var org = _data.GetOrganisation(booking.OrganisationId);
        if (org == null || !org.PaymentGateway.IsOnlineReady || !org.PaymentGateway.CollectAtBooking)
            return new StayVerifyPaymentRes { IsValid = false, Message = "Online payment at booking is not enabled." };

        if (!VerifySignature(org.PaymentGateway.ApiSecret, req.RazorpayOrderId, req.RazorpayPaymentId, req.RazorpaySignature))
            return new StayVerifyPaymentRes { IsValid = false, Message = "Invalid payment signature." };

        if (!string.IsNullOrWhiteSpace(booking.RazorpayOrderId) &&
            !string.Equals(booking.RazorpayOrderId, req.RazorpayOrderId, StringComparison.Ordinal))
            return new StayVerifyPaymentRes { IsValid = false, Message = "Payment order does not match this booking." };

        if (booking.Status == BookingDetailStatus.cancelled)
            return new StayVerifyPaymentRes { IsValid = false, Message = "This booking was cancelled." };

        if (booking.Balance <= 0 &&
            string.Equals(booking.PaymentReference, req.RazorpayPaymentId, StringComparison.Ordinal))
        {
            return new StayVerifyPaymentRes
            {
                IsValid = true,
                Message = "Payment already recorded.",
                BookingCode = booking.BookingCode,
                Paid = booking.Paid,
                Balance = booking.Balance,
            };
        }

        booking.Paid = booking.Total;
        booking.Balance = 0;
        booking.PaymentReference = req.RazorpayPaymentId;
        booking.RazorpayOrderId = req.RazorpayOrderId;
        _bookings.Save(booking);

        try
        {
            _credits.ConsumeForBooking(booking.BookingCode);
        }
        catch (Exception ex)
        {
            _logs.Add(
                "payment",
                "booking",
                booking.Id,
                $"Payment verified for {booking.BookingCode} but credit consume failed: {ex.Message}");
        }

        _logs.Add(
            "payment",
            "booking",
            booking.Id,
            $"Online payment {req.RazorpayPaymentId} for {booking.BookingCode} — ₹{booking.Paid:0.##}");

        return new StayVerifyPaymentRes
        {
            IsValid = true,
            Message = "Payment verified.",
            BookingCode = booking.BookingCode,
            Paid = booking.Paid,
            Balance = booking.Balance,
        };
    }

    /// <summary>
    /// Create a Credit Wallet recharge order on the Appointza platform Razorpay account.
    /// Credits are NOT added here — only after <see cref="VerifyWalletRechargeAsync"/> succeeds.
    /// </summary>
    public async Task<StayWalletRechargeOrderRes> CreateWalletRechargeOrderAsync(string packId)
    {
        var orgId = _org.OrganisationId;
        if (string.IsNullOrWhiteSpace(orgId))
            throw new ArgumentException("Organisation is required.");

        var org = _data.RequireOrganisation(orgId);
        var pack = CreditWalletCatalog.GetPack(packId);
        var (keyId, keySecret) = GetPlatformCredentials();

        var amountPaise = (int)Math.Round(pack.PriceInr * 100m, MidpointRounding.AwayFromZero);
        if (amountPaise < 100)
            amountPaise = 100;

        var rechargeId = Guid.NewGuid().ToString("N");
        var receipt = $"STAY_WALLET_{orgId.Replace("-", "")}_{DateTime.UtcNow:yyyyMMddHHmmss}";
        if (receipt.Length > 40)
            receipt = receipt[..40];

        var orderBody = new Dictionary<string, object?>
        {
            ["amount"] = amountPaise,
            ["currency"] = "INR",
            ["receipt"] = receipt,
            ["notes"] = new Dictionary<string, string>
            {
                ["purpose"] = "appointzastay_credit_wallet_recharge",
                ["organisation_id"] = orgId,
                ["pack_id"] = pack.Id,
                ["recharge_id"] = rechargeId,
                ["credits"] = pack.Credits.ToString(),
            },
        };

        var order = await PostRazorpayAsync(keyId, keySecret, "orders", orderBody);
        var orderId = order.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
        if (string.IsNullOrWhiteSpace(orderId))
            throw new Exception("Razorpay did not return an order id.");

        PendingRecharges[rechargeId] = new PendingWalletRecharge(
            rechargeId,
            orgId,
            pack.Id,
            pack.Credits,
            pack.PriceInr,
            orderId,
            receipt,
            DateTime.UtcNow,
            Paid: false);

        return new StayWalletRechargeOrderRes
        {
            RechargeId = rechargeId,
            PackId = pack.Id,
            Credits = pack.Credits,
            OrderId = orderId,
            Key = keyId,
            Amount = pack.PriceInr,
            AmountPaise = amountPaise,
            Currency = "INR",
            Receipt = receipt,
            PropertyName = org.Name,
        };
    }

    /// <summary>
    /// Verify Razorpay payment signature. Only on success are wallet credits added.
    /// </summary>
    public async Task<StayWalletRechargeVerifyRes> VerifyWalletRechargeAsync(StayWalletRechargeVerifyReq req)
    {
        if (req == null ||
            string.IsNullOrWhiteSpace(req.RechargeId) ||
            string.IsNullOrWhiteSpace(req.RazorpayOrderId) ||
            string.IsNullOrWhiteSpace(req.RazorpayPaymentId) ||
            string.IsNullOrWhiteSpace(req.RazorpaySignature))
        {
            return new StayWalletRechargeVerifyRes
            {
                Success = false,
                Message = "Payment details are incomplete.",
            };
        }

        var orgId = _org.OrganisationId;
        if (string.IsNullOrWhiteSpace(orgId))
        {
            return new StayWalletRechargeVerifyRes
            {
                Success = false,
                Message = "Organisation is required.",
            };
        }

        var (keyId, keySecret) = GetPlatformCredentials();
        if (!VerifySignature(keySecret, req.RazorpayOrderId, req.RazorpayPaymentId, req.RazorpaySignature))
        {
            return new StayWalletRechargeVerifyRes
            {
                Success = false,
                Message = "Invalid payment signature. Credits were not added.",
            };
        }

        // Prefer in-memory pending order; after restart, recover pack/org from Razorpay order notes.
        string packId;
        if (PendingRecharges.TryGetValue(req.RechargeId, out var pending))
        {
            if (!string.Equals(pending.OrganisationId, orgId, StringComparison.OrdinalIgnoreCase))
            {
                return new StayWalletRechargeVerifyRes
                {
                    Success = false,
                    Message = "Recharge order does not belong to this organisation.",
                };
            }

            if (!string.Equals(pending.RazorpayOrderId, req.RazorpayOrderId, StringComparison.Ordinal))
            {
                return new StayWalletRechargeVerifyRes
                {
                    Success = false,
                    Message = "Payment order does not match this recharge.",
                };
            }

            if (pending.Paid)
            {
                var already = _credits.GetAccount();
                return new StayWalletRechargeVerifyRes
                {
                    Success = true,
                    Message = "Payment already recorded.",
                    CreditsAdded = 0,
                    WalletCreditBalance = already.WalletCreditBalance,
                };
            }

            packId = pending.PackId;
        }
        else
        {
            var order = await GetRazorpayAsync(keyId, keySecret, $"orders/{req.RazorpayOrderId}");
            if (!TryReadOrderNotes(order, out var noteOrgId, out var notePackId, out var noteRechargeId) ||
                !string.Equals(noteRechargeId, req.RechargeId, StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(noteOrgId, orgId, StringComparison.OrdinalIgnoreCase))
            {
                return new StayWalletRechargeVerifyRes
                {
                    Success = false,
                    Message = "Recharge order not found or does not match this organisation.",
                };
            }

            packId = CreditWalletCatalog.GetPack(notePackId).Id;
        }

        var beforeBalance = _credits.GetAccount().WalletCreditBalance;
        var updated = _credits.ApplyRechargeAfterPayment(packId, req.RazorpayPaymentId);
        var added = Math.Max(0, updated.WalletCreditBalance - beforeBalance);
        if (PendingRecharges.TryGetValue(req.RechargeId, out var toMark))
            PendingRecharges[req.RechargeId] = toMark with { Paid = true };

        return new StayWalletRechargeVerifyRes
        {
            Success = true,
            Message = added > 0
                ? $"Added {added} booking credits to your wallet."
                : "Payment already recorded.",
            CreditsAdded = added,
            WalletCreditBalance = updated.WalletCreditBalance,
        };
    }

    private (string KeyId, string KeySecret) GetPlatformCredentials()
    {
        var keyId = _configuration["ApplicationSettings:razorpay:key_id"];
        var keySecret = _configuration["ApplicationSettings:razorpay:key_secret"];
        if (string.IsNullOrWhiteSpace(keyId) || string.IsNullOrWhiteSpace(keySecret))
        {
            throw new InvalidOperationException(
                "Razorpay credentials are missing in appsettings.json (ApplicationSettings:razorpay).");
        }
        return (keyId, keySecret);
    }

    private static bool VerifySignature(
        string secret,
        string orderId,
        string paymentId,
        string signature)
    {
        var payload = $"{orderId}|{paymentId}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var generated = Convert.ToHexString(hashBytes).ToLowerInvariant();
        return string.Equals(generated, signature.Trim().ToLowerInvariant(), StringComparison.Ordinal);
    }

    private async Task<JsonElement> PostRazorpayAsync(
        string apiKey,
        string apiSecret,
        string path,
        object body)
    {
        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"https://api.razorpay.com/v1/{path}");
        var auth = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{apiKey}:{apiSecret}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", auth);
        request.Content = new StringContent(
            JsonSerializer.Serialize(body),
            Encoding.UTF8,
            "application/json");

        using var response = await client.SendAsync(request);
        var text = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
            throw new Exception($"Razorpay API error: {text}");

        using var doc = JsonDocument.Parse(text);
        return doc.RootElement.Clone();
    }

    private async Task<JsonElement> GetRazorpayAsync(string apiKey, string apiSecret, string path)
    {
        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.razorpay.com/v1/{path}");
        var auth = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{apiKey}:{apiSecret}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", auth);

        using var response = await client.SendAsync(request);
        var text = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
            throw new Exception($"Razorpay API error: {text}");

        using var doc = JsonDocument.Parse(text);
        return doc.RootElement.Clone();
    }

    private static bool TryReadOrderNotes(
        JsonElement order,
        out string organisationId,
        out string packId,
        out string rechargeId)
    {
        organisationId = "";
        packId = "";
        rechargeId = "";
        if (!order.TryGetProperty("notes", out var notes) || notes.ValueKind != JsonValueKind.Object)
            return false;

        organisationId = notes.TryGetProperty("organisation_id", out var orgProp) ? orgProp.GetString() ?? "" : "";
        packId = notes.TryGetProperty("pack_id", out var packProp) ? packProp.GetString() ?? "" : "";
        rechargeId = notes.TryGetProperty("recharge_id", out var rechargeProp) ? rechargeProp.GetString() ?? "" : "";
        return !string.IsNullOrWhiteSpace(organisationId)
            && !string.IsNullOrWhiteSpace(packId)
            && !string.IsNullOrWhiteSpace(rechargeId);
    }

    private sealed record PendingWalletRecharge(
        string Id,
        string OrganisationId,
        string PackId,
        int Credits,
        decimal AmountInr,
        string RazorpayOrderId,
        string Receipt,
        DateTime CreatedAt,
        bool Paid);
}
