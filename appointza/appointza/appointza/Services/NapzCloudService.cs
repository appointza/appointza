using appointza.Models;
using appointza.Utils;
using System.Data.Common;
using System.Text.Json;

namespace appointza.Services
{
    /// <summary>Napz user cloud data (profile, places, trips) on Appointza Postgres — replaces Firestore.</summary>
    public class NapzCloudService
    {
        readonly IDbProvider dbprovider;
        readonly NapzService napzService;
        readonly ILogger<NapzCloudService> logger;

        public NapzCloudService(
            IDbProvider dbprovider,
            NapzService napzService,
            ILogger<NapzCloudService> logger)
        {
            this.dbprovider = dbprovider;
            this.napzService = napzService;
            this.logger = logger;
        }

        public async Task EnsureCloudSchema()
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await napzService.EnsureSchemaTransaction(db);
            await EnsureCloudSchemaTransaction(db);
        }

        public async Task EnsureCloudSchemaTransaction(IDb db)
        {
            const string sql = @"
CREATE TABLE IF NOT EXISTS napz_profiles (
    userid BIGINT PRIMARY KEY,
    firebase_uid VARCHAR(128) NULL,
    name VARCHAR(256) NOT NULL DEFAULT '',
    email VARCHAR(256) NOT NULL DEFAULT '',
    mobile VARCHAR(32) NOT NULL DEFAULT '',
    pincode VARCHAR(16) NOT NULL DEFAULT '',
    photo_url TEXT NULL,
    place_name VARCHAR(512) NULL,
    destination_lat DOUBLE PRECISION NULL,
    destination_lng DOUBLE PRECISION NULL,
    alert_radius INT NULL,
    last_lat DOUBLE PRECISION NULL,
    last_lng DOUBLE PRECISION NULL,
    last_location_at TIMESTAMPTZ NULL,
    createdon TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modifiedon TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS napz_saved_places (
    userid BIGINT NOT NULL,
    place_id VARCHAR(64) NOT NULL,
    name VARCHAR(512) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    radius INT NOT NULL DEFAULT 1000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modifiedon TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (userid, place_id)
);
CREATE INDEX IF NOT EXISTS ix_napz_saved_places_userid ON napz_saved_places (userid);
CREATE TABLE IF NOT EXISTS napz_trips (
    userid BIGINT NOT NULL,
    trip_id VARCHAR(64) NOT NULL,
    share_code VARCHAR(16) NULL,
    plan_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modifiedon TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (userid, trip_id)
);
CREATE INDEX IF NOT EXISTS ix_napz_trips_userid ON napz_trips (userid);
CREATE INDEX IF NOT EXISTS ix_napz_trips_share ON napz_trips (share_code) WHERE share_code IS NOT NULL;
CREATE TABLE IF NOT EXISTS napz_shared_trips (
    share_code VARCHAR(16) PRIMARY KEY,
    userid BIGINT NOT NULL,
    plan_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    createdon TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modifiedon TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
";
            var cmd = db.GetCommand(sql);
            await db.ExecuteNonQuery(cmd);
        }

        public async Task<NapzProfile> UpsertProfile(long userid, NapzProfile profile)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);
            const string sql = @"
INSERT INTO napz_profiles (
    userid, firebase_uid, name, email, mobile, pincode, photo_url, createdon, modifiedon
) VALUES (
    @userid, @firebase_uid, @name, @email, @mobile, @pincode, @photo_url, @now, @now
)
ON CONFLICT (userid) DO UPDATE SET
    firebase_uid = COALESCE(EXCLUDED.firebase_uid, napz_profiles.firebase_uid),
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    mobile = EXCLUDED.mobile,
    pincode = EXCLUDED.pincode,
    photo_url = COALESCE(EXCLUDED.photo_url, napz_profiles.photo_url),
    modifiedon = EXCLUDED.modifiedon;
";
            var cmd = db.GetCommand(sql);
            var now = DateTime.UtcNow;
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            db.AddParameter(cmd, "firebase_uid", DbTypes.Types.String).Value = (object?)profile.firebase_uid ?? DBNull.Value;
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = profile.name ?? "";
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = profile.email ?? "";
            db.AddParameter(cmd, "mobile", DbTypes.Types.String).Value = profile.mobile ?? "";
            db.AddParameter(cmd, "pincode", DbTypes.Types.String).Value = profile.pincode ?? "";
            db.AddParameter(cmd, "photo_url", DbTypes.Types.String).Value = (object?)profile.photo_url ?? DBNull.Value;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(cmd);
            return await GetProfile(userid) ?? profile;
        }

        public async Task<NapzProfile?> GetProfile(long userid)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);
            const string sql = @"
SELECT userid, firebase_uid, name, email, mobile, pincode, photo_url,
       place_name, destination_lat, destination_lng, alert_radius
FROM napz_profiles WHERE userid = @userid LIMIT 1;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync()) return null;
            return MapProfile(reader);
        }

        public async Task SetActiveDestination(long userid, NapzActiveDestinationReq req)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);
            const string sql = @"
INSERT INTO napz_profiles (userid, name, email, place_name, destination_lat, destination_lng, alert_radius, createdon, modifiedon)
VALUES (@userid, '', '', @place_name, @lat, @lng, @alert_radius, @now, @now)
ON CONFLICT (userid) DO UPDATE SET
    place_name = EXCLUDED.place_name,
    destination_lat = EXCLUDED.destination_lat,
    destination_lng = EXCLUDED.destination_lng,
    alert_radius = EXCLUDED.alert_radius,
    modifiedon = EXCLUDED.modifiedon;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            db.AddParameter(cmd, "place_name", DbTypes.Types.String).Value = req.placeName?.Trim() ?? "";
            db.AddParameter(cmd, "lat", DbTypes.Types.Double).Value = req.lat;
            db.AddParameter(cmd, "lng", DbTypes.Types.Double).Value = req.lng;
            db.AddParameter(cmd, "alert_radius", DbTypes.Types.Integer).Value = req.alertRadius;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        public async Task<List<NapzSavedPlace>> ListSavedPlaces(long userid)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);
            const string sql = @"
SELECT place_id, name, lat, lng, radius, created_at
FROM napz_saved_places WHERE userid = @userid ORDER BY created_at DESC;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            var list = new List<NapzSavedPlace>();
            using DbDataReader reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                list.Add(new NapzSavedPlace
                {
                    id = reader["place_id"]?.ToString() ?? "",
                    name = reader["name"]?.ToString() ?? "",
                    lat = reader["lat"] == DBNull.Value ? 0 : Convert.ToDouble(reader["lat"]),
                    lng = reader["lng"] == DBNull.Value ? 0 : Convert.ToDouble(reader["lng"]),
                    radius = reader["radius"] == DBNull.Value ? 1000 : Convert.ToInt32(reader["radius"]),
                    createdAt = reader["created_at"] == DBNull.Value
                        ? DateTime.UtcNow.ToString("o")
                        : Convert.ToDateTime(reader["created_at"]).ToUniversalTime().ToString("o"),
                });
            }
            return list;
        }

        public async Task UpsertSavedPlace(long userid, NapzSavedPlace place)
        {
            if (string.IsNullOrWhiteSpace(place.id))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "place id is required");
            }
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);
            const string sql = @"
INSERT INTO napz_saved_places (userid, place_id, name, lat, lng, radius, created_at, modifiedon)
VALUES (@userid, @place_id, @name, @lat, @lng, @radius, @created_at, @now)
ON CONFLICT (userid, place_id) DO UPDATE SET
    name = EXCLUDED.name,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    radius = EXCLUDED.radius,
    modifiedon = EXCLUDED.modifiedon;
";
            var createdAt = DateTime.TryParse(place.createdAt, out var parsed) ? parsed.ToUniversalTime() : DateTime.UtcNow;
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            db.AddParameter(cmd, "place_id", DbTypes.Types.String).Value = place.id.Trim();
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = place.name ?? "";
            db.AddParameter(cmd, "lat", DbTypes.Types.Double).Value = place.lat;
            db.AddParameter(cmd, "lng", DbTypes.Types.Double).Value = place.lng;
            db.AddParameter(cmd, "radius", DbTypes.Types.Integer).Value = place.radius <= 0 ? 1000 : place.radius;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = createdAt;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);

            await SetActiveDestination(userid, new NapzActiveDestinationReq
            {
                placeName = place.name,
                lat = place.lat,
                lng = place.lng,
                alertRadius = place.radius,
            });
        }

        public async Task DeleteSavedPlace(long userid, string placeId)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);
            const string sql = @"DELETE FROM napz_saved_places WHERE userid = @userid AND place_id = @place_id;";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            db.AddParameter(cmd, "place_id", DbTypes.Types.String).Value = placeId?.Trim() ?? "";
            await db.ExecuteNonQuery(cmd);
        }

        public async Task SaveTrip(long userid, NapzTripSaveReq req)
        {
            if (string.IsNullOrWhiteSpace(req.trip_id))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "trip_id is required");
            }
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);
            var planJson = string.IsNullOrWhiteSpace(req.plan_json) ? "{}" : req.plan_json;
            // Validate JSON
            try { JsonDocument.Parse(planJson); }
            catch { throw new AppException(AppException.ErrorCodes.BadRequest, "plan_json must be valid JSON"); }

            const string sql = @"
INSERT INTO napz_trips (userid, trip_id, share_code, plan_json, created_at, modifiedon)
VALUES (@userid, @trip_id, @share_code, CAST(@plan_json AS jsonb), @now, @now)
ON CONFLICT (userid, trip_id) DO UPDATE SET
    share_code = COALESCE(EXCLUDED.share_code, napz_trips.share_code),
    plan_json = EXCLUDED.plan_json,
    modifiedon = EXCLUDED.modifiedon;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            db.AddParameter(cmd, "trip_id", DbTypes.Types.String).Value = req.trip_id.Trim();
            db.AddParameter(cmd, "share_code", DbTypes.Types.String).Value = (object?)req.share_code ?? DBNull.Value;
            db.AddParameter(cmd, "plan_json", DbTypes.Types.String).Value = planJson;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        public async Task<List<NapzTripRow>> ListTrips(long userid)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);
            const string sql = @"
SELECT trip_id, share_code, plan_json::text AS plan_json, created_at
FROM napz_trips WHERE userid = @userid ORDER BY created_at DESC LIMIT 40;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            var list = new List<NapzTripRow>();
            using DbDataReader reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                list.Add(new NapzTripRow
                {
                    trip_id = reader["trip_id"]?.ToString() ?? "",
                    share_code = reader["share_code"] == DBNull.Value ? null : reader["share_code"]?.ToString(),
                    plan_json = reader["plan_json"]?.ToString() ?? "{}",
                    created_at = reader["created_at"] == DBNull.Value
                        ? DateTime.UtcNow.ToString("o")
                        : Convert.ToDateTime(reader["created_at"]).ToUniversalTime().ToString("o"),
                });
            }
            return list;
        }

        public async Task DeleteTrip(long userid, string tripId)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);

            string? shareCode = null;
            {
                const string select = @"SELECT share_code FROM napz_trips WHERE userid = @userid AND trip_id = @trip_id LIMIT 1;";
                var cmd = db.GetCommand(select);
                db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
                db.AddParameter(cmd, "trip_id", DbTypes.Types.String).Value = tripId?.Trim() ?? "";
                using DbDataReader reader = await db.Execute(cmd);
                if (await reader.ReadAsync() && reader["share_code"] != DBNull.Value)
                {
                    shareCode = reader["share_code"]?.ToString();
                }
            }

            {
                const string del = @"DELETE FROM napz_trips WHERE userid = @userid AND trip_id = @trip_id;";
                var cmd = db.GetCommand(del);
                db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
                db.AddParameter(cmd, "trip_id", DbTypes.Types.String).Value = tripId?.Trim() ?? "";
                await db.ExecuteNonQuery(cmd);
            }

            if (!string.IsNullOrWhiteSpace(shareCode))
            {
                const string delShare = @"DELETE FROM napz_shared_trips WHERE share_code = @share_code AND userid = @userid;";
                var cmd = db.GetCommand(delShare);
                db.AddParameter(cmd, "share_code", DbTypes.Types.String).Value = shareCode;
                db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
                await db.ExecuteNonQuery(cmd);
            }
        }

        public async Task<NapzTripRow> PublishTrip(long userid, NapzTripSaveReq req)
        {
            var shareCode = string.IsNullOrWhiteSpace(req.share_code)
                ? MakeShareCode()
                : req.share_code.Trim().ToUpperInvariant();
            req.share_code = shareCode;
            await SaveTrip(userid, req);

            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);
            const string sql = @"
INSERT INTO napz_shared_trips (share_code, userid, plan_json, createdon, modifiedon)
VALUES (@share_code, @userid, CAST(@plan_json AS jsonb), @now, @now)
ON CONFLICT (share_code) DO UPDATE SET
    userid = EXCLUDED.userid,
    plan_json = EXCLUDED.plan_json,
    modifiedon = EXCLUDED.modifiedon;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "share_code", DbTypes.Types.String).Value = shareCode;
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            db.AddParameter(cmd, "plan_json", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(req.plan_json) ? "{}" : req.plan_json;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);

            return new NapzTripRow
            {
                trip_id = req.trip_id,
                share_code = shareCode,
                plan_json = req.plan_json,
                created_at = DateTime.UtcNow.ToString("o"),
            };
        }

        public async Task<NapzTripRow?> GetSharedTrip(string code)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);
            const string sql = @"
SELECT share_code, plan_json::text AS plan_json, createdon
FROM napz_shared_trips WHERE share_code = @share_code LIMIT 1;
";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "share_code", DbTypes.Types.String).Value = (code ?? "").Trim().ToUpperInvariant();
            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync()) return null;
            return new NapzTripRow
            {
                trip_id = "",
                share_code = reader["share_code"]?.ToString(),
                plan_json = reader["plan_json"]?.ToString() ?? "{}",
                created_at = reader["createdon"] == DBNull.Value
                    ? DateTime.UtcNow.ToString("o")
                    : Convert.ToDateTime(reader["createdon"]).ToUniversalTime().ToString("o"),
            };
        }

        /// <summary>Import a Firebase export bundle into Appointza Napz tables for this user.</summary>
        public async Task<NapzFirebaseImportRes> ImportFirebaseBundle(long userid, NapzFirebaseImportBundle bundle)
        {
            bundle ??= new NapzFirebaseImportBundle();
            await EnsureCloudSchema();
            var result = new NapzFirebaseImportRes { userid = userid };

            if (bundle.profile != null)
            {
                bundle.profile.firebase_uid = string.IsNullOrWhiteSpace(bundle.firebase_uid)
                    ? bundle.profile.firebase_uid
                    : bundle.firebase_uid;
                await UpsertProfile(userid, bundle.profile);
                if (!string.IsNullOrWhiteSpace(bundle.profile.place_name)
                    && bundle.profile.destination_lat.HasValue
                    && bundle.profile.destination_lng.HasValue)
                {
                    await SetActiveDestination(userid, new NapzActiveDestinationReq
                    {
                        placeName = bundle.profile.place_name,
                        lat = bundle.profile.destination_lat.Value,
                        lng = bundle.profile.destination_lng.Value,
                        alertRadius = bundle.profile.alert_radius ?? 1000,
                    });
                }
                result.profile = true;
            }
            else if (!string.IsNullOrWhiteSpace(bundle.firebase_uid))
            {
                await UpsertProfile(userid, new NapzProfile
                {
                    firebase_uid = bundle.firebase_uid,
                    name = "",
                    email = "",
                });
                result.profile = true;
            }

            foreach (var place in bundle.places ?? new List<NapzSavedPlace>())
            {
                if (string.IsNullOrWhiteSpace(place.id)) continue;
                await UpsertSavedPlace(userid, place);
                result.places++;
            }

            foreach (var trip in bundle.trips ?? new List<NapzTripSaveReq>())
            {
                if (string.IsNullOrWhiteSpace(trip.trip_id)) continue;
                await SaveTrip(userid, trip);
                result.trips++;
            }

            foreach (var shared in bundle.shared_trips ?? new List<NapzSharedTripImport>())
            {
                if (string.IsNullOrWhiteSpace(shared.share_code)) continue;
                await PublishTrip(userid, new NapzTripSaveReq
                {
                    trip_id = $"shared_{shared.share_code}",
                    share_code = shared.share_code.Trim().ToUpperInvariant(),
                    plan_json = string.IsNullOrWhiteSpace(shared.plan_json) ? "{}" : shared.plan_json,
                });
                result.shared_trips++;
            }

            if (bundle.entitlement != null)
            {
                await napzService.ImportFirebaseEntitlement(userid, bundle.entitlement);
                result.entitlement = true;
            }

            result.message =
                $"Imported profile={result.profile}, places={result.places}, trips={result.trips}, shared={result.shared_trips}, entitlement={result.entitlement}";
            logger.LogInformation("Napz Firebase import for userid={UserId}: {Message}", userid, result.message);
            return result;
        }

        public async Task DeleteAccountData(long userid)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureCloudSchemaTransaction(db);
            try
            {
                await db.BeginTransaction();
                foreach (var sql in new[]
                {
                    "DELETE FROM napz_shared_trips WHERE userid = @userid;",
                    "DELETE FROM napz_trips WHERE userid = @userid;",
                    "DELETE FROM napz_saved_places WHERE userid = @userid;",
                    "DELETE FROM napz_profiles WHERE userid = @userid;",
                    "DELETE FROM napz_orders WHERE userid = @userid;",
                    "DELETE FROM napz_entitlements WHERE userid = @userid;",
                })
                {
                    var cmd = db.GetCommand(sql);
                    db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
                    await db.ExecuteNonQuery(cmd);
                }
                await db.CommitTransaction();
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
            logger.LogInformation("Deleted Napz cloud data for userid={UserId}", userid);
        }

        static string MakeShareCode()
        {
            const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var rng = Random.Shared;
            return string.Create(8, alphabet, (span, alpha) =>
            {
                for (var i = 0; i < span.Length; i++)
                {
                    span[i] = alpha[rng.Next(alpha.Length)];
                }
            });
        }

        static NapzProfile MapProfile(DbDataReader reader)
        {
            return new NapzProfile
            {
                userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]),
                firebase_uid = reader["firebase_uid"] == DBNull.Value ? null : reader["firebase_uid"]?.ToString(),
                name = reader["name"]?.ToString() ?? "",
                email = reader["email"]?.ToString() ?? "",
                mobile = reader["mobile"]?.ToString() ?? "",
                pincode = reader["pincode"]?.ToString() ?? "",
                photo_url = reader["photo_url"] == DBNull.Value ? null : reader["photo_url"]?.ToString(),
                place_name = reader["place_name"] == DBNull.Value ? null : reader["place_name"]?.ToString(),
                destination_lat = reader["destination_lat"] == DBNull.Value ? null : Convert.ToDouble(reader["destination_lat"]),
                destination_lng = reader["destination_lng"] == DBNull.Value ? null : Convert.ToDouble(reader["destination_lng"]),
                alert_radius = reader["alert_radius"] == DBNull.Value ? null : Convert.ToInt32(reader["alert_radius"]),
            };
        }
    }
}
