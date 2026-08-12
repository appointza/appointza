namespace appointza.Services
{
    public static class HospitalityBookingTimeHelper
    {
        public static string Resolve(string? requested, string propertyDefault)
        {
            if (TryNormalize(requested, out var normalized))
                return normalized;
            if (TryNormalize(propertyDefault, out var fromOrg))
                return fromOrg;
            return "14:00";
        }

        public static bool TryNormalize(string? value, out string hhmm)
        {
            hhmm = "";
            if (string.IsNullOrWhiteSpace(value))
                return false;

            var trimmed = value.Trim();
            if (TimeOnly.TryParse(trimmed, out var time))
            {
                hhmm = time.ToString("HH:mm");
                return true;
            }

            return false;
        }

        public static TimeOnly ParseTimeOrDefault(string? value, string fallback = "14:00")
        {
            if (TryNormalize(value, out var normalized))
                return TimeOnly.Parse(normalized);
            if (TryNormalize(fallback, out var fromFallback))
                return TimeOnly.Parse(fromFallback);
            return new TimeOnly(14, 0);
        }

        public static int CountNights(DateOnly checkIn, DateOnly checkOut, TimeOnly checkInTime, TimeOnly checkOutTime)
        {
            var start = checkIn.ToDateTime(checkInTime);
            var end = checkOut.ToDateTime(checkOutTime);
            if (end <= start)
                throw new ArgumentException("Check-out must be after check-in (date and time).");

            if (checkOut > checkIn)
                return checkOut.DayNumber - checkIn.DayNumber;

            return 1;
        }

        public static int CountHours(DateOnly startDate, DateOnly endDate, TimeOnly startTime, TimeOnly endTime)
        {
            var start = startDate.ToDateTime(startTime);
            var end = endDate.ToDateTime(endTime);
            if (end <= start)
                throw new ArgumentException("End time must be after start time.");

            var hours = (end - start).TotalHours;
            return Math.Max(1, (int)Math.Ceiling(hours - 1e-9));
        }
    }
}
