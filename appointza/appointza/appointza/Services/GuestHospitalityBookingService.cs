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
        readonly RequestState requeststate;

        /// <summary>
        /// Permanent / operational blocks only. Occupied/reserved/etc. are date-window conflicts,
        /// not a ban on booking other dates.
        /// </summary>
        static readonly HashSet<string> StructurallyBlockedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "maintenance", "blocked",
        };

        public GuestHospitalityBookingService(
            IDbProvider dbprovider,
            OrganisationRoomService roomService,
            OrganisationHospitalityContentService hospitalityContentService,
            RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.roomService = roomService;
            this.hospitalityContentService = hospitalityContentService;
            this.requeststate = requeststate;
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

            var requestedAvailable = selectedRoom != null && selectedRoom.available_for_dates;

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
                requested_room_available = requestedAvailable,
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

            if (!string.IsNullOrWhiteSpace(req.room_id) && room == null)
            {
                // Distinguish "unknown room" vs "dates conflict" for clearer guest messaging.
                var allRooms = await roomService.Select(new OrganisationRoomSelectReq
                {
                    organisation_id = req.organisation_id,
                    organisation_location_id = req.organisation_location_id,
                });
                var exists = allRooms.Any(r => RoomCodeMatches(r, req.room_id) && IsStructurallyBookable(r));
                if (exists)
                    throw new ArgumentException(
                        "This room is not available for the selected dates. Please choose different dates.");
            }

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
                profile) ?? throw new ArgumentException(
                    "Selected room is not available for these dates. Choose different dates or another room.");

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

            var guest = new RoomGuestData
            {
                name = req.guest_name.Trim(),
                phone = req.phone.Trim(),
                email = string.IsNullOrWhiteSpace(req.email) ? null : req.email.Trim(),
            };
            var payment = new RoomPaymentData
            {
                total = quote.total,
                paid = 0,
                balance = quote.total,
            };
            var stays = RoomStayHistory.Collect(room);
            var loggedInUserId = requeststate.usercontext?.userid > 0
                ? requeststate.usercontext.userid
                : 0;
            stays.Add(new RoomStayRecord
            {
                booking_id = bookingCode,
                booking_guid = bookingId,
                check_in = checkIn,
                check_out = checkOut,
                nights = quote.nights,
                guest = guest,
                payment = payment,
                package_ids = req.package_ids ?? [],
                user_id = loggedInUserId,
            });
            room.status = "reserved";
            RoomStayHistory.ApplyToRoom(room, stays, DateOnly.FromDateTime(DateTime.Now));

            await roomService.Save(room);

            return new GuestHospitalityBookingResult
            {
                booking_code = bookingCode,
                booking_id = bookingId,
                room_number = room.room_number,
                room_name = room.room_name,
                quote = quote,
                guest_name = guest.name,
                check_in = checkIn,
                check_out = checkOut,
                check_in_time = checkInTime,
                check_out_time = checkOutTime,
                persons = req.persons,
                extra_beds = req.extra_beds,
            };
        }

        public async Task<List<GuestHospitalityBookingMineItem>> ListMine()
        {
            var ctx = requeststate.usercontext;
            if (ctx == null || ctx.userid <= 0)
                throw new UnauthorizedAccessException("Sign in to view your room bookings.");

            var email = (ctx.useremail ?? "").Trim().ToLowerInvariant();
            var phoneDigits = new string((ctx.usermobile ?? "").Where(char.IsDigit).ToArray());
            var phoneTail = phoneDigits.Length >= 10 ? phoneDigits[^10..] : phoneDigits;

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await HospitalitySchemaBootstrap.EnsureSchemaTransaction(db);

            var query = @"
                SELECT r.id, r.organisation_id, r.organisation_location_id, r.room_number, r.room_name,
                       r.room_type, r.status, r.booking, r.guest, r.payment,
                       COALESCE(o.name, 'Property') AS organisation_name,
                       COALESCE(ol.name, '') AS location_name,
                       COALESCE(ol.city, '') AS city,
                       COALESCE(ol.state, '') AS state
                FROM organisation_rooms r
                LEFT JOIN Organisation o ON o.id = r.organisation_id
                LEFT JOIN organisationlocation ol ON ol.id = r.organisation_location_id
                WHERE r.isactive = TRUE
                  AND (
                    (@phone_tail <> '' AND (
                      regexp_replace(COALESCE(r.guest->>'phone', ''), '[^0-9]', '', 'g') LIKE '%' || @phone_tail
                      OR regexp_replace(COALESCE(r.booking::text, ''), '[^0-9]', '', 'g') LIKE '%' || @phone_tail
                    ))
                    OR (@email <> '' AND (
                      lower(trim(COALESCE(r.guest->>'email', ''))) = @email
                      OR lower(r.booking::text) LIKE '%' || @email || '%'
                    ))
                    OR (@userid > 0 AND (
                      r.booking::text LIKE '%""user_id"":' || @userid_text || '%'
                      OR r.booking::text LIKE '%""user_id"": ' || @userid_text || '%'
                    ))
                  )";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "phone_tail", DbTypes.Types.String).Value = phoneTail;
            db.AddParameter(command, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(command, "userid", DbTypes.Types.Long).Value = ctx.userid;
            db.AddParameter(command, "userid_text", DbTypes.Types.String).Value = ctx.userid.ToString();

            var items = new List<GuestHospitalityBookingMineItem>();
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    var room = new OrganisationRoom
                    {
                        id = Convert.ToInt64(reader["id"]),
                        organisation_id = Convert.ToInt64(reader["organisation_id"]),
                        organisation_location_id = Convert.ToInt64(reader["organisation_location_id"]),
                        room_number = reader["room_number"]?.ToString() ?? "",
                        room_name = reader["room_name"]?.ToString() ?? "",
                        room_type = reader["room_type"]?.ToString() ?? "",
                        status = reader["status"]?.ToString() ?? "",
                    };
                    room.booking_json = reader["booking"] == DBNull.Value ? "null" : reader["booking"].ToString() ?? "null";
                    room.guest_json = reader["guest"] == DBNull.Value ? "null" : reader["guest"].ToString() ?? "null";
                    room.payment_json = reader["payment"] == DBNull.Value ? "null" : reader["payment"].ToString() ?? "null";

                    var orgName = reader["organisation_name"]?.ToString() ?? "Property";
                    var locationName = reader["location_name"]?.ToString() ?? "";
                    var city = reader["city"]?.ToString() ?? "";
                    var state = reader["state"]?.ToString() ?? "";

                    var stays = RoomStayHistory.Collect(room);
                    if (stays.Count == 0 && StayGuestMatches(room.guest, email, phoneTail))
                    {
                        stays.Add(new RoomStayRecord
                        {
                            booking_id = room.booking?.booking_id ?? "",
                            check_in = room.booking?.check_in ?? "",
                            check_out = room.booking?.check_out ?? "",
                            nights = room.booking?.nights ?? 0,
                            guest = room.guest,
                            payment = room.payment,
                            user_id = ctx.userid,
                        });
                    }

                    foreach (var stay in stays)
                    {
                        if (!StayMatches(stay, ctx.userid, email, phoneTail))
                            continue;

                        items.Add(ToMineItem(room, stay, orgName, locationName, city, state));
                    }
                }
            }

            return items
                .GroupBy(i => string.IsNullOrWhiteSpace(i.booking_guid) ? $"{i.room_id}:{i.booking_id}:{i.check_in}" : i.booking_guid)
                .Select(g => g.First())
                .OrderByDescending(i => i.check_in)
                .ThenByDescending(i => i.booking_id)
                .ToList();
        }

        static bool StayMatches(RoomStayRecord stay, long userId, string email, string phoneTail)
        {
            if (userId > 0 && stay.user_id == userId)
                return true;
            return StayGuestMatches(stay.guest, email, phoneTail);
        }

        static bool StayGuestMatches(RoomGuestData? guest, string email, string phoneTail)
        {
            if (guest == null)
                return false;
            if (!string.IsNullOrEmpty(email)
                && string.Equals((guest.email ?? "").Trim(), email, StringComparison.OrdinalIgnoreCase))
                return true;
            var digits = new string((guest.phone ?? "").Where(char.IsDigit).ToArray());
            if (phoneTail.Length >= 10 && digits.Length >= 10 && digits.EndsWith(phoneTail, StringComparison.Ordinal))
                return true;
            if (phoneTail.Length is > 0 and < 10 && digits == phoneTail)
                return true;
            return false;
        }

        static GuestHospitalityBookingMineItem ToMineItem(
            OrganisationRoom room,
            RoomStayRecord stay,
            string orgName,
            string locationName,
            string city,
            string state)
        {
            var guest = stay.guest ?? room.guest;
            var payment = stay.payment ?? room.payment;
            var status = stay.closed
                ? "completed"
                : string.IsNullOrWhiteSpace(room.status) ? "reserved" : room.status;
            return new GuestHospitalityBookingMineItem
            {
                booking_id = stay.booking_id,
                booking_guid = stay.booking_guid,
                organisation_id = room.organisation_id,
                organisation_location_id = room.organisation_location_id,
                organisation_name = orgName,
                location_name = locationName,
                city = city,
                state = state,
                room_id = room.id,
                room_number = room.room_number,
                room_name = room.room_name,
                room_type = room.room_type,
                guest_name = guest?.name ?? "",
                phone = guest?.phone ?? "",
                email = guest?.email ?? "",
                check_in = stay.check_in,
                check_out = stay.check_out,
                nights = stay.nights,
                closed = stay.closed,
                status = status,
                total = payment?.total ?? 0,
                paid = payment?.paid ?? 0,
                balance = payment?.balance ?? 0,
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
                .OrderBy(r => r.floor_number)
                .ThenBy(r => r.room_number)
                .Select(r =>
                {
                    var pub = ToPublicRoom(r);
                    pub.available_for_dates = !HasRoomConflict(r, windowStart, windowEnd);
                    return pub;
                })
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
            if (room == null || !IsStructurallyBookable(room))
                return null;

            if (HasRoomConflict(room, windowStart, windowEnd))
                return null;

            return room;
        }

        static bool IsStructurallyBookable(OrganisationRoom room) =>
            room.isactive && !StructurallyBlockedStatuses.Contains(room.status ?? "");

        /// <summary>
        /// Match organisation appointments board (<c>getRoomAvailabilityState</c>):
        /// a stay is blocked when any requested night is not Available.
        /// </summary>
        static bool HasRoomConflict(OrganisationRoom room, DateTime windowStart, DateTime windowEnd)
        {
            var requestStart = DateOnly.FromDateTime(windowStart);
            var requestEnd = DateOnly.FromDateTime(windowEnd);

            if (RoomStayHistory.OverlapsAnyStay(room, requestStart, requestEnd))
                return true;

            // Hourly same calendar day — check that one day.
            if (requestEnd <= requestStart)
                return !IsDayAvailableForGuest(room, requestStart);

            // Overnight nights: [check-in date, check-out date)
            for (var day = requestStart; day < requestEnd; day = day.AddDays(1))
            {
                if (!IsDayAvailableForGuest(room, day))
                    return true;
            }

            return false;
        }

        /// <summary>
        /// Mirrors appointza-ui-canvas getRoomAvailabilityState → "Available".
        /// </summary>
        static bool IsDayAvailableForGuest(OrganisationRoom room, DateOnly day)
        {
            var status = (room.status ?? "").Trim().ToLowerInvariant();

            if (status is "maintenance" or "blocked")
                return false;
            if (status == "cleaning")
                return false;

            if (RoomStayHistory.HasAnyStay(room))
            {
                if (RoomStayHistory.AnyStayCoversDay(room, day))
                    return false;

                // Org board: checkout morning still occupied / check-out pending
                if (RoomStayHistory.AnyStayOnCheckoutMorning(room, day) &&
                    status is "occupied" or "checkout_pending")
                    return false;

                return true;
            }

            // No valid stay dates — status only affects "today" (same as org UI).
            var today = DateOnly.FromDateTime(DateTime.Now);
            if (day != today)
                return true;

            return status is not ("occupied" or "reserved" or "checkout_pending" or "hold");
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
