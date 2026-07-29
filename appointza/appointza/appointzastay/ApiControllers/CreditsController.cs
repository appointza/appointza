using appointza.Filters.AppointzaStay;
using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
[RequireStaff]
public class CreditsController : ControllerBase
{
    private readonly CreditService _credits;
    private readonly StayPaymentService _payments;

    public CreditsController(CreditService credits, StayPaymentService payments)
    {
        _credits = credits;
        _payments = payments;
    }

    [HttpGet("Index")]
    public ActionResult<ActionRes<object>> Index()
    {
        return Ok(new ActionRes<object> { item = _credits.GetPageModel() });
    }

    [HttpPost("ChangePlan")]
    public ActionResult<ActionRes<object>> ChangePlan(ActionReq<StayModels.RoomIdReq> req)
    {
        try
        {
            _credits.ChangePlan(req.item.id);
            var plan = StayModels.CreditCatalog.GetPlan(req.item.id);
            return Ok(new ActionRes<object>
            {
                item = new { message = $"You are now on the {plan.Name} plan ({plan.BookingFeeLabel})." },
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("SetBillingMode")]
    public ActionResult<ActionRes<object>> SetBillingMode(ActionReq<StayModels.BillingModeReq> req)
    {
        try
        {
            _credits.SetBillingMode(req.item.mode);
            var isWallet = req.item.mode.Equals("credit_wallet", StringComparison.OrdinalIgnoreCase);
            return Ok(new ActionRes<object>
            {
                item = new
                {
                    message = isWallet
                        ? "Credit Wallet is now your billing method."
                        : "Subscription billing is now active.",
                    mode = isWallet ? "credit_wallet" : "subscription",
                },
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Legacy direct recharge — disabled. Use CreateWalletRechargeOrder + VerifyWalletRecharge.
    /// </summary>
    [HttpPost("RechargeWallet")]
    public ActionResult<ActionRes<object>> RechargeWallet(ActionReq<StayModels.RoomIdReq> req)
    {
        return BadRequest(new
        {
            error = "Direct wallet recharge is disabled. Create a Razorpay order and verify payment first.",
        });
    }

    [HttpPost("CreateWalletRechargeOrder")]
    public async Task<ActionResult<ActionRes<object>>> CreateWalletRechargeOrder(
        ActionReq<StayModels.StayWalletRechargeOrderReq> req)
    {
        try
        {
            var packId = req.item?.PackId ?? "";
            var result = await _payments.CreateWalletRechargeOrderAsync(packId);
            return Ok(new ActionRes<object> { item = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("VerifyWalletRecharge")]
    public async Task<ActionResult<ActionRes<object>>> VerifyWalletRecharge(
        ActionReq<StayModels.StayWalletRechargeVerifyReq> req)
    {
        try
        {
            var result = await _payments.VerifyWalletRechargeAsync(req.item);
            if (!result.Success)
                return BadRequest(new { error = result.Message, item = result });

            return Ok(new ActionRes<object> { item = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("WalletPacks")]
    public ActionResult<ActionRes<object>> WalletPacks()
    {
        return Ok(new ActionRes<object>
        {
            item = new
            {
                freeBookingsPerMonth = StayModels.CreditWalletCatalog.FreeBookingsPerMonth,
                signupFreeBookings = StayModels.CreditWalletCatalog.SignupFreeBookings,
                packs = StayModels.CreditWalletCatalog.Packs,
            },
        });
    }

    [HttpGet("Referral")]
    public ActionResult<ActionRes<object>> Referral()
    {
        return Ok(new ActionRes<object> { item = _credits.GetReferralInfo() });
    }

    [HttpPost("ApplyReferral")]
    public ActionResult<ActionRes<object>> ApplyReferral(ActionReq<StayModels.ApplyReferralCodeReq> req)
    {
        try
        {
            var result = _credits.ApplyReferralCode(req.item.ReferralCode);
            if (!result.Success)
                return BadRequest(new { error = result.Message, item = result });

            return Ok(new ActionRes<object> { item = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
