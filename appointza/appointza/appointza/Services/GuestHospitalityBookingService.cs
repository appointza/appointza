using appointza.Models.Hospitality;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class GuestHospitalityBookingService
    {
        readonly IDbProvider dbprovider;
        readonly OrganisationRoomService roomService;
        readonly OrganisationHospitalityContentService hospitalityContentService;

        static readonly HashSet<string> BlockedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "occupied", "reserved", "checkout_pending", "cleaning", "maintenance", "blocked", "hold",
        };

        public GuestHospitalityBookingService(
            IDbProvider dbprovider,
            OrganisationRoomService roomService,
            OrganisationHospitalityContentService hospitalityContentService)
        {
            this.dbprovider = dbprovider;
            this.roomService = roomService;
            this.hospitalityContentService = hospitalityContentService;
        }

        public async Task<object> Index(GuestHospitalityBookingIndexReq req)
        {
            ValidateScope(req.organisation_id, req.organisation_location_id);

            var profile = await hospitalityContentService.GetProfile(req.organisation_id);
            var resolvedCheckIn = req.check_in ?? DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1).ToString("yyyy-MM-dd");
            var resolvedCheckOut = req.check_out ?? DateOnly.FromDateTime(DateTime.UtcNow).AddDays(2).ToString("yyyy-MM-dd");

            var rooms = await GetBookableRooms(
                req.organisation_id,
                req.organisation_location_id,
                resolvedCheckIn,
                resolvedCheckOut,
                req.check_in_time,
                req.check_out_time,
                profile);

            var packages = profile.packages.Where(p => p.is_active).OrderBy(p => p.sort_order).ToList();
            var selectedPackage = packages.FirstOrDefault(p => p.id == req.package_id);

            PublicBookableRoom? selectedRoom = null;
            if (!string.IsNullOrWhiteSpace(req.room_id))
                selectedRoom = rooms.FirstOrDefault(r => string.Equals(r.id, req.room_id, StringComparison.OrdinalIgnoreCase));

            var orgInfo = await GetOrganisationInfo(req.organisation_id);
            var locationInfo = await GetLocationInfo(req.organisation_location_id);

            return new
            {
                organisation = new
                {
                    id = req.organisation_id,
                    name = orgInfo,
                    location_id = req.organisation_location_id,
                    location_name = locationInfo,
                    booking_type = profile.booking_type,
                    minimum_hours = profile.minimum_hours,
                    check_in_time = NormalizeTimeDisplay(profile.checkin_time),
                    check_out_time = NormalizeTimeDisplay(profile.checkout_time),
                    overnight_time_mode = profile.overnight_time_mode,
                    cancellation_policy = profile.cancellation_policy,
                    payment_policy = profile.payment_policy,
                    packages = packages,
                    guest_services = profile.guest_services.Where(s => s.is_active).OrderBy(s => s.sort_order).ToList(),
                },
                rooms,
                packages,
                selected_room_id = selectedRoom?.id,
                selected_package_id = selectedPackage?.id,
                check_in = resolvedCheckIn,
                check_out = resolvedCheckOut,
                check_in_time = req.check_in_time,
                check_out_time = req.check_out_time,
                requested_room_id = req.room_id,
                requested_room_available = selectedRoom != null,
            };
        }

        public async Task<HospitalityBookingQuote> Quote(GuestHospitalityBookingQuoteReq req)
        {
            ValidateScope(req.organisation_id, req.organisation_location_id);

            var profile = await hospitalityContentService.GetProfile(req.organisation_id);
            var (checkIn, checkOut, checkInTime, checkOutTime, inDate, outDate) =
                NormalizeWindow(profile, req.check_in, req.check_out, req.check_in_time, req.check_out_time);

            var room = await TryGetBookableRoom(
                req.organisation_id,
                req.organisation_location_id,
                req.room_id,
                checkIn,
                checkOut,
                checkInTime,
                checkOutTime,
                profile);

            return HospitalityBookingCalculator.Compute(
                inDate,
                outDate,
                req.persons,
                req.extra_beds,
                room,
                profile.packages,
                req.package_ids,
                profile.guest_services,
                req.guest_service_ids,
                checkInTime,
                checkOutTime,
                profile.booking_type,
                profile.minimum_hours);
        }

        public async Task<GuestHospitalityBookingResult> Create(GuestHospitalityBookingCreateReq req)
        {
            ValidateScope(req.organisation_id, req.organisation_location_id);

            if (string.IsNullOrWhiteSpace(req.guest_name))
                throw new ArgumentException("Guest name is required.");
            if (string.IsNullOrWhiteSpace(req.phone))
                throw new ArgumentException("Phone number is required.");

            var phoneDigits = new string(req.phone.Where(char.IsDigit).ToArray());
            if (phoneDigits.Length < 10)
                throw new ArgumentException("Enter a valid phone number.");

            var profile = await hospitalityContentService.GetProfile(req.organisation_id);
            var (checkIn, checkOut, checkInTime, checkOutTime, inDate, outDate) =
                NormalizeWindow(profile, req.check_in, req.check_out, req.check_in_time, req.check_out_time);

            var room = await TryGetBookableRoom(
                req.organisation_id,
                req.organisation_location_id,
                req.room_id,
                checkIn,
                checkOut,
                checkInTime,
                checkOutTime,
                profile) ?? throw new ArgumentException("Selected room is not available for these dates.");

            var quote = HospitalityBookingCalculator.Compute(
                inDate,
                outDate,
                req.persons,
                req.extra_beds,
                room,
                profile.packages,
                req.package_ids,
                profile.guest_services,
                req.guest_service_ids,
                checkInTime,
                checkOutTime,
                profile.booking_type,
                profile.minimum_hours);

            var bookingCode = GenerateBookingCode();
            var bookingId = Guid.NewGuid().ToString("N");

            room.status = "reserved";
            room.guest = new RoomGuestData
            {
                name = req.guest_name.Trim(),
                phone = req.phone.Trim(),
                email = string.IsNullOrWhiteSpace(req.email) ? null : req.email.Trim(),
            };
            room.booking = new RoomBookingData
            {
                booking_id = bookingCode,
                check_in = checkIn,
                check_out = checkOut,
                nights = quote.nights,
            };
            room.payment = new RoomPaymentData
            {
                total = quote.total,
                paid = 0,
                balance = quote.total,
            };

            await roomService.Save(room);

            return new GuestHospitalityBookingResult
            {
                booking_code = bookingCode,
                booking_id = bookingId,
                room_number = room.room_number,
                room_name = room.room_name,
                quote = quote,
                guest_name = room.guest.name,
                check_in = checkIn,
                check_out = checkOut,
                check_in_time = checkInTime,
                check_out_time = checkOutTime,
                persons = req.persons,
                extra_beds = req.extra_beds,
            };
        }

        async Task<List<PublicBookableRoom>> GetBookableRooms(
            long organisationId,
            long locationId,
            string checkIn,
            string checkOut,
            string? checkInTime,
            string? checkOutTime,
            OrganisationHospitalityProfile profile)
        {
            if (!HasValidWindow(checkIn, checkOut, checkInTime, checkOutTime, profile, out var windowStart, out var windowEnd))
                return [];

            var allRooms = await roomService.Select(new OrganisationRoomSelectReq
            {
                organisation_id = organisationId,
                organisation_location_id = locationId,
            });

            return allRooms
                .Where(IsStructurallyBookable)
                .Where(r => !HasRoomConflict(r, windowStart, windowEnd))
                .OrderBy(r => r.floor_number)
                .ThenBy(r => r.room_number)
                .Select(ToPublicRoom)
                .ToList();
        }

        async Task<OrganisationRoom?> TryGetBookableRoom(
            long organisationId,
            long locationId,
            string? roomId,
            string checkIn,
            string checkOut,
            string checkInTime,
            string checkOutTime,
            OrganisationHospitalityProfile profile)
        {
            if (string.IsNullOrWhiteSpace(roomId))
                return null;

            if (!HasValidWindow(checkIn, checkOut, checkInTime, checkOutTime, profile, out var windowStart, out var windowEnd))
                return null;

            var allRooms = await roomService.Select(new OrganisationRoomSelectReq
            {
                organisation_id = organisationId,
                organisation_location_id = locationId,
            });

            var room = allRooms.FirstOrDefault(r => RoomCodeMatches(r, roomId));
            if (room == null || !IsStructurallyBookable(room) || HasRoomConflict(room, windowStart, windowEnd))
                return null;

            return room;
        }

        static bool IsStructurallyBookable(OrganisationRoom room) =>
            room.isactive && !BlockedStatuses.Contains(room.status);

        static bool HasRoomConflict(OrganisationRoom room, DateTime windowStart, DateTime windowEnd)
        {
            if (room.booking == null)
                return false;

            if (!DateOnly.TryParse(room.booking.check_in, out var checkIn) ||
                !DateOnly.TryParse(room.booking.check_out, out var checkOut))
            {
                return BlockedStatuses.Contains(room.status);
            }

            var existingStart = checkIn.ToDateTime(TimeOnly.MinValue);
            var existingEnd = checkOut.ToDateTime(TimeOnly.MinValue);
            return existingStart < windowEnd && existingEnd > windowStart;
        }

        static bool HasValidWindow(
            string checkIn,
            string checkOut,
            string? checkInTime,
            string? checkOutTime,
            OrganisationHospitalityProfile profile,
            out DateTime windowStart,
            out DateTime windowEnd)
        {
            windowStart = default;
            windowEnd = default;

            if (!HospitalityBookingCalculator.TryParseDate(checkIn, out var inDate) ||
                !HospitalityBookingCalculator.TryParseDate(checkOut, out var outDate))
                return false;

            var hourly = string.Equals(profile.booking_type, "hourly", StringComparison.OrdinalIgnoreCase);
            var resolvedCheckInTime = HospitalityBookingTimeHelper.Resolve(
                checkInTime,
                NormalizeTimeDisplay(profile.checkin_time));
            var resolvedCheckOutTime = HospitalityBookingTimeHelper.Resolve(
                checkOutTime,
                NormalizeTimeDisplay(profile.checkout_time));

            if (hourly && outDate < inDate)
                outDate = inDate;

            var inTime = HospitalityBookingTimeHelper.ParseTimeOrDefault(resolvedCheckInTime);
            var outTime = HospitalityBookingTimeHelper.ParseTimeOrDefault(resolvedCheckOutTime);
            windowStart = inDate.ToDateTime(inTime);
            windowEnd = outDate.ToDateTime(outTime);
            return windowEnd > windowStart;
        }

        static (string checkIn, string checkOut, string checkInTime, string checkOutTime, DateOnly inDate, DateOnly outDate)
            NormalizeWindow(
                OrganisationHospitalityProfile profile,
                string checkIn,
                string checkOut,
                string? checkInTime,
                string? checkOutTime)
        {
            var hourly = string.Equals(profile.booking_type, "hourly", StringComparison.OrdinalIgnoreCase);
            string resolvedCheckInTime;
            string resolvedCheckOutTime;

            if (hourly)
            {
                if (string.IsNullOrWhiteSpace(checkOut))
                    checkOut = checkIn;
                resolvedCheckInTime = HospitalityBookingTimeHelper.Resolve(checkInTime, "14:00");
                resolvedCheckOutTime = HospitalityBookingTimeHelper.Resolve(checkOutTime, "17:00");
            }
            else
            {
                var fixedTimes = !string.Equals(profile.overnight_time_mode, "dynamic", StringComparison.OrdinalIgnoreCase);
                resolvedCheckInTime = fixedTimes
                    ? HospitalityBookingTimeHelper.Resolve(null, NormalizeTimeDisplay(profile.checkin_time))
                    : HospitalityBookingTimeHelper.Resolve(checkInTime, NormalizeTimeDisplay(profile.checkin_time));
                resolvedCheckOutTime = fixedTimes
                    ? HospitalityBookingTimeHelper.Resolve(null, NormalizeTimeDisplay(profile.checkout_time))
                    : HospitalityBookingTimeHelper.Resolve(checkOutTime, NormalizeTimeDisplay(profile.checkout_time));
            }

            if (!HospitalityBookingCalculator.TryParseDate(checkIn, out var inDate) ||
                !HospitalityBookingCalculator.TryParseDate(checkOut, out var outDate))
            {
                throw new ArgumentException(
                    hourly
                        ? "Enter a valid booking date."
                        : "Enter valid check-in and check-out dates.");
            }

            if (hourly && outDate < inDate)
                outDate = inDate;

            return (
                inDate.ToString("yyyy-MM-dd"),
                outDate.ToString("yyyy-MM-dd"),
                resolvedCheckInTime,
                resolvedCheckOutTime,
                inDate,
                outDate);
        }

        static PublicBookableRoom ToPublicRoom(OrganisationRoom room) => new()
        {
            id = ResolveRoomCode(room),
            room_number = room.room_number,
            room_name = room.room_name,
            room_type = room.room_type,
            floor_number = room.floor_number,
            capacity = room.capacity ?? new RoomCapacityData(),
            pricing = room.pricing ?? new RoomPricingData(),
            amenities = room.amenities ?? [],
            main_photo = room.main_photo ?? "",
            gallery_photos = room.gallery_photos ?? [],
        };

        static string ResolveRoomCode(OrganisationRoom room)
        {
            if (!string.IsNullOrWhiteSpace(room.booking_rules?.room_code))
                return room.booking_rules.room_code.Trim();
            var slug = room.room_number.Trim().ToLowerInvariant().Replace(' ', '-');
            return string.IsNullOrWhiteSpace(slug) ? $"room-{room.id}" : $"room-{slug}";
        }

        static bool RoomCodeMatches(OrganisationRoom room, string roomId) =>
            string.Equals(ResolveRoomCode(room), roomId.Trim(), StringComparison.OrdinalIgnoreCase);

        static string GenerateBookingCode() =>
            $"BK-{DateTime.UtcNow:yyMMdd}-{Random.Shared.Next(1000, 9999)}";

        static void ValidateScope(long organisationId, long locationId)
        {
            if (organisationId <= 0)
                throw new ArgumentException("organisation_id is required.");
            if (locationId <= 0)
                throw new ArgumentException("organisation_location_id is required.");
        }

        static string NormalizeTimeDisplay(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return "14:00";
            if (TimeOnly.TryParse(value.Trim(), out var time))
                return time.ToString("HH:mm");
            return value.Trim();
        }

        async Task<string> GetOrganisationInfo(long organisationId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            DbCommand command = db.GetCommand(@"
                SELECT name FROM Organisation
                WHERE id = @id AND isactive = true
                LIMIT 1");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationId;

            using DbDataReader reader = await db.Execute(command);
            if (await reader.ReadAsync())
                return reader["name"]?.ToString() ?? "Property";

            return "Property";
        }

        async Task<string> GetLocationInfo(long locationId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            DbCommand command = db.GetCommand(@"
                SELECT name FROM organisationlocation
                WHERE id = @id AND isactive = true
                LIMIT 1");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = locationId;

            using DbDataReader reader = await db.Execute(command);
            if (await reader.ReadAsync())
                return reader["name"]?.ToString() ?? "Location";

            return "Location";
        }
    }
}
