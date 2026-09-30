using appointza.Models.Hospitality;

namespace appointza.Utils
{
    public static class RoomStayHistory
    {
        public static List<RoomStayRecord> Collect(OrganisationRoom room)
        {
            if (room.booking?.stays is { Count: > 0 } stored)
            {
                return stored
                    .Where(HasDates)
                    .Select(Clone)
                    .ToList();
            }

            if (HasHeaderStay(room))
                return [FromRoomHeader(room)];

            return [];
        }

        public static void ApplyToRoom(OrganisationRoom room, List<RoomStayRecord> stays, DateOnly displayDay)
        {
            stays = stays.Where(HasDates).Select(Clone).ToList();
            var open = stays.Where(s => !s.closed).ToList();
            var display = PickDisplayStay(open, displayDay) ?? open.LastOrDefault();

            room.booking ??= new RoomBookingData();
            room.booking.stays = stays;
            if (display == null)
            {
                room.booking.booking_id = "";
                room.booking.check_in = "";
                room.booking.check_out = "";
                room.booking.nights = 0;
                room.guest = null;
                room.payment = null;
                return;
            }

            room.booking.booking_id = display.booking_id;
            room.booking.check_in = display.check_in;
            room.booking.check_out = display.check_out;
            room.booking.nights = display.nights;
            room.guest = display.guest == null ? null : CloneGuest(display.guest);
            room.payment = display.payment == null ? null : ClonePayment(display.payment);
        }

        public static void OverlayBoardDay(OrganisationRoom room, DateOnly asOf)
        {
            var stays = Collect(room);
            room.booking ??= new RoomBookingData();
            room.booking.stays = stays;
            var covering = stays.FirstOrDefault(s => CoversNight(s, asOf));
            if (covering == null)
                return;

            room.booking.booking_id = covering.booking_id;
            room.booking.check_in = covering.check_in;
            room.booking.check_out = covering.check_out;
            room.booking.nights = covering.nights;
            if (covering.guest != null)
                room.guest = CloneGuest(covering.guest);
            if (covering.payment != null)
                room.payment = ClonePayment(covering.payment);
        }

        /// <summary>Calendar/board label for a day. Uses stored operational status plus stay windows.</summary>
        public static string GetAvailabilityState(OrganisationRoom room, DateOnly day)
        {
            var status = (room.status ?? "").Trim().ToLowerInvariant();
            if (status is "maintenance" or "blocked")
                return "Unavailable";
            if (status == "cleaning")
                return "Cleaning";

            var stays = Collect(room);
            foreach (var stay in stays)
            {
                if (!TryParseDate(stay.check_in, out var checkIn) || !TryParseDate(stay.check_out, out var checkOut))
                    continue;

                if (CoversNight(stay, day))
                    return status == "reserved" ? "Reserved" : "Occupied";

                if (day == checkOut && status is "checkout_pending" or "occupied")
                    return status == "checkout_pending" ? "Check-out" : "Occupied";
            }

            if (stays.Count > 0)
                return "Available";

            var today = DateOnly.FromDateTime(DateTime.Now);
            if (day != today)
                return "Available";

            return status switch
            {
                "occupied" => "Occupied",
                "reserved" => "Reserved",
                "checkout_pending" => "Check-out",
                "hold" => "Hold",
                _ => "Available",
            };
        }

        public static bool HasActiveBooking(OrganisationRoom room) =>
            Collect(room).Any(s => !s.closed);

        /// <summary>Ends the stay occupying today and marks the room available.</summary>
        public static void CompleteCheckout(OrganisationRoom room, DateOnly asOf)
        {
            var stays = Collect(room);
            var covering = stays.FirstOrDefault(s => !s.closed && CoversNight(s, asOf))
                ?? stays.FirstOrDefault(s =>
                    !s.closed
                    && TryParseDate(s.check_out, out var outDate)
                    && outDate == asOf);
            if (covering != null)
                covering.closed = true;

            room.status = "available";
            ApplyToRoom(room, stays, asOf);
        }

        public static Dictionary<string, int> OccupancyByDay(IEnumerable<OrganisationRoom> rooms, DateOnly monthStart)
        {
            var result = new Dictionary<string, int>();
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);
            for (var day = monthStart; day <= monthEnd; day = day.AddDays(1))
            {
                var busy = rooms.Count(r => GetAvailabilityState(r, day) != "Available");
                if (busy > 0)
                    result[day.ToString("yyyy-MM-dd")] = busy;
            }
            return result;
        }

        public static bool AnyStayCoversDay(OrganisationRoom room, DateOnly day) =>
            Collect(room).Any(s => CoversNight(s, day));

        public static bool AnyStayOnCheckoutMorning(OrganisationRoom room, DateOnly day) =>
            Collect(room).Any(s =>
                !s.closed
                && TryParseDate(s.check_out, out var outDate)
                && day == outDate);

        public static bool HasAnyStay(OrganisationRoom room) => Collect(room).Count > 0;

        public static bool RangesOverlap(DateOnly aStart, DateOnly aEnd, DateOnly bStart, DateOnly bEnd)
        {
            // Overnight nights are [start, end). Same-day hourly uses inclusive start.
            if (aEnd <= aStart)
                aEnd = aStart.AddDays(1);
            if (bEnd <= bStart)
                bEnd = bStart.AddDays(1);
            return aStart < bEnd && bStart < aEnd;
        }

        public static bool OverlapsAnyStay(OrganisationRoom room, DateOnly requestStart, DateOnly requestEnd) =>
            Collect(room).Any(s =>
                !s.closed &&
                TryParseDate(s.check_in, out var inDate) &&
                TryParseDate(s.check_out, out var outDate) &&
                RangesOverlap(requestStart, requestEnd, inDate, outDate));

        public static void PreserveStaysOnUpdate(OrganisationRoom incoming, OrganisationRoom existing)
        {
            incoming.guest ??= existing.guest;
            incoming.booking ??= existing.booking;
            incoming.payment ??= existing.payment;

            var existingStays = Collect(existing);
            if (existingStays.Count == 0 || incoming.booking == null)
                return;

            if (incoming.booking.stays is { Count: > 0 })
                return;

            incoming.booking.stays = existingStays;
        }

        static RoomStayRecord PickDisplayStay(List<RoomStayRecord> stays, DateOnly day)
        {
            var covering = stays.FirstOrDefault(s => CoversNight(s, day));
            if (covering != null)
                return covering;

            RoomStayRecord? soonestFuture = null;
            DateOnly? soonestIn = null;
            foreach (var stay in stays)
            {
                if (!TryParseDate(stay.check_in, out var inDate) || inDate < day)
                    continue;
                if (soonestIn == null || inDate < soonestIn)
                {
                    soonestIn = inDate;
                    soonestFuture = stay;
                }
            }
            if (soonestFuture != null)
                return soonestFuture;

            RoomStayRecord? latest = null;
            DateOnly? latestIn = null;
            foreach (var stay in stays)
            {
                if (!TryParseDate(stay.check_in, out var inDate))
                    continue;
                if (latestIn == null || inDate > latestIn)
                {
                    latestIn = inDate;
                    latest = stay;
                }
            }
            return latest;
        }

        static bool CoversNight(RoomStayRecord stay, DateOnly day)
        {
            if (stay.closed)
                return false;
            if (!TryParseDate(stay.check_in, out var checkIn) || !TryParseDate(stay.check_out, out var checkOut))
                return false;
            if (checkOut <= checkIn)
                return day == checkIn;
            return day >= checkIn && day < checkOut;
        }

        static bool HasHeaderStay(OrganisationRoom room) =>
            room.booking != null && HasDates(room.booking.check_in, room.booking.check_out);

        static bool HasDates(RoomStayRecord stay) => HasDates(stay.check_in, stay.check_out);

        static bool HasDates(string? checkIn, string? checkOut) =>
            TryParseDate(checkIn, out _) && TryParseDate(checkOut, out _);

        static RoomStayRecord FromRoomHeader(OrganisationRoom room) => new()
        {
            booking_id = room.booking?.booking_id ?? "",
            check_in = room.booking?.check_in ?? "",
            check_out = room.booking?.check_out ?? "",
            nights = room.booking?.nights ?? 0,
            guest = room.guest == null ? null : CloneGuest(room.guest),
            payment = room.payment == null ? null : ClonePayment(room.payment),
        };

        static RoomStayRecord Clone(RoomStayRecord stay) => new()
        {
            booking_id = stay.booking_id,
            booking_guid = stay.booking_guid,
            check_in = stay.check_in,
            check_out = stay.check_out,
            nights = stay.nights,
            guest = stay.guest == null ? null : CloneGuest(stay.guest),
            payment = stay.payment == null ? null : ClonePayment(stay.payment),
            package_ids = stay.package_ids?.ToList() ?? [],
            user_id = stay.user_id,
            closed = stay.closed,
        };

        static RoomGuestData CloneGuest(RoomGuestData guest) => new()
        {
            name = guest.name,
            phone = guest.phone,
            email = guest.email,
        };

        static RoomPaymentData ClonePayment(RoomPaymentData payment) => new()
        {
            total = payment.total,
            paid = payment.paid,
            balance = payment.balance,
        };

        public static bool TryParseDate(string? value, out DateOnly date)
        {
            date = default;
            if (string.IsNullOrWhiteSpace(value))
                return false;
            var trimmed = value.Trim();
            if (trimmed.Length >= 10
                && trimmed[4] == '-'
                && trimmed[7] == '-'
                && DateOnly.TryParse(trimmed[..10], out date))
            {
                return true;
            }
            return DateOnly.TryParse(trimmed, out date);
        }
    }
}
