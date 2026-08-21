using appointza.Models.Hospitality;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class OrganisationRoomService
    {
        readonly IDbProvider dbprovider;
        readonly RequestState requeststate;

        static readonly string[] ValidStatuses =
        [
            "available", "reserved", "occupied", "checkout_pending",
            "cleaning", "maintenance", "blocked", "hold",
        ];

        public OrganisationRoomService(IDbProvider dbprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<OrganisationRoom>> Select(OrganisationRoomSelectReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await SelectTransaction(db, req);
        }

        public async Task<List<OrganisationRoom>> SelectTransaction(IDb db, OrganisationRoomSelectReq req)
        {
            await HospitalitySchemaBootstrap.EnsureSchemaTransaction(db);

            var query = @"
                SELECT id, organisation_id, organisation_location_id, room_number, room_name,
                       room_type, floor_number, building_wing, status,
                       capacity, pricing, amenities, main_photo, gallery_photos, booking_rules,
                       guest, booking, payment, cleaning_assignment,
                       isactive, created_at, updated_at
                FROM organisation_rooms
                WHERE isactive = TRUE";

            if (req.id > 0)
                query += " AND id = @id";
            if (req.organisation_id > 0)
                query += " AND organisation_id = @organisation_id";
            if (req.organisation_location_id > 0)
                query += " AND organisation_location_id = @organisation_location_id";

            query += " ORDER BY floor_number ASC, room_number ASC";

            DbCommand command = db.GetCommand(query);
            if (req.id > 0)
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.id;
            if (req.organisation_id > 0)
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            if (req.organisation_location_id > 0)
                db.AddParameter(command, "organisation_location_id", DbTypes.Types.Long).Value = req.organisation_location_id;

            var list = new List<OrganisationRoom>();
            using DbDataReader reader = await db.Execute(command);
            while (await reader.ReadAsync())
                list.Add(MapRoom(reader));
            return list;
        }

        public async Task<OrganisationRoom?> GetByIdTransaction(IDb db, long id, long organisationId)
        {
            if (id <= 0) return null;
            var list = await SelectTransaction(db, new OrganisationRoomSelectReq
            {
                id = id,
                organisation_id = organisationId,
            });
            return list.FirstOrDefault();
        }

        public async Task<OrganisationRoom> Save(OrganisationRoom room)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return room.id > 0
                ? await UpdateTransaction(db, room)
                : await InsertTransaction(db, room);
        }

        public async Task<OrganisationRoom> InsertTransaction(IDb db, OrganisationRoom room)
        {
            if (room.organisation_id <= 0)
                throw new ArgumentException("organisation_id is required");

            if (string.IsNullOrWhiteSpace(room.room_number))
                throw new ArgumentException("room_number is required");

            if (room.organisation_location_id <= 0)
                throw new ArgumentException("organisation_location_id is required");

            EnsureDefaults(room);
            var now = DateTime.UtcNow;

            const string insert = @"
                INSERT INTO organisation_rooms (
                    organisation_id, organisation_location_id, room_number, room_name, room_type,
                    floor_number, building_wing, status, capacity, pricing, amenities,
                    main_photo, gallery_photos, booking_rules, guest, booking, payment,
                    cleaning_assignment, isactive, created_at, updated_at
                )
                VALUES (
                    @organisation_id, @organisation_location_id, @room_number, @room_name, @room_type,
                    @floor_number, @building_wing, @status, @capacity::jsonb, @pricing::jsonb, @amenities::jsonb,
                    @main_photo, @gallery_photos::jsonb, @booking_rules::jsonb,
                    @guest::jsonb, @booking::jsonb, @payment::jsonb, @cleaning_assignment::jsonb,
                    TRUE, @created_at, @updated_at
                )
                RETURNING id";

            DbCommand command = db.GetCommand(insert);
            BindRoomParameters(db, command, room);
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    room.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
            room.created_at = now;
            room.updated_at = now;
            return room;
        }

        public async Task<OrganisationRoom> UpdateTransaction(IDb db, OrganisationRoom room)
        {
            var existing = await GetByIdTransaction(db, room.id, room.organisation_id)
                ?? throw new InvalidOperationException("Room not found.");

            room.guest ??= existing.guest;
            room.booking ??= existing.booking;
            room.payment ??= existing.payment;
            room.cleaning_assignment ??= existing.cleaning_assignment;
            room.created_at = existing.created_at;
            EnsureDefaults(room);

            var now = DateTime.UtcNow;
            const string update = @"
                UPDATE organisation_rooms
                SET organisation_location_id = @organisation_location_id,
                    room_number = @room_number,
                    room_name = @room_name,
                    room_type = @room_type,
                    floor_number = @floor_number,
                    building_wing = @building_wing,
                    status = @status,
                    capacity = @capacity::jsonb,
                    pricing = @pricing::jsonb,
                    amenities = @amenities::jsonb,
                    main_photo = @main_photo,
                    gallery_photos = @gallery_photos::jsonb,
                    booking_rules = @booking_rules::jsonb,
                    guest = @guest::jsonb,
                    booking = @booking::jsonb,
                    payment = @payment::jsonb,
                    cleaning_assignment = @cleaning_assignment::jsonb,
                    updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id AND isactive = TRUE";

            DbCommand command = db.GetCommand(update);
            BindRoomParameters(db, command, room);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = room.id;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(command);
            room.updated_at = now;

            var previousStatus = (existing.status ?? "").Trim().ToLowerInvariant();
            var nextStatus = (room.status ?? "").Trim().ToLowerInvariant();
            if (!string.Equals(previousStatus, nextStatus, StringComparison.Ordinal))
            {
                await InsertStatusEventTransaction(db, room, previousStatus, nextStatus, source: "save", notes: "");
            }

            return room;
        }

        public async Task<bool> Delete(OrganisationRoomDeleteReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            const string update = @"
                UPDATE organisation_rooms
                SET isactive = FALSE, updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            return await db.ExecuteNonQuery(command) > 0;
        }

        public async Task<OrganisationRoomStatusBoardRes> GetStatusBoard(OrganisationRoomStatusReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var rooms = await SelectTransaction(db, new OrganisationRoomSelectReq
            {
                organisation_id = req.organisation_id,
                organisation_location_id = req.organisation_location_id,
            });

            // Hotel board is day-based: show occupancy for "today" (or req.date), not a sticky DB flag.
            var asOf = DateOnly.FromDateTime(DateTime.Now);
            if (!string.IsNullOrWhiteSpace(req.date) && DateOnly.TryParse(req.date, out var parsed))
                asOf = parsed;

            foreach (var room in rooms)
                ApplyStatusBoardViewForDate(room, asOf);

            var counts = ValidStatuses.ToDictionary(s => s, _ => 0);
            foreach (var room in rooms)
            {
                var key = ValidStatuses.Contains(room.status) ? room.status : "available";
                counts[key]++;
            }

            var statusSummary = ValidStatuses
                .Select(s => new OrganisationRoomStatusSummaryItem
                {
                    value = s,
                    label = StatusDisplayLabel(s),
                    count = counts[s],
                })
                .ToList();

            var floors = rooms
                .GroupBy(r => r.floor_number)
                .OrderBy(g => g.Key)
                .Select(g => new OrganisationRoomStatusFloorGroup
                {
                    floor_number = g.Key,
                    label = g.Key == 0 ? "Ground floor" : $"Floor {g.Key}",
                    rooms = g.OrderBy(r => r.room_number).ToList(),
                })
                .ToList();

            OrganisationRoom? selectedRoom = null;
            if (req.room_id is > 0)
                selectedRoom = rooms.FirstOrDefault(r => r.id == req.room_id);

            return new OrganisationRoomStatusBoardRes
            {
                organisation_id = req.organisation_id,
                today = DateOnly.FromDateTime(DateTime.Now).ToString("yyyy-MM-dd"),
                as_of = asOf.ToString("yyyy-MM-dd"),
                selected_id = req.room_id,
                selected_room = selectedRoom,
                counts = counts,
                status_summary = statusSummary,
                floors = floors,
                rooms = rooms,
            };
        }

        static string StatusDisplayLabel(string status) => status switch
        {
            "available" => "Available",
            "reserved" => "Reserved",
            "occupied" => "Occupied",
            "checkout_pending" => "Check-out pending",
            "cleaning" => "Cleaning",
            "maintenance" => "Maintenance",
            "blocked" => "Out of Service",
            "hold" => "Hold",
            _ => status,
        };

        /// <summary>
        /// Derive board status for a calendar day from booking check-in/out.
        /// A room booked only for 12 Aug must show Available on any other day.
        /// </summary>
        static void ApplyStatusBoardViewForDate(OrganisationRoom room, DateOnly asOf)
        {
            var stored = ValidStatuses.Contains(room.status) ? room.status : "available";

            // Manual ops overrides stay as-is (not date occupancy).
            if (stored is "maintenance" or "blocked" or "cleaning" or "hold")
                return;

            if (!TryGetStayDates(room, out var checkIn, out var checkOut))
            {
                // Sticky reserved/occupied without valid dates → treat as free for the board day.
                if (stored is "reserved" or "occupied" or "checkout_pending")
                {
                    room.status = "available";
                    room.guest = null;
                }
                return;
            }

            // Stay nights: check_in <= day < check_out
            if (asOf >= checkIn && asOf < checkOut)
            {
                room.status = stored is "occupied" or "checkout_pending" ? stored : "reserved";
                return;
            }

            // Checkout morning
            if (asOf == checkOut && stored == "checkout_pending")
            {
                room.status = "checkout_pending";
                return;
            }

            // Past or future stay relative to asOf — free today
            room.status = "available";
            room.guest = null;
        }

        static bool TryGetStayDates(OrganisationRoom room, out DateOnly checkIn, out DateOnly checkOut)
        {
            checkIn = default;
            checkOut = default;
            if (room.booking == null)
                return false;
            if (!DateOnly.TryParse(room.booking.check_in, out checkIn))
                return false;
            if (!DateOnly.TryParse(room.booking.check_out, out checkOut))
                return false;
            return checkOut > checkIn;
        }

        public async Task<bool> UpdateStatus(OrganisationRoomStatusUpdateReq req)
        {
            var status = (req.status ?? "").Trim().ToLowerInvariant();
            if (!ValidStatuses.Contains(status))
                throw new ArgumentException("Invalid room status.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await HospitalitySchemaBootstrap.EnsureSchemaTransaction(db);

            var room = await GetByIdTransaction(db, req.id, req.organisation_id)
                ?? throw new InvalidOperationException("Room not found.");

            var previousStatus = (room.status ?? "").Trim().ToLowerInvariant();
            room.status = status;
            if (status is not "checkout_pending" and not "cleaning")
                room.cleaning_assignment = null;

            await UpdateTransactionWithoutStatusLog(db, room);

            if (!string.Equals(previousStatus, status, StringComparison.Ordinal))
            {
                var source = string.IsNullOrWhiteSpace(req.source) ? "api" : req.source.Trim();
                await InsertStatusEventTransaction(
                    db,
                    room,
                    previousStatus,
                    status,
                    source,
                    req.notes ?? "");
            }

            return true;
        }

        public async Task<bool> Checkout(OrganisationRoomIdReq req) =>
            await UpdateStatus(new OrganisationRoomStatusUpdateReq
            {
                id = req.id,
                organisation_id = req.organisation_id,
                status = "checkout_pending",
                source = "checkout",
            });

        public async Task<bool> MarkClean(OrganisationRoomIdReq req) =>
            await UpdateStatus(new OrganisationRoomStatusUpdateReq
            {
                id = req.id,
                organisation_id = req.organisation_id,
                status = "available",
                source = "mark_clean",
            });

        public async Task<List<OrganisationRoomStatusEvent>> SelectStatusEvents(OrganisationRoomStatusEventSelectReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await HospitalitySchemaBootstrap.EnsureSchemaTransaction(db);

            if (req.organisation_id <= 0 || req.organisation_room_id <= 0)
                return [];

            var limit = req.limit <= 0 ? 50 : Math.Min(req.limit, 200);
            var query = @"
                SELECT id, organisation_id, organisation_location_id, organisation_room_id, booking_id,
                       from_status, to_status, event_type, changed_by_user_id, changed_by_name,
                       source, notes, occurred_at, created_at
                FROM organisation_room_status_events
                WHERE organisation_id = @organisation_id
                  AND organisation_room_id = @organisation_room_id";

            if (!string.IsNullOrWhiteSpace(req.booking_id))
                query += " AND booking_id = @booking_id";

            query += " ORDER BY occurred_at DESC, id DESC LIMIT @limit";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            db.AddParameter(command, "organisation_room_id", DbTypes.Types.Long).Value = req.organisation_room_id;
            db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
            if (!string.IsNullOrWhiteSpace(req.booking_id))
                db.AddParameter(command, "booking_id", DbTypes.Types.String).Value = req.booking_id.Trim();

            var result = new List<OrganisationRoomStatusEvent>();
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    result.Add(MapStatusEvent(reader));
                }
            }
            return result;
        }

        /// <summary>Update room row without writing a status event (caller logs explicitly).</summary>
        async Task UpdateTransactionWithoutStatusLog(IDb db, OrganisationRoom room)
        {
            var existing = await GetByIdTransaction(db, room.id, room.organisation_id)
                ?? throw new InvalidOperationException("Room not found.");

            room.guest ??= existing.guest;
            room.booking ??= existing.booking;
            room.payment ??= existing.payment;
            room.cleaning_assignment ??= existing.cleaning_assignment;
            room.created_at = existing.created_at;
            EnsureDefaults(room);

            var now = DateTime.UtcNow;
            const string update = @"
                UPDATE organisation_rooms
                SET organisation_location_id = @organisation_location_id,
                    room_number = @room_number,
                    room_name = @room_name,
                    room_type = @room_type,
                    floor_number = @floor_number,
                    building_wing = @building_wing,
                    status = @status,
                    capacity = @capacity::jsonb,
                    pricing = @pricing::jsonb,
                    amenities = @amenities::jsonb,
                    main_photo = @main_photo,
                    gallery_photos = @gallery_photos::jsonb,
                    booking_rules = @booking_rules::jsonb,
                    guest = @guest::jsonb,
                    booking = @booking::jsonb,
                    payment = @payment::jsonb,
                    cleaning_assignment = @cleaning_assignment::jsonb,
                    updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id AND isactive = TRUE";

            DbCommand command = db.GetCommand(update);
            BindRoomParameters(db, command, room);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = room.id;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(command);
            room.updated_at = now;
        }

        async Task InsertStatusEventTransaction(
            IDb db,
            OrganisationRoom room,
            string fromStatus,
            string toStatus,
            string source,
            string notes)
        {
            await HospitalitySchemaBootstrap.EnsureSchemaTransaction(db);

            var eventType = MapEventType(toStatus, source);
            var userId = ResolveActorUserId();
            var userName = ResolveActorName();
            var now = DateTime.UtcNow;

            const string insert = @"
                INSERT INTO organisation_room_status_events (
                    organisation_id, organisation_location_id, organisation_room_id, booking_id,
                    from_status, to_status, event_type, changed_by_user_id, changed_by_name,
                    source, notes, occurred_at, created_at
                ) VALUES (
                    @organisation_id, @organisation_location_id, @organisation_room_id, @booking_id,
                    @from_status, @to_status, @event_type, @changed_by_user_id, @changed_by_name,
                    @source, @notes, @occurred_at, @created_at
                )";

            DbCommand command = db.GetCommand(insert);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = room.organisation_id;
            db.AddParameter(command, "organisation_location_id", DbTypes.Types.Long).Value =
                room.organisation_location_id > 0 ? room.organisation_location_id : DBNull.Value;
            db.AddParameter(command, "organisation_room_id", DbTypes.Types.Long).Value = room.id;
            db.AddParameter(command, "booking_id", DbTypes.Types.String).Value =
                room.booking?.booking_id?.Trim() ?? "";
            db.AddParameter(command, "from_status", DbTypes.Types.String).Value = fromStatus ?? "";
            db.AddParameter(command, "to_status", DbTypes.Types.String).Value = toStatus ?? "";
            db.AddParameter(command, "event_type", DbTypes.Types.String).Value = eventType;
            db.AddParameter(command, "changed_by_user_id", DbTypes.Types.Long).Value =
                userId > 0 ? userId : DBNull.Value;
            db.AddParameter(command, "changed_by_name", DbTypes.Types.String).Value = userName;
            db.AddParameter(command, "source", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(source) ? "api" : source;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = notes ?? "";
            db.AddParameter(command, "occurred_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(command);
        }

        static string MapEventType(string toStatus, string source)
        {
            var src = (source ?? "").Trim().ToLowerInvariant();
            if (src is "checkout" or "mark_clean")
                return src == "checkout" ? "checkout" : "clean";

            return (toStatus ?? "").Trim().ToLowerInvariant() switch
            {
                "reserved" => "booked",
                "occupied" => "checkin",
                "checkout_pending" => "checkout",
                "cleaning" => "cleaning",
                "available" => "available",
                "hold" => "hold",
                "maintenance" => "maintenance",
                "blocked" => "blocked",
                _ => "manual",
            };
        }

        long ResolveActorUserId()
        {
            try
            {
                var ctx = requeststate.usercontext;
                if (ctx == null) return 0;
                if (ctx.id > 0) return ctx.id;
                if (ctx.userid > 0) return ctx.userid;
            }
            catch { /* guest/unauthenticated */ }
            return 0;
        }

        string ResolveActorName()
        {
            try
            {
                var name = requeststate.usercontext?.username?.Trim();
                if (!string.IsNullOrWhiteSpace(name)) return name!;
            }
            catch { /* guest/unauthenticated */ }
            return "System";
        }

        static OrganisationRoomStatusEvent MapStatusEvent(DbDataReader reader)
        {
            return new OrganisationRoomStatusEvent
            {
                id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                organisation_id = reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]),
                organisation_location_id = reader["organisation_location_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_location_id"]),
                organisation_room_id = reader["organisation_room_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_room_id"]),
                booking_id = reader["booking_id"]?.ToString() ?? "",
                from_status = reader["from_status"]?.ToString() ?? "",
                to_status = reader["to_status"]?.ToString() ?? "",
                event_type = reader["event_type"]?.ToString() ?? "",
                changed_by_user_id = reader["changed_by_user_id"] == DBNull.Value ? null : Convert.ToInt64(reader["changed_by_user_id"]),
                changed_by_name = reader["changed_by_name"]?.ToString() ?? "",
                source = reader["source"]?.ToString() ?? "api",
                notes = reader["notes"]?.ToString() ?? "",
                occurred_at = reader["occurred_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["occurred_at"]),
                created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]),
            };
        }

        static void EnsureDefaults(OrganisationRoom room)
        {
            room.capacity ??= new RoomCapacityData();
            room.pricing ??= new RoomPricingData();
            room.booking_rules ??= new RoomBookingRulesData();
            room.amenities ??= [];
            room.gallery_photos ??= [];
            room.status = ValidStatuses.Contains(room.status) ? room.status : "available";
            room.room_type = string.IsNullOrWhiteSpace(room.room_type) ? "double" : room.room_type.Trim().ToLowerInvariant();
        }

        static void BindRoomParameters(IDb db, DbCommand command, OrganisationRoom room)
        {
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = room.organisation_id;
            db.AddParameter(command, "organisation_location_id", DbTypes.Types.Long).Value =
                room.organisation_location_id > 0 ? room.organisation_location_id : DBNull.Value;
            db.AddParameter(command, "room_number", DbTypes.Types.String).Value = room.room_number.Trim();
            db.AddParameter(command, "room_name", DbTypes.Types.String).Value = room.room_name ?? "";
            db.AddParameter(command, "room_type", DbTypes.Types.String).Value = room.room_type;
            db.AddParameter(command, "floor_number", DbTypes.Types.Integer).Value = room.floor_number;
            db.AddParameter(command, "building_wing", DbTypes.Types.String).Value = room.building_wing ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = room.status;
            db.AddParameter(command, "capacity", DbTypes.Types.Json).Value = room.capacity_json;
            db.AddParameter(command, "pricing", DbTypes.Types.Json).Value = room.pricing_json;
            db.AddParameter(command, "amenities", DbTypes.Types.Json).Value = room.amenities_json;
            db.AddParameter(command, "main_photo", DbTypes.Types.String).Value = room.main_photo ?? "";
            db.AddParameter(command, "gallery_photos", DbTypes.Types.Json).Value = room.gallery_photos_json;
            db.AddParameter(command, "booking_rules", DbTypes.Types.Json).Value = room.booking_rules_json;
            db.AddParameter(command, "guest", DbTypes.Types.Json).Value =
                room.guest == null ? DBNull.Value : room.guest_json;
            db.AddParameter(command, "booking", DbTypes.Types.Json).Value =
                room.booking == null ? DBNull.Value : room.booking_json;
            db.AddParameter(command, "payment", DbTypes.Types.Json).Value =
                room.payment == null ? DBNull.Value : room.payment_json;
            db.AddParameter(command, "cleaning_assignment", DbTypes.Types.Json).Value =
                room.cleaning_assignment == null ? DBNull.Value : room.cleaning_assignment_json;
        }

        static OrganisationRoom MapRoom(DbDataReader reader)
        {
            var room = new OrganisationRoom
            {
                id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                organisation_id = reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]),
                organisation_location_id = reader["organisation_location_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_location_id"]),
                room_number = reader["room_number"]?.ToString() ?? "",
                room_name = reader["room_name"]?.ToString() ?? "",
                room_type = reader["room_type"]?.ToString() ?? "double",
                floor_number = reader["floor_number"] == DBNull.Value ? 1 : Convert.ToInt32(reader["floor_number"]),
                building_wing = reader["building_wing"]?.ToString() ?? "",
                status = reader["status"]?.ToString() ?? "available",
                main_photo = reader["main_photo"]?.ToString() ?? "",
                isactive = reader["isactive"] != DBNull.Value && Convert.ToBoolean(reader["isactive"]),
                created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]),
                updated_at = reader["updated_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["updated_at"]),
            };
            room.capacity_json = reader["capacity"] == DBNull.Value ? "{}" : reader["capacity"].ToString() ?? "{}";
            room.pricing_json = reader["pricing"] == DBNull.Value ? "{}" : reader["pricing"].ToString() ?? "{}";
            room.amenities_json = reader["amenities"] == DBNull.Value ? "[]" : reader["amenities"].ToString() ?? "[]";
            room.gallery_photos_json = reader["gallery_photos"] == DBNull.Value ? "[]" : reader["gallery_photos"].ToString() ?? "[]";
            room.booking_rules_json = reader["booking_rules"] == DBNull.Value ? "{}" : reader["booking_rules"].ToString() ?? "{}";
            room.guest_json = reader["guest"] == DBNull.Value ? "null" : reader["guest"].ToString() ?? "null";
            room.booking_json = reader["booking"] == DBNull.Value ? "null" : reader["booking"].ToString() ?? "null";
            room.payment_json = reader["payment"] == DBNull.Value ? "null" : reader["payment"].ToString() ?? "null";
            room.cleaning_assignment_json = reader["cleaning_assignment"] == DBNull.Value ? "null" : reader["cleaning_assignment"].ToString() ?? "null";
            return room;
        }
    }
}
