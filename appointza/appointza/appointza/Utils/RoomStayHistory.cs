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
            var open = stays.Where(IsOccupyingStay).ToList();
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
            // Prefer an overnight covering stay; on turnover day also surface the departing stay.
            var covering = stays.FirstOrDefault(s => CoversNight(s, asOf))
                ?? stays.FirstOrDefault(s => IsCheckoutMorning(s, asOf));
            if (covering == null)
            {
                // Do not keep a sticky guest from another date on the board.
                room.booking.booking_id = "";
                room.booking.check_in = "";
                room.booking.check_out = "";
                room.booking.nights = 0;
                room.guest = null;
                room.payment = null;
                return;
            }

            room.booking.booking_id = covering.booking_id;
            room.booking.check_in = covering.check_in;
            room.booking.check_out = covering.check_out;
            room.booking.nights = covering.nights;
            room.guest = covering.guest == null ? null : CloneGuest(covering.guest);
            room.payment = covering.payment == null ? null : ClonePayment(covering.payment);
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
                if (stay.closed)
                    continue;
                if (!TryParseDate(stay.check_in, out _) || !TryParseDate(stay.check_out, out var checkOut))
                    continue;

                if (CoversNight(stay, day))
                    return status == "reserved" ? "Reserved" : "Occupied";

                // Checkout morning: show departing stay so turnover days are visible.
                if (day == checkOut)
                    return "Check-out";
            }

            if (stays.Any(s => !s.closed))
                return "Available";
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
            Collect(room).Any(IsOccupyingStay);

        /// <summary>Ends open stays and marks the room available (ops checkout).</summary>
        public static void CompleteCheckout(OrganisationRoom room, DateOnly asOf)
        {
            var stays = Collect(room);
            // Close the stay for today; if none match the window, close every open stay
            // so the board cannot keep showing Occupied after Checkout → Available.
            var matched = false;
            foreach (var stay in stays.Where(IsOccupyingStay))
            {
                var onCheckoutMorning =
                    TryParseDate(stay.check_out, out var outDate) && outDate == asOf;
                if (CoversNight(stay, asOf) || onCheckoutMorning)
                {
                    stay.closed = true;
                    stay.status = "checked_out";
                    matched = true;
                }
            }
            if (!matched)
            {
                foreach (var stay in stays.Where(IsOccupyingStay))
                {
                    stay.closed = true;
                    if (string.IsNullOrWhiteSpace(stay.status)
                        || stay.status is "reserved" or "confirmed" or "checked_in" or "modification_requested")
                        stay.status = "checked_out";
                }
            }
            else
            {
                foreach (var stay in stays.Where(s => s.closed
                             && (string.IsNullOrWhiteSpace(s.status)
                                 || s.status is "reserved" or "confirmed" or "checked_in" or "modification_requested")))
                    stay.status = "checked_out";
            }

            room.status = "available";
            room.guest = null;
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
            Collect(room).Any(s => IsCheckoutMorning(s, day));

        static bool IsCheckoutMorning(RoomStayRecord stay, DateOnly day) =>
            IsOccupyingStay(stay)
            && TryParseDate(stay.check_out, out var outDate)
            && day == outDate;

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

        /// <summary>Half-open interval overlap: [aStart, aEnd) vs [bStart, bEnd).</summary>
        public static bool TimestampRangesOverlap(DateTime aStart, DateTime aEnd, DateTime bStart, DateTime bEnd) =>
            aStart < aEnd && bStart < bEnd && aStart < bEnd && bStart < aEnd;

        public static bool OverlapsAnyStay(OrganisationRoom room, DateOnly requestStart, DateOnly requestEnd) =>
            Collect(room).Any(s =>
                IsOccupyingStay(s) &&
                TryParseDate(s.check_in, out var inDate) &&
                TryParseDate(s.check_out, out var outDate) &&
                RangesOverlap(requestStart, requestEnd, inDate, outDate));

        /// <summary>
        /// Hourly / timed stays: compare full datetime windows using stay check_in_time / check_out_time when present.
        /// Falls back to date-only overnight overlap when stays have no times.
        /// </summary>
        public static bool OverlapsAnyStayWindow(OrganisationRoom room, DateTime windowStart, DateTime windowEnd)
        {
            if (windowEnd <= windowStart)
                return false;

            foreach (var stay in Collect(room).Where(IsOccupyingStay))
            {
                if (!TryGetStayWindow(stay, out var stayStart, out var stayEnd))
                    continue;

                // Same-day hourly stays with times: use precise timestamp overlap.
                var requestSameDay = DateOnly.FromDateTime(windowStart) == DateOnly.FromDateTime(windowEnd)
                    || windowEnd.Date == windowStart.Date;
                var staySameDay = stayStart.Date == stayEnd.Date;
                var hasStayTimes = !string.IsNullOrWhiteSpace(stay.check_in_time)
                    || !string.IsNullOrWhiteSpace(stay.check_out_time)
                    || staySameDay;

                if (requestSameDay || hasStayTimes)
                {
                    if (TimestampRangesOverlap(windowStart, windowEnd, stayStart, stayEnd))
                        return true;
                    continue;
                }

                // Overnight date-only: [check-in, check-out) nights.
                if (RangesOverlap(
                        DateOnly.FromDateTime(windowStart),
                        DateOnly.FromDateTime(windowEnd),
                        DateOnly.FromDateTime(stayStart),
                        DateOnly.FromDateTime(stayEnd)))
                    return true;
            }

            return false;
        }

        public static bool TryGetStayWindow(RoomStayRecord stay, out DateTime start, out DateTime end)
        {
            start = default;
            end = default;
            if (!TryParseDate(stay.check_in, out var inDate) || !TryParseDate(stay.check_out, out var outDate))
                return false;

            var inTime = ParseTimeOrDefault(stay.check_in_time, new TimeOnly(14, 0));
            var outTime = ParseTimeOrDefault(stay.check_out_time, outDate <= inDate ? new TimeOnly(17, 0) : new TimeOnly(11, 0));
            start = inDate.ToDateTime(inTime);
            end = outDate.ToDateTime(outTime);
            if (end <= start && outDate <= inDate)
            {
                // Same-day stay missing/invalid end time — treat as a one-hour block so we don't block the whole day incorrectly.
                end = start.AddHours(1);
            }
            return end > start;
        }

        static TimeOnly ParseTimeOrDefault(string? value, TimeOnly fallback)
        {
            if (string.IsNullOrWhiteSpace(value))
                return fallback;
            var trimmed = value.Trim();
            if (TimeOnly.TryParse(trimmed, out var parsed))
                return parsed;
            if (trimmed.Length >= 5 && TimeOnly.TryParse(trimmed[..5], out parsed))
                return parsed;
            return fallback;
        }

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
            if (!IsOccupyingStay(stay))
                return false;
            if (!TryParseDate(stay.check_in, out var checkIn) || !TryParseDate(stay.check_out, out var checkOut))
                return false;
            if (checkOut <= checkIn)
                return day == checkIn;
            return day >= checkIn && day < checkOut;
        }

        /// <summary>Open stays that still block inventory (not cancelled / checked out / no-show).</summary>
        public static bool IsOccupyingStay(RoomStayRecord stay)
        {
            if (stay.closed)
                return false;
            var status = (stay.status ?? "").Trim().ToLowerInvariant();
            return status is not ("cancelled" or "no_show" or "checked_out");
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
            check_in_time = stay.check_in_time ?? "",
            check_out_time = stay.check_out_time ?? "",
            nights = stay.nights,
            persons = stay.persons,
            guest = stay.guest == null ? null : CloneGuest(stay.guest),
            payment = stay.payment == null ? null : ClonePayment(stay.payment),
            package_ids = stay.package_ids?.ToList() ?? [],
            user_id = stay.user_id,
            status = string.IsNullOrWhiteSpace(stay.status) ? (stay.closed ? "checked_out" : "reserved") : stay.status,
            cancel_reason = stay.cancel_reason ?? "",
            modify_request_note = stay.modify_request_note ?? "",
            requested_check_in = stay.requested_check_in ?? "",
            requested_check_out = stay.requested_check_out ?? "",
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
