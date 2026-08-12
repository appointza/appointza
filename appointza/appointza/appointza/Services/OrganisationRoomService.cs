using appointza.Models.Hospitality;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class OrganisationRoomService
    {
        readonly IDbProvider dbprovider;

        static readonly string[] ValidStatuses =
        [
            "available", "reserved", "occupied", "checkout_pending",
            "cleaning", "maintenance", "blocked", "hold",
        ];

        public OrganisationRoomService(IDbProvider dbprovider)
        {
            this.dbprovider = dbprovider;
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

            var asOf = DateOnly.FromDateTime(DateTime.UtcNow);
            if (!string.IsNullOrWhiteSpace(req.date) && DateOnly.TryParse(req.date, out var parsed))
                asOf = parsed;

            var counts = ValidStatuses.ToDictionary(s => s, _ => 0);
            foreach (var room in rooms)
            {
                var key = ValidStatuses.Contains(room.status) ? room.status : "available";
                counts[key]++;
            }

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

            return new OrganisationRoomStatusBoardRes
            {
                organisation_id = req.organisation_id,
                today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
                as_of = asOf.ToString("yyyy-MM-dd"),
                selected_id = req.room_id,
                counts = counts,
                floors = floors,
                rooms = rooms,
            };
        }

        public async Task<bool> UpdateStatus(OrganisationRoomStatusUpdateReq req)
        {
            var status = (req.status ?? "").Trim().ToLowerInvariant();
            if (!ValidStatuses.Contains(status))
                throw new ArgumentException("Invalid room status.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var room = await GetByIdTransaction(db, req.id, req.organisation_id)
                ?? throw new InvalidOperationException("Room not found.");

            room.status = status;
            if (status is not "checkout_pending" and not "cleaning")
                room.cleaning_assignment = null;

            await UpdateTransaction(db, room);
            return true;
        }

        public async Task<bool> Checkout(OrganisationRoomIdReq req) =>
            await UpdateStatus(new OrganisationRoomStatusUpdateReq
            {
                id = req.id,
                organisation_id = req.organisation_id,
                status = "checkout_pending",
            });

        public async Task<bool> MarkClean(OrganisationRoomIdReq req) =>
            await UpdateStatus(new OrganisationRoomStatusUpdateReq
            {
                id = req.id,
                organisation_id = req.organisation_id,
                status = "available",
            });

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
