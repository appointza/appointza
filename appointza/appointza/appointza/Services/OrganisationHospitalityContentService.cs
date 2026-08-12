using appointza.Models.Hospitality;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class OrganisationHospitalityContentService
    {
        readonly IDbProvider dbprovider;

        public OrganisationHospitalityContentService(IDbProvider dbprovider)
        {
            this.dbprovider = dbprovider;
        }

        public async Task<OrganisationHospitalityProfile> GetProfile(long organisationId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await GetProfileTransaction(db, organisationId);
        }

        public async Task<OrganisationHospitalityProfile> GetProfileTransaction(IDb db, long organisationId)
        {
            if (organisationId <= 0)
                return new OrganisationHospitalityProfile { organisation_id = organisationId };

            await HospitalitySchemaBootstrap.EnsureSchemaTransaction(db);

            var profile = await SelectProfileTransaction(db, organisationId);
            if (profile != null)
                return profile;

            return await InsertDefaultProfileTransaction(db, organisationId);
        }

        public async Task<OrganisationHospitalityProfile> SaveSettings(HospitalityProfileSettingsReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await HospitalitySchemaBootstrap.EnsureSchemaTransaction(db);
            await GetProfileTransaction(db, req.organisation_id);

            var now = DateTime.UtcNow;
            var normalizedType = NormalizeType(req.organisation_type);

            const string updateOrg = @"
                UPDATE Organisation
                SET organisation_type = @organisation_type,
                    modifiedon = @modifiedon
                WHERE id = @organisation_id AND isactive = true";

            DbCommand orgCommand = db.GetCommand(updateOrg);
            db.AddParameter(orgCommand, "organisation_type", DbTypes.Types.String).Value = normalizedType;
            db.AddParameter(orgCommand, "modifiedon", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(orgCommand, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            await db.ExecuteNonQuery(orgCommand);

            const string update = @"
                UPDATE organisation_hospitality_profile
                SET property_type = @property_type,
                    booking_type = @booking_type,
                    minimum_hours = @minimum_hours,
                    checkin_time = @checkin_time::time,
                    checkout_time = @checkout_time::time,
                    overnight_time_mode = @overnight_time_mode,
                    cancellation_policy = @cancellation_policy,
                    payment_policy = @payment_policy,
                    updated_at = @updated_at
                WHERE organisation_id = @organisation_id";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "property_type", DbTypes.Types.String).Value = req.property_type ?? "hotel";
            db.AddParameter(command, "booking_type", DbTypes.Types.String).Value = NormalizeBookingType(req.booking_type);
            db.AddParameter(command, "minimum_hours", DbTypes.Types.Integer).Value =
                NormalizeBookingType(req.booking_type) == "hourly" ? Math.Max(1, req.minimum_hours) : 0;
            db.AddParameter(command, "checkin_time", DbTypes.Types.String).Value = NormalizeTime(req.checkin_time);
            db.AddParameter(command, "checkout_time", DbTypes.Types.String).Value = NormalizeTime(req.checkout_time, "11:00");
            db.AddParameter(command, "overnight_time_mode", DbTypes.Types.String).Value =
                string.Equals(req.overnight_time_mode, "dynamic", StringComparison.OrdinalIgnoreCase) ? "dynamic" : "fixed";
            db.AddParameter(command, "cancellation_policy", DbTypes.Types.String).Value = req.cancellation_policy ?? "";
            db.AddParameter(command, "payment_policy", DbTypes.Types.String).Value = req.payment_policy ?? "";
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            await db.ExecuteNonQuery(command);

            return await GetProfileTransaction(db, req.organisation_id);
        }

        public async Task<OrganisationHospitalityProfile> SaveContent(HospitalityContentSaveReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await HospitalitySchemaBootstrap.EnsureSchemaTransaction(db);
            await GetProfileTransaction(db, req.organisation_id);

            var profile = await SelectProfileTransaction(db, req.organisation_id)
                ?? new OrganisationHospitalityProfile { organisation_id = req.organisation_id };

            if (req.packages != null)
                profile.packages = req.packages;
            if (req.food_menu != null)
                profile.food_menu = req.food_menu;
            if (req.nearby_places != null)
                profile.nearby_places = req.nearby_places;
            if (req.guest_services != null)
                profile.guest_services = req.guest_services;

            var now = DateTime.UtcNow;
            const string update = @"
                UPDATE organisation_hospitality_profile
                SET packages = @packages::jsonb,
                    food_menu = @food_menu::jsonb,
                    nearby_places = @nearby_places::jsonb,
                    guest_services = @guest_services::jsonb,
                    updated_at = @updated_at
                WHERE organisation_id = @organisation_id";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "packages", DbTypes.Types.Json).Value = profile.packages_json;
            db.AddParameter(command, "food_menu", DbTypes.Types.Json).Value = profile.food_menu_json;
            db.AddParameter(command, "nearby_places", DbTypes.Types.Json).Value = profile.nearby_places_json;
            db.AddParameter(command, "guest_services", DbTypes.Types.Json).Value = profile.guest_services_json;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            await db.ExecuteNonQuery(command);

            return await GetProfileTransaction(db, req.organisation_id);
        }

        async Task<OrganisationHospitalityProfile?> SelectProfileTransaction(IDb db, long organisationId)
        {
            const string query = @"
                SELECT organisation_id, organisation_type, property_type, booking_type, minimum_hours,
                       checkin_time::text AS checkin_time, checkout_time::text AS checkout_time,
                       overnight_time_mode, cancellation_policy, payment_policy,
                       packages, food_menu, nearby_places, guest_services, created_at, updated_at
                FROM organisation_hospitality_profile
                WHERE organisation_id = @organisation_id
                LIMIT 1";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
                return null;

            var profile = new OrganisationHospitalityProfile
            {
                organisation_id = Convert.ToInt64(reader["organisation_id"]),
                organisation_type = reader["organisation_type"]?.ToString() ?? OrganisationTypeCodes.Service,
                property_type = reader["property_type"]?.ToString() ?? "hotel",
                booking_type = reader["booking_type"]?.ToString() ?? "overnight",
                minimum_hours = reader["minimum_hours"] == DBNull.Value ? 2 : Convert.ToInt32(reader["minimum_hours"]),
                checkin_time = NormalizeTime(reader["checkin_time"]?.ToString()),
                checkout_time = NormalizeTime(reader["checkout_time"]?.ToString()),
                overnight_time_mode = reader["overnight_time_mode"]?.ToString() ?? "fixed",
                cancellation_policy = reader["cancellation_policy"]?.ToString() ?? "",
                payment_policy = reader["payment_policy"]?.ToString() ?? "",
                created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]),
                updated_at = reader["updated_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["updated_at"]),
            };
            profile.packages_json = reader["packages"] == DBNull.Value ? "[]" : reader["packages"].ToString() ?? "[]";
            profile.food_menu_json = reader["food_menu"] == DBNull.Value ? "[]" : reader["food_menu"].ToString() ?? "[]";
            profile.nearby_places_json = reader["nearby_places"] == DBNull.Value ? "[]" : reader["nearby_places"].ToString() ?? "[]";
            profile.guest_services_json = reader["guest_services"] == DBNull.Value ? "[]" : reader["guest_services"].ToString() ?? "[]";
            return profile;
        }

        async Task<string> GetOrganisationTypeTransaction(IDb db, long organisationId)
        {
            try
            {
                const string orgQuery = @"
                    SELECT organisation_type
                    FROM Organisation
                    WHERE id = @organisation_id AND isactive = true
                    LIMIT 1";

                DbCommand orgCommand = db.GetCommand(orgQuery);
                db.AddParameter(orgCommand, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                using (DbDataReader orgReader = await db.Execute(orgCommand))
                {
                    if (await orgReader.ReadAsync())
                        return NormalizeType(orgReader["organisation_type"]?.ToString());
                }
            }
            catch
            {
                // Organisation.organisation_type may not exist on older databases.
            }

            try
            {
                const string profileQuery = @"
                    SELECT organisation_type
                    FROM organisation_hospitality_profile
                    WHERE organisation_id = @organisation_id
                    LIMIT 1";

                DbCommand profileCommand = db.GetCommand(profileQuery);
                db.AddParameter(profileCommand, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                using DbDataReader profileReader = await db.Execute(profileCommand);
                if (await profileReader.ReadAsync())
                    return NormalizeType(profileReader["organisation_type"]?.ToString());
            }
            catch
            {
                // organisation_hospitality_profile.organisation_type may not exist yet.
            }

            return OrganisationTypeCodes.Service;
        }

        async Task<OrganisationHospitalityProfile> InsertDefaultProfileTransaction(IDb db, long organisationId)
        {
            var orgType = OrganisationTypeCodes.Service;
            try
            {
                orgType = await GetOrganisationTypeTransaction(db, organisationId);
            }
            catch
            {
                // Use default service type when profile/org columns are not ready yet.
            }
            var now = DateTime.UtcNow;
            const string insert = @"
                INSERT INTO organisation_hospitality_profile (
                    organisation_id, organisation_type, property_type, booking_type,
                    minimum_hours, checkin_time, checkout_time,
                    packages, food_menu, nearby_places, guest_services,
                    created_at, updated_at
                )
                VALUES (
                    @organisation_id, @organisation_type, @property_type, @booking_type,
                    @minimum_hours, @checkin_time::time, @checkout_time::time,
                    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
                    @created_at, @updated_at
                )
                ON CONFLICT (organisation_id) DO NOTHING";

            DbCommand command = db.GetCommand(insert);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "organisation_type", DbTypes.Types.String).Value = orgType;
            db.AddParameter(command, "property_type", DbTypes.Types.String).Value = "hotel";
            db.AddParameter(command, "booking_type", DbTypes.Types.String).Value = "overnight";
            db.AddParameter(command, "minimum_hours", DbTypes.Types.Integer).Value = 2;
            db.AddParameter(command, "checkin_time", DbTypes.Types.String).Value = "14:00";
            db.AddParameter(command, "checkout_time", DbTypes.Types.String).Value = "11:00";
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(command);

            return await SelectProfileTransaction(db, organisationId)
                ?? new OrganisationHospitalityProfile
                {
                    organisation_id = organisationId,
                    organisation_type = orgType,
                };
        }

        static string NormalizeType(string? value)
        {
            var normalized = (value ?? "").Trim().ToLowerInvariant();
            return normalized switch
            {
                OrganisationTypeCodes.Hospitality => OrganisationTypeCodes.Hospitality,
                OrganisationTypeCodes.Both => OrganisationTypeCodes.Both,
                _ => OrganisationTypeCodes.Service,
            };
        }

        static string NormalizeBookingType(string? value)
        {
            var normalized = (value ?? "").Trim().ToLowerInvariant();
            return normalized is "hourly" or "perhour" or "per_hour" ? "hourly" : "overnight";
        }

        static string NormalizeTime(string? value, string fallback = "14:00")
        {
            if (string.IsNullOrWhiteSpace(value)) return fallback;
            if (TimeSpan.TryParse(value, out var ts))
                return ts.ToString(@"hh\:mm");
            string[] formats = { @"h\:m", @"hh\:mm", @"H\:m", @"HH\:mm" };
            if (TimeSpan.TryParseExact(value.Trim(), formats, null, out ts))
                return ts.ToString(@"hh\:mm");
            return value.Length >= 5 ? value[..5] : value;
        }
    }
}
