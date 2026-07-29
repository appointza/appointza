using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public static class BookingCalculator
{
    private const int DefaultMinStay = 1;
    private const int DefaultMaxStay = 30;

    public static BookingQuote Compute(
        DateOnly checkIn,
        DateOnly checkOut,
        int persons,
        int extraBeds,
        Room? room = null,
        IReadOnlyList<PropertyPackage>? packages = null,
        IReadOnlyList<string>? packageIds = null,
        IReadOnlyList<PropertyGuestService>? guestServices = null,
        IReadOnlyList<string>? guestServiceIds = null,
        string? checkInTime = null,
        string? checkOutTime = null,
        PropertyBookingType bookingType = PropertyBookingType.overnight,
        int propertyMinimumHours = 2)
    {
        var hourly = bookingType == PropertyBookingType.hourly;
        var inTime = BookingTimeHelper.ParseTimeOrDefault(checkInTime, hourly ? "14:00" : "14:00");
        var outTime = BookingTimeHelper.ParseTimeOrDefault(checkOutTime, hourly ? "17:00" : "11:00");

        int nights = 0;
        int hours = 0;
        int duration;
        string durationLabel;

        if (hourly)
        {
            // Same storage shape: check-in/out datetime. Usually same calendar day for halls.
            hours = BookingTimeHelper.CountHours(checkIn, checkOut, inTime, outTime);
            var minHours = room?.BookingRules.MinimumHours > 0
                ? room.BookingRules.MinimumHours
                : Math.Max(1, propertyMinimumHours);
            var maxHours = room?.BookingRules.MaximumHours > 0
                ? room.BookingRules.MaximumHours
                : 24;
            if (hours < minHours)
                throw new ArgumentException($"Minimum booking is {minHours} hour(s).");
            if (hours > maxHours)
                throw new ArgumentException($"Maximum booking is {maxHours} hours.");
            duration = hours;
            durationLabel = hours == 1 ? "1 hour" : $"{hours} hours";
        }
        else
        {
            nights = BookingTimeHelper.CountNights(checkIn, checkOut, inTime, outTime);
            var minStay = room?.BookingRules.MinimumStay ?? DefaultMinStay;
            var maxStay = room?.BookingRules.MaximumStay ?? DefaultMaxStay;
            if (nights < minStay)
                throw new ArgumentException($"Minimum stay is {minStay} night(s).");
            if (nights > maxStay)
                throw new ArgumentException($"Maximum stay is {maxStay} nights.");
            duration = nights;
            durationLabel = nights == 1 ? "1 night" : $"{nights} nights";
        }

        if (persons < 1)
            throw new ArgumentException("At least one guest is required.");

        var packageUnits = hourly ? hours : nights;
        var packageLines = BuildPackageLines(packages, packageIds, packageUnits, hourly);
        var serviceLines = BuildServiceLines(guestServices, guestServiceIds);
        var hasPackages = packageLines.Count > 0;
        var hasServices = serviceLines.Count > 0;
        var hasStayPackage = packageLines.Any(p => p.IncludesRoom);
        var hasAddonPackage = packageLines.Any(p => !p.IncludesRoom);

        if (room == null && !hasPackages && !hasServices)
            throw new ArgumentException("Select a room, package, or add-on service.");

        if (hasStayPackage && room == null)
            throw new ArgumentException(
                hourly
                    ? "Hall packages include the venue — select a hall/room for your slot."
                    : "Stay packages include your room — select a room for your dates.");

        if (hasPackages && hasAddonPackage && !hasStayPackage && room == null)
            throw new ArgumentException("Select a room, or choose only add-on services without a package.");

        decimal roomTotal = 0;
        decimal extraBedTotal = 0;
        decimal extraGuestTotal = 0;
        var maxExtraBeds = 0;
        var maxPersons = persons;
        decimal discount = 0;
        decimal pricePerHour = room?.Pricing.PricePerHour ?? 0;

        var primaryStayPackage = ResolvePrimaryStayPackage(packages, packageLines);

        if (room != null)
        {
            maxExtraBeds = Math.Max(0, room.Capacity.ExtraBedsAllowed);
            if (extraBeds < 0 || extraBeds > maxExtraBeds)
                throw new ArgumentException(maxExtraBeds == 0
                    ? "This room does not allow extra beds."
                    : $"You can add up to {maxExtraBeds} extra bed(s).");

            maxPersons = room.Capacity.TotalGuests + extraBeds;
            if (persons > maxPersons && primaryStayPackage == null)
                throw new ArgumentException($"This room allows up to {maxPersons} guest(s) with {extraBeds} extra bed(s).");

            discount = room.Pricing.Discount;

            if (hourly)
            {
                var hourlyRate = room.Pricing.PricePerHour > 0
                    ? room.Pricing.PricePerHour
                    : room.Pricing.PricePerNight; // fallback if only night rate was set
                pricePerHour = hourlyRate;
                roomTotal = hourlyRate * hours;
                extraBedTotal = extraBeds * room.Pricing.ExtraBedCharge * hours;
                var extraGuests = Math.Max(0, persons - room.Capacity.TotalGuests);
                extraGuestTotal = extraGuests * room.Pricing.ExtraGuestCharge * hours;
            }
            else
            {
                roomTotal = SumOvernightRates(room.Pricing, checkIn, checkOut);
                extraBedTotal = extraBeds * room.Pricing.ExtraBedCharge * nights;
                var extraGuests = Math.Max(0, persons - room.Capacity.TotalGuests);
                extraGuestTotal = extraGuests * room.Pricing.ExtraGuestCharge * nights;
            }

            // Packages that include the venue/room — don't double-charge base rate.
            if (hasStayPackage)
                roomTotal = 0;
        }
        else if (extraBeds > 0)
        {
            throw new ArgumentException("Extra beds require a room selection.");
        }

        if (primaryStayPackage != null)
        {
            var packageMax = primaryStayPackage.MaxGuests > 0 ? primaryStayPackage.MaxGuests : persons;
            var included = primaryStayPackage.IncludedGuests > 0
                ? primaryStayPackage.IncludedGuests
                : packageMax;
            if (included > packageMax)
                included = packageMax;

            maxPersons = packageMax;
            if (persons > packageMax)
                throw new ArgumentException(
                    $"Package \"{primaryStayPackage.Name}\" allows up to {packageMax} guest(s).");

            var packageExtraGuests = Math.Max(0, persons - included);
            extraGuestTotal = packageExtraGuests * primaryStayPackage.ExtraGuestCharge;
        }

        var packagesTotal = packageLines.Sum(p => p.Total);
        var servicesTotal = serviceLines.Sum(s => s.Total);
        var subtotal = roomTotal + extraBedTotal + extraGuestTotal + packagesTotal + servicesTotal;
        var tax = 0m;
        var total = Math.Max(0, subtotal - discount);

        return new BookingQuote
        {
            BookingType = hourly ? "hourly" : "overnight",
            Nights = nights,
            Hours = hours,
            Duration = duration,
            DurationLabel = durationLabel,
            RoomTotal = roomTotal,
            ExtraBedTotal = extraBedTotal,
            ExtraGuestTotal = extraGuestTotal,
            PackagesTotal = packagesTotal,
            Packages = packageLines,
            ServicesTotal = servicesTotal,
            Services = serviceLines,
            Subtotal = subtotal,
            Tax = tax,
            Discount = discount,
            Total = total,
            MaxExtraBeds = maxExtraBeds,
            MaxPersons = maxPersons,
            ExtraBeds = extraBeds,
            Persons = persons,
            ExtraBedChargePerNight = room?.Pricing.ExtraBedCharge ?? 0,
            PricePerHour = pricePerHour,
            MinimumHours = hourly
                ? (room?.BookingRules.MinimumHours > 0 ? room.BookingRules.MinimumHours : Math.Max(1, propertyMinimumHours))
                : 0,
        };
    }

    public static bool TryParseDate(string? value, out DateOnly date)
    {
        date = default;
        if (string.IsNullOrWhiteSpace(value)) return false;
        return DateOnly.TryParse(value, out date);
    }

    public static decimal ParseMoney(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0;
        var cleaned = new string(value.Where(c => char.IsDigit(c) || c == '.').ToArray());
        return decimal.TryParse(cleaned, System.Globalization.NumberStyles.Number,
            System.Globalization.CultureInfo.InvariantCulture, out var amount)
            ? amount
            : 0;
    }

    private static List<BookingPackageLine> BuildPackageLines(
        IReadOnlyList<PropertyPackage>? packages,
        IReadOnlyList<string>? packageIds,
        int units,
        bool hourly)
    {
        if (packages == null || packages.Count == 0 || packageIds == null || packageIds.Count == 0)
            return [];

        var available = packages
            .Where(p => p.IsActive && !string.IsNullOrWhiteSpace(p.Name))
            .GroupBy(PackageLookupKey, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var lines = new List<BookingPackageLine>();
        foreach (var rawId in packageIds.Where(id => !string.IsNullOrWhiteSpace(id)))
        {
            var packageId = rawId.Trim();
            if (!TryResolvePackage(available, packageId, out var package))
                continue;

            var includesRoom = !IsAddonPackage(package);
            EnsurePackageEligible(package, units, hourly);
            var unitPrice = ParseMoney(package.Price);
            var perUnit = hourly
                ? package.Price.Contains("/hour", StringComparison.OrdinalIgnoreCase)
                : package.Price.Contains("/night", StringComparison.OrdinalIgnoreCase);
            var total = perUnit ? unitPrice * Math.Max(1, units) : unitPrice;
            var unitWord = hourly ? "hour(s)" : "night(s)";
            lines.Add(new BookingPackageLine
            {
                PackageId = string.IsNullOrWhiteSpace(package.Id) ? packageId : package.Id,
                Name = package.Name,
                PriceLabel = perUnit ? $"{package.Price} × {units} {unitWord}" : package.Price,
                Kind = package.Kind,
                IncludesRoom = includesRoom,
                UnitPrice = unitPrice,
                Total = total,
            });
        }

        return lines;
    }

    private static PropertyPackage? ResolvePrimaryStayPackage(
        IReadOnlyList<PropertyPackage>? packages,
        IReadOnlyList<BookingPackageLine> packageLines)
    {
        if (packages == null || packages.Count == 0 || packageLines.Count == 0)
            return null;

        var stayLine = packageLines.FirstOrDefault(p => p.IncludesRoom);
        if (stayLine == null)
            return null;

        return packages.FirstOrDefault(p =>
                   !string.IsNullOrWhiteSpace(stayLine.PackageId) &&
                   string.Equals(p.Id, stayLine.PackageId, StringComparison.OrdinalIgnoreCase))
               ?? packages.FirstOrDefault(p =>
                   string.Equals(p.Name, stayLine.Name, StringComparison.OrdinalIgnoreCase));
    }

    private static void EnsurePackageEligible(PropertyPackage package, int units, bool hourly)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        if (DateOnly.TryParse(package.ValidFrom, out var from) && today < from)
            throw new ArgumentException($"Package \"{package.Name}\" is valid from {from:dd MMM yyyy}.");
        if (DateOnly.TryParse(package.ValidTo, out var to) && today > to)
            throw new ArgumentException($"Package \"{package.Name}\" expired on {to:dd MMM yyyy}.");
        if (package.MinimumNights > 0 && units < package.MinimumNights)
        {
            var unit = hourly ? "hour(s)" : "night(s)";
            throw new ArgumentException(
                $"Package \"{package.Name}\" requires at least {package.MinimumNights} {unit}.");
        }
    }

    private static bool IsAddonPackage(PropertyPackage package) =>
        string.Equals(package.Kind, "addon", StringComparison.OrdinalIgnoreCase);

    private static List<BookingGuestServiceLine> BuildServiceLines(
        IReadOnlyList<PropertyGuestService>? guestServices,
        IReadOnlyList<string>? selectedServiceIds)
    {
        if (guestServices == null || guestServices.Count == 0 || selectedServiceIds == null || selectedServiceIds.Count == 0)
            return [];

        var available = guestServices
            .Where(s => s.IsActive && !string.IsNullOrWhiteSpace(s.Name))
            .GroupBy(ServiceLookupKey, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var lines = new List<BookingGuestServiceLine>();
        foreach (var rawId in selectedServiceIds.Where(id => !string.IsNullOrWhiteSpace(id)))
        {
            var serviceId = rawId.Trim();
            if (!TryResolveService(available, serviceId, out var service))
                continue;

            var unitPrice = ParseMoney(service.Price);
            lines.Add(new BookingGuestServiceLine
            {
                ServiceId = string.IsNullOrWhiteSpace(service.Id) ? serviceId : service.Id,
                Name = service.Name,
                PriceLabel = service.Price,
                UnitPrice = unitPrice,
                Quantity = 1,
                Total = unitPrice,
            });
        }

        return lines;
    }

    private static string PackageLookupKey(PropertyPackage package) =>
        !string.IsNullOrWhiteSpace(package.Id)
            ? package.Id.Trim()
            : $"name:{package.Name.Trim().ToLowerInvariant()}";

    private static string ServiceLookupKey(PropertyGuestService service) =>
        !string.IsNullOrWhiteSpace(service.Id)
            ? service.Id.Trim()
            : $"name:{service.Name.Trim().ToLowerInvariant()}";

    private static bool TryResolvePackage(
        IReadOnlyDictionary<string, PropertyPackage> available,
        string packageId,
        out PropertyPackage package)
    {
        if (available.TryGetValue(packageId, out package!))
            return true;

        var normalized = packageId.StartsWith("name:", StringComparison.OrdinalIgnoreCase)
            ? packageId[5..].Trim().ToLowerInvariant()
            : packageId.Trim().ToLowerInvariant();

        if (available.TryGetValue($"name:{normalized}", out package!))
            return true;

        package = available.Values.FirstOrDefault(p =>
            string.Equals(p.Name.Trim(), packageId, StringComparison.OrdinalIgnoreCase)
            || string.Equals(p.Name.Trim(), normalized, StringComparison.OrdinalIgnoreCase))!;

        return package != null;
    }

    private static bool TryResolveService(
        IReadOnlyDictionary<string, PropertyGuestService> available,
        string serviceId,
        out PropertyGuestService service)
    {
        if (available.TryGetValue(serviceId, out service!))
            return true;

        var normalized = serviceId.StartsWith("name:", StringComparison.OrdinalIgnoreCase)
            ? serviceId[5..].Trim().ToLowerInvariant()
            : serviceId.Trim().ToLowerInvariant();

        if (available.TryGetValue($"name:{normalized}", out service!))
            return true;

        service = available.Values.FirstOrDefault(s =>
            string.Equals(s.Name.Trim(), serviceId, StringComparison.OrdinalIgnoreCase)
            || string.Equals(s.Name.Trim(), normalized, StringComparison.OrdinalIgnoreCase))!;

        return service != null;
    }

    /// <summary>Sum per-night rates using weekday (<see cref="RoomPricing.PricePerNight"/>) or weekend (<see cref="RoomPricing.WeekendPrice"/>) when set.</summary>
    private static decimal SumOvernightRates(RoomPricing pricing, DateOnly checkIn, DateOnly checkOut)
    {
        decimal total = 0;
        for (var night = checkIn; night < checkOut; night = night.AddDays(1))
            total += NightlyRate(pricing, night);
        return total;
    }

    private static decimal NightlyRate(RoomPricing pricing, DateOnly night)
    {
        var isWeekend = night.DayOfWeek is DayOfWeek.Friday or DayOfWeek.Saturday or DayOfWeek.Sunday;
        if (isWeekend && pricing.WeekendPrice > 0)
            return pricing.WeekendPrice;
        return pricing.PricePerNight;
    }
}
