using appointza.Models.Hospitality;

namespace appointza.Services
{
    public static class HospitalityBookingCalculator
    {
        const int DefaultMinStay = 1;
        const int DefaultMaxStay = 30;

        public static HospitalityBookingQuote Compute(
            DateOnly checkIn,
            DateOnly checkOut,
            int persons,
            int extraBeds,
            OrganisationRoom? room = null,
            IReadOnlyList<HospitalityPackage>? packages = null,
            IReadOnlyList<string>? packageIds = null,
            IReadOnlyList<HospitalityGuestService>? guestServices = null,
            IReadOnlyList<string>? guestServiceIds = null,
            string? checkInTime = null,
            string? checkOutTime = null,
            string bookingType = "overnight",
            int propertyMinimumHours = 2)
        {
            var hourly = string.Equals(bookingType, "hourly", StringComparison.OrdinalIgnoreCase);
            var inTime = HospitalityBookingTimeHelper.ParseTimeOrDefault(checkInTime, hourly ? "14:00" : "14:00");
            var outTime = HospitalityBookingTimeHelper.ParseTimeOrDefault(checkOutTime, hourly ? "17:00" : "11:00");

            int nights = 0;
            int hours = 0;
            int duration;
            string durationLabel;

            if (hourly)
            {
                hours = HospitalityBookingTimeHelper.CountHours(checkIn, checkOut, inTime, outTime);
                var minHours = room?.booking_rules.minimum_hours > 0
                    ? room.booking_rules.minimum_hours
                    : Math.Max(1, propertyMinimumHours);
                var maxHours = room?.booking_rules.maximum_hours > 0
                    ? room.booking_rules.maximum_hours
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
                nights = HospitalityBookingTimeHelper.CountNights(checkIn, checkOut, inTime, outTime);
                var minStay = room?.booking_rules.minimum_stay ?? DefaultMinStay;
                var maxStay = room?.booking_rules.maximum_stay ?? DefaultMaxStay;
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
            var hasStayPackage = packageLines.Any(p => p.includes_room);

            if (room == null && !hasPackages && !hasServices)
                throw new ArgumentException("Select a room, package, or add-on service.");

            if (hasStayPackage && room == null)
                throw new ArgumentException(
                    hourly
                        ? "Hall packages include the venue — select a hall/room for your slot."
                        : "Stay packages include your room — select a room for your dates.");

            decimal roomTotal = 0;
            decimal extraBedTotal = 0;
            decimal extraGuestTotal = 0;
            var maxExtraBeds = 0;
            var maxPersons = persons;
            decimal pricePerHour = room?.pricing.price_per_hour ?? 0;

            var primaryStayPackage = ResolvePrimaryStayPackage(packages, packageLines);

            if (room != null)
            {
                maxExtraBeds = Math.Max(0, room.capacity.extra_beds_allowed);
                if (extraBeds < 0 || extraBeds > maxExtraBeds)
                    throw new ArgumentException(maxExtraBeds == 0
                        ? "This room does not allow extra beds."
                        : $"You can add up to {maxExtraBeds} extra bed(s).");

                maxPersons = room.capacity.total_guests + extraBeds;
                if (persons > maxPersons && primaryStayPackage == null)
                    throw new ArgumentException($"This room allows up to {maxPersons} guest(s) with {extraBeds} extra bed(s).");

                if (hourly)
                {
                    var hourlyRate = room.pricing.price_per_hour > 0
                        ? room.pricing.price_per_hour
                        : room.pricing.price_per_night;
                    pricePerHour = hourlyRate;
                    roomTotal = hourlyRate * hours;
                    extraGuestTotal = Math.Max(0, persons - room.capacity.total_guests) * room.pricing.extra_guest_charge * hours;
                }
                else
                {
                    roomTotal = SumOvernightRates(room.pricing, checkIn, checkOut);
                    extraGuestTotal = Math.Max(0, persons - room.capacity.total_guests) * room.pricing.extra_guest_charge * nights;
                }

                if (hasStayPackage)
                    roomTotal = 0;
            }
            else if (extraBeds > 0)
            {
                throw new ArgumentException("Extra beds require a room selection.");
            }

            if (primaryStayPackage != null)
            {
                var packageMax = primaryStayPackage.max_guests > 0 ? primaryStayPackage.max_guests : persons;
                var included = primaryStayPackage.included_guests > 0
                    ? primaryStayPackage.included_guests
                    : packageMax;
                if (included > packageMax)
                    included = packageMax;

                maxPersons = packageMax;
                if (persons > packageMax)
                    throw new ArgumentException(
                        $"Package \"{primaryStayPackage.name}\" allows up to {packageMax} guest(s).");

                var packageExtraGuests = Math.Max(0, persons - included);
                extraGuestTotal = packageExtraGuests * primaryStayPackage.extra_guest_charge;
            }

            var packagesTotal = packageLines.Sum(p => p.total);
            var servicesTotal = serviceLines.Sum(s => s.total);
            var subtotal = roomTotal + extraBedTotal + extraGuestTotal + packagesTotal + servicesTotal;
            var total = Math.Max(0, subtotal);

            return new HospitalityBookingQuote
            {
                booking_type = hourly ? "hourly" : "overnight",
                nights = nights,
                hours = hours,
                duration = duration,
                duration_label = durationLabel,
                room_total = roomTotal,
                extra_bed_total = extraBedTotal,
                extra_guest_total = extraGuestTotal,
                packages_total = packagesTotal,
                packages = packageLines,
                services_total = servicesTotal,
                services = serviceLines,
                subtotal = subtotal,
                tax = 0,
                discount = 0,
                total = total,
                max_extra_beds = maxExtraBeds,
                max_persons = maxPersons,
                extra_beds = extraBeds,
                persons = persons,
                extra_bed_charge_per_night = 0,
                price_per_hour = pricePerHour,
                minimum_hours = hourly
                    ? (room?.booking_rules.minimum_hours > 0 ? room.booking_rules.minimum_hours : Math.Max(1, propertyMinimumHours))
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

        static List<HospitalityBookingPackageLine> BuildPackageLines(
            IReadOnlyList<HospitalityPackage>? packages,
            IReadOnlyList<string>? packageIds,
            int units,
            bool hourly)
        {
            if (packages == null || packages.Count == 0 || packageIds == null || packageIds.Count == 0)
                return [];

            var available = packages
                .Where(p => p.is_active && !string.IsNullOrWhiteSpace(p.name))
                .GroupBy(PackageLookupKey, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var lines = new List<HospitalityBookingPackageLine>();
            foreach (var rawId in packageIds.Where(id => !string.IsNullOrWhiteSpace(id)))
            {
                var packageId = rawId.Trim();
                if (!TryResolvePackage(available, packageId, out var package))
                    continue;

                var includesRoom = !IsAddonPackage(package);
                EnsurePackageEligible(package, units, hourly);
                var unitPrice = ParseMoney(package.price);
                var perUnit = hourly
                    ? package.price.Contains("/hour", StringComparison.OrdinalIgnoreCase)
                    : package.price.Contains("/night", StringComparison.OrdinalIgnoreCase);
                var total = perUnit ? unitPrice * Math.Max(1, units) : unitPrice;
                var unitWord = hourly ? "hour(s)" : "night(s)";
                lines.Add(new HospitalityBookingPackageLine
                {
                    package_id = string.IsNullOrWhiteSpace(package.id) ? packageId : package.id,
                    name = package.name,
                    price_label = perUnit ? $"{package.price} × {units} {unitWord}" : package.price,
                    kind = package.kind,
                    includes_room = includesRoom,
                    unit_price = unitPrice,
                    total = total,
                });
            }

            return lines;
        }

        static HospitalityPackage? ResolvePrimaryStayPackage(
            IReadOnlyList<HospitalityPackage>? packages,
            IReadOnlyList<HospitalityBookingPackageLine> packageLines)
        {
            if (packages == null || packages.Count == 0 || packageLines.Count == 0)
                return null;

            var stayLine = packageLines.FirstOrDefault(p => p.includes_room);
            if (stayLine == null)
                return null;

            return packages.FirstOrDefault(p =>
                       !string.IsNullOrWhiteSpace(stayLine.package_id) &&
                       string.Equals(p.id, stayLine.package_id, StringComparison.OrdinalIgnoreCase))
                   ?? packages.FirstOrDefault(p =>
                       string.Equals(p.name, stayLine.name, StringComparison.OrdinalIgnoreCase));
        }

        static void EnsurePackageEligible(HospitalityPackage package, int units, bool hourly)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            if (DateOnly.TryParse(package.valid_from, out var from) && today < from)
                throw new ArgumentException($"Package \"{package.name}\" is valid from {from:dd MMM yyyy}.");
            if (DateOnly.TryParse(package.valid_to, out var to) && today > to)
                throw new ArgumentException($"Package \"{package.name}\" expired on {to:dd MMM yyyy}.");
            if (package.minimum_nights > 0 && units < package.minimum_nights)
            {
                var unit = hourly ? "hour(s)" : "night(s)";
                throw new ArgumentException(
                    $"Package \"{package.name}\" requires at least {package.minimum_nights} {unit}.");
            }
        }

        static bool IsAddonPackage(HospitalityPackage package) =>
            string.Equals(package.kind, "addon", StringComparison.OrdinalIgnoreCase);

        static List<HospitalityBookingServiceLine> BuildServiceLines(
            IReadOnlyList<HospitalityGuestService>? guestServices,
            IReadOnlyList<string>? selectedServiceIds)
        {
            if (guestServices == null || guestServices.Count == 0 || selectedServiceIds == null || selectedServiceIds.Count == 0)
                return [];

            var available = guestServices
                .Where(s => s.is_active && !string.IsNullOrWhiteSpace(s.name))
                .GroupBy(ServiceLookupKey, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var lines = new List<HospitalityBookingServiceLine>();
            foreach (var rawId in selectedServiceIds.Where(id => !string.IsNullOrWhiteSpace(id)))
            {
                var serviceId = rawId.Trim();
                if (!TryResolveService(available, serviceId, out var service))
                    continue;

                var unitPrice = ParseMoney(service.price);
                lines.Add(new HospitalityBookingServiceLine
                {
                    service_id = string.IsNullOrWhiteSpace(service.id) ? serviceId : service.id,
                    name = service.name,
                    price_label = service.price,
                    unit_price = unitPrice,
                    quantity = 1,
                    total = unitPrice,
                });
            }

            return lines;
        }

        static string PackageLookupKey(HospitalityPackage package) =>
            !string.IsNullOrWhiteSpace(package.id)
                ? package.id.Trim()
                : $"name:{package.name.Trim().ToLowerInvariant()}";

        static string ServiceLookupKey(HospitalityGuestService service) =>
            !string.IsNullOrWhiteSpace(service.id)
                ? service.id.Trim()
                : $"name:{service.name.Trim().ToLowerInvariant()}";

        static bool TryResolvePackage(
            IReadOnlyDictionary<string, HospitalityPackage> available,
            string packageId,
            out HospitalityPackage package)
        {
            if (available.TryGetValue(packageId, out package!))
                return true;

            var normalized = packageId.StartsWith("name:", StringComparison.OrdinalIgnoreCase)
                ? packageId[5..].Trim().ToLowerInvariant()
                : packageId.Trim().ToLowerInvariant();

            if (available.TryGetValue($"name:{normalized}", out package!))
                return true;

            package = available.Values.FirstOrDefault(p =>
                string.Equals(p.name.Trim(), packageId, StringComparison.OrdinalIgnoreCase)
                || string.Equals(p.name.Trim(), normalized, StringComparison.OrdinalIgnoreCase))!;

            return package != null;
        }

        static bool TryResolveService(
            IReadOnlyDictionary<string, HospitalityGuestService> available,
            string serviceId,
            out HospitalityGuestService service)
        {
            if (available.TryGetValue(serviceId, out service!))
                return true;

            var normalized = serviceId.StartsWith("name:", StringComparison.OrdinalIgnoreCase)
                ? serviceId[5..].Trim().ToLowerInvariant()
                : serviceId.Trim().ToLowerInvariant();

            if (available.TryGetValue($"name:{normalized}", out service!))
                return true;

            service = available.Values.FirstOrDefault(s =>
                string.Equals(s.name.Trim(), serviceId, StringComparison.OrdinalIgnoreCase)
                || string.Equals(s.name.Trim(), normalized, StringComparison.OrdinalIgnoreCase))!;

            return service != null;
        }

        static decimal SumOvernightRates(RoomPricingData pricing, DateOnly checkIn, DateOnly checkOut)
        {
            decimal total = 0;
            for (var night = checkIn; night < checkOut; night = night.AddDays(1))
                total += NightlyRate(pricing, night);
            return total;
        }

        static decimal NightlyRate(RoomPricingData pricing, DateOnly night)
        {
            var isWeekend = night.DayOfWeek is DayOfWeek.Friday or DayOfWeek.Saturday or DayOfWeek.Sunday;
            if (isWeekend && pricing.weekend_price > 0)
                return pricing.weekend_price;
            return pricing.price_per_night;
        }
    }
}
