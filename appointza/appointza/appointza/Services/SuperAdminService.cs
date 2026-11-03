using System.Data.Common;
using appointza.Models;
using appointza.Utils;

namespace appointza.Services
{
    /// <summary>
    /// Read models + the super admin check used by the platform "Super Admin" area.
    /// A super admin is a regular user with users.isfactory = true.
    /// Mutations reuse the existing services (AdminService, ReferenceValueService, ...).
    /// </summary>
    public class SuperAdminService
    {
        private readonly IDbProvider dbprovider;
        private readonly ILogger<SuperAdminService> logger;

        public SuperAdminService(IDbProvider dbprovider, ILogger<SuperAdminService> logger)
        {
            this.dbprovider = dbprovider;
            this.logger = logger;
        }

        // ---------------------------------------------------------------- helpers
        private static string S(DbDataReader r, string col) => r[col] == DBNull.Value ? "" : (r[col].ToString() ?? "");
        private static long L(DbDataReader r, string col) => r[col] == DBNull.Value ? 0 : Convert.ToInt64(r[col]);
        private static int I(DbDataReader r, string col) => r[col] == DBNull.Value ? 0 : Convert.ToInt32(r[col]);
        private static double Dbl(DbDataReader r, string col) => r[col] == DBNull.Value ? 0 : Convert.ToDouble(r[col]);
        private static bool B(DbDataReader r, string col) => r[col] != DBNull.Value && Convert.ToBoolean(r[col]);
        private static DateTime Dt(DbDataReader r, string col) => r[col] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(r[col]);

        private static (int page, int size) NormalisePaging(int pageNumber, int pageSize)
        {
            var size = pageSize <= 0 ? 20 : Math.Min(pageSize, 200);
            var page = pageNumber <= 0 ? 1 : pageNumber;
            return (page, size);
        }

        // ---------------------------------------------------------------- super admin check
        /// <summary>True when the user exists, is active, not suspended and has users.isfactory = true.</summary>
        public async Task<bool> IsSuperAdminUser(long userId)
        {
            if (userId <= 0) return false;
            try
            {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    var command = db.GetCommand(@"
                        SELECT 1 AS ok
                        FROM Users
                        WHERE id = @id
                          AND COALESCE(isfactory, FALSE) = TRUE
                          AND COALESCE(isactive, TRUE) = TRUE
                          AND COALESCE(issuspended, FALSE) = FALSE
                        LIMIT 1");
                    db.AddParameter(command, "id", DbTypes.Types.Long).Value = userId;
                    using (DbDataReader reader = await db.Execute(command))
                    {
                        return await reader.ReadAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                // Fail closed.
                logger.LogError(ex, "Super admin check failed for user {UserId}", userId);
                return false;
            }
        }

        // ---------------------------------------------------------------- organisations
        public async Task<SuperAdminOrganisationListRes> ListOrganisations(SuperAdminOrganisationListReq req)
        {
            req ??= new SuperAdminOrganisationListReq();
            var (page, size) = NormalisePaging(req.PageNumber, req.PageSize);
            var result = new SuperAdminOrganisationListRes { PageNumber = page, PageSize = size };

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();

                var where = new List<string>();
                if (req.IsActive.HasValue) where.Add("COALESCE(o.isactive, FALSE) = @isactive");
                if (req.IsSuspended.HasValue) where.Add("COALESCE(o.issuspended, FALSE) = @issuspended");
                var search = (req.SearchTerm ?? "").Trim().ToLowerInvariant();
                if (search.Length > 0)
                {
                    where.Add(@"(LOWER(COALESCE(o.name, '')) LIKE @q OR LOWER(COALESCE(o.gstnumber, '')) LIKE @q
                                 OR CAST(o.id AS TEXT) = @qexact
                                 OR EXISTS (SELECT 1 FROM Users u WHERE u.organisationid = o.id
                                            AND (LOWER(COALESCE(u.name, '')) LIKE @q OR LOWER(COALESCE(u.email, '')) LIKE @q OR COALESCE(u.mobile, '') LIKE @q)))");
                }
                var whereSql = where.Count > 0 ? "WHERE " + string.Join(" AND ", where) : "";

                void Bind(DbCommand c)
                {
                    if (req.IsActive.HasValue) db.AddParameter(c, "isactive", DbTypes.Types.Boolean).Value = req.IsActive.Value;
                    if (req.IsSuspended.HasValue) db.AddParameter(c, "issuspended", DbTypes.Types.Boolean).Value = req.IsSuspended.Value;
                    if (search.Length > 0)
                    {
                        db.AddParameter(c, "q", DbTypes.Types.String).Value = "%" + search + "%";
                        db.AddParameter(c, "qexact", DbTypes.Types.String).Value = search;
                    }
                }

                var countCommand = db.GetCommand("SELECT COUNT(*) AS total FROM Organisation o " + whereSql);
                Bind(countCommand);
                using (DbDataReader reader = await db.Execute(countCommand))
                {
                    if (await reader.ReadAsync()) result.total = L(reader, "total");
                }

                var command = db.GetCommand(@"
                    SELECT o.id, o.name, o.gstnumber, o.primarytypecode, o.secondarytypecode, o.tagline,
                           o.isactive, o.issuspended, o.createdon,
                           (SELECT COUNT(*) FROM OrganisationLocation ol WHERE ol.organisationid = o.id) AS locationcount,
                           (SELECT COUNT(*) FROM Users u WHERE u.organisationid = o.id) AS usercount,
                           COALESCE((SELECT u.name   FROM Users u WHERE u.organisationid = o.id ORDER BY u.createdon ASC, u.id ASC LIMIT 1), '') AS ownername,
                           COALESCE((SELECT u.mobile FROM Users u WHERE u.organisationid = o.id ORDER BY u.createdon ASC, u.id ASC LIMIT 1), '') AS ownermobile,
                           COALESCE((SELECT u.email  FROM Users u WHERE u.organisationid = o.id ORDER BY u.createdon ASC, u.id ASC LIMIT 1), '') AS owneremail
                    FROM Organisation o " + whereSql + @"
                    ORDER BY o.createdon DESC, o.id DESC
                    LIMIT @pagesize OFFSET @pageoffset");
                Bind(command);
                db.AddParameter(command, "pagesize", DbTypes.Types.Integer).Value = size;
                db.AddParameter(command, "pageoffset", DbTypes.Types.Integer).Value = (page - 1) * size;
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        result.items.Add(ReadOrganisationSummary(reader));
                    }
                }
            }
            return result;
        }

        private static SuperAdminOrganisationSummary ReadOrganisationSummary(DbDataReader r)
        {
            return new SuperAdminOrganisationSummary
            {
                id = L(r, "id"),
                name = S(r, "name"),
                gstnumber = S(r, "gstnumber"),
                primarytypecode = S(r, "primarytypecode"),
                secondarytypecode = S(r, "secondarytypecode"),
                tagline = S(r, "tagline"),
                isactive = B(r, "isactive"),
                issuspended = B(r, "issuspended"),
                createdon = Dt(r, "createdon"),
                locationcount = I(r, "locationcount"),
                usercount = I(r, "usercount"),
                ownername = S(r, "ownername"),
                ownermobile = S(r, "ownermobile"),
                owneremail = S(r, "owneremail"),
            };
        }

        public async Task<SuperAdminOrganisationDetail?> GetOrganisationDetail(long organisationId)
        {
            if (organisationId <= 0) return null;
            var detail = new SuperAdminOrganisationDetail();

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();

                var command = db.GetCommand(@"
                    SELECT o.id, o.name, o.gstnumber, o.primarytypecode, o.secondarytypecode, o.tagline,
                           o.isactive, o.issuspended, o.createdon, o.modifiedon, o.notes,
                           CAST(o.attributes AS TEXT) AS attributes,
                           (SELECT COUNT(*) FROM OrganisationLocation ol WHERE ol.organisationid = o.id) AS locationcount,
                           (SELECT COUNT(*) FROM Users u WHERE u.organisationid = o.id) AS usercount,
                           COALESCE((SELECT u.name   FROM Users u WHERE u.organisationid = o.id ORDER BY u.createdon ASC, u.id ASC LIMIT 1), '') AS ownername,
                           COALESCE((SELECT u.mobile FROM Users u WHERE u.organisationid = o.id ORDER BY u.createdon ASC, u.id ASC LIMIT 1), '') AS ownermobile,
                           COALESCE((SELECT u.email  FROM Users u WHERE u.organisationid = o.id ORDER BY u.createdon ASC, u.id ASC LIMIT 1), '') AS owneremail
                    FROM Organisation o
                    WHERE o.id = @id");
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationId;
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (!await reader.ReadAsync()) return null;
                    detail.organisation = ReadOrganisationSummary(reader);
                    detail.notes = S(reader, "notes");
                    detail.attributes = S(reader, "attributes");
                    detail.modifiedon = Dt(reader, "modifiedon");
                }

                var locCommand = db.GetCommand(@"
                    SELECT id, name, addressline1, addressline2, city, state, country, pincode,
                           latitude, longitude, googlelocation, isactive, isverified, createdon
                    FROM OrganisationLocation
                    WHERE organisationid = @id
                    ORDER BY createdon ASC, id ASC");
                db.AddParameter(locCommand, "id", DbTypes.Types.Long).Value = organisationId;
                using (DbDataReader reader = await db.Execute(locCommand))
                {
                    while (await reader.ReadAsync())
                    {
                        detail.locations.Add(new SuperAdminLocation
                        {
                            id = L(reader, "id"),
                            name = S(reader, "name"),
                            addressline1 = S(reader, "addressline1"),
                            addressline2 = S(reader, "addressline2"),
                            city = S(reader, "city"),
                            state = S(reader, "state"),
                            country = S(reader, "country"),
                            pincode = S(reader, "pincode"),
                            latitude = Dbl(reader, "latitude"),
                            longitude = Dbl(reader, "longitude"),
                            googlelocation = S(reader, "googlelocation"),
                            isactive = B(reader, "isactive"),
                            isverified = B(reader, "isverified"),
                            createdon = Dt(reader, "createdon"),
                        });
                    }
                }

                var userCommand = db.GetCommand(UserSelectSql + " WHERE u.organisationid = @id ORDER BY u.createdon ASC, u.id ASC");
                db.AddParameter(userCommand, "id", DbTypes.Types.Long).Value = organisationId;
                using (DbDataReader reader = await db.Execute(userCommand))
                {
                    while (await reader.ReadAsync())
                    {
                        detail.users.Add(ReadUser(reader));
                    }
                }

                var apptCommand = db.GetCommand(@"
                    SELECT COALESCE(statuscode, '') AS statuscode, COUNT(*) AS cnt
                    FROM Appoinment
                    WHERE organisationid = @id
                    GROUP BY COALESCE(statuscode, '')
                    ORDER BY cnt DESC");
                db.AddParameter(apptCommand, "id", DbTypes.Types.Long).Value = organisationId;
                using (DbDataReader reader = await db.Execute(apptCommand))
                {
                    while (await reader.ReadAsync())
                    {
                        var count = I(reader, "cnt");
                        detail.appointmentstatuscounts.Add(new SuperAdminStatusCount { statuscode = S(reader, "statuscode"), count = count });
                        detail.totalappointments += count;
                    }
                }
            }
            return detail;
        }

        // ---------------------------------------------------------------- users
        private const string UserSelectSql = @"
            SELECT u.id, u.name, u.email, u.mobile, u.designation, u.organisationid, u.locationid,
                   u.isactive, u.issuspended, u.isfactory, u.createdon,
                   COALESCE(o.name, '') AS organisationname
            FROM Users u
            LEFT JOIN Organisation o ON o.id = u.organisationid";

        private static SuperAdminUser ReadUser(DbDataReader r)
        {
            return new SuperAdminUser
            {
                id = L(r, "id"),
                name = S(r, "name"),
                email = S(r, "email"),
                mobile = S(r, "mobile"),
                designation = S(r, "designation"),
                organisationid = L(r, "organisationid"),
                organisationname = S(r, "organisationname"),
                locationid = L(r, "locationid"),
                isactive = B(r, "isactive"),
                issuspended = B(r, "issuspended"),
                issuperadmin = B(r, "isfactory"),
                createdon = Dt(r, "createdon"),
            };
        }

        public async Task<SuperAdminUserListRes> ListUsers(SuperAdminUserListReq req)
        {
            req ??= new SuperAdminUserListReq();
            var (page, size) = NormalisePaging(req.PageNumber, req.PageSize);
            var result = new SuperAdminUserListRes { PageNumber = page, PageSize = size };

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();

                var where = new List<string>();
                if (req.IsActive.HasValue) where.Add("COALESCE(u.isactive, FALSE) = @isactive");
                if (req.IsSuspended.HasValue) where.Add("COALESCE(u.issuspended, FALSE) = @issuspended");
                if (req.OrganisationId.HasValue && req.OrganisationId.Value > 0) where.Add("u.organisationid = @organisationid");
                var search = (req.SearchTerm ?? "").Trim().ToLowerInvariant();
                if (search.Length > 0)
                {
                    where.Add("(LOWER(COALESCE(u.name, '')) LIKE @q OR LOWER(COALESCE(u.email, '')) LIKE @q OR COALESCE(u.mobile, '') LIKE @q)");
                }
                var whereSql = where.Count > 0 ? " WHERE " + string.Join(" AND ", where) : "";

                void Bind(DbCommand c)
                {
                    if (req.IsActive.HasValue) db.AddParameter(c, "isactive", DbTypes.Types.Boolean).Value = req.IsActive.Value;
                    if (req.IsSuspended.HasValue) db.AddParameter(c, "issuspended", DbTypes.Types.Boolean).Value = req.IsSuspended.Value;
                    if (req.OrganisationId.HasValue && req.OrganisationId.Value > 0) db.AddParameter(c, "organisationid", DbTypes.Types.Long).Value = req.OrganisationId.Value;
                    if (search.Length > 0) db.AddParameter(c, "q", DbTypes.Types.String).Value = "%" + search + "%";
                }

                var countCommand = db.GetCommand("SELECT COUNT(*) AS total FROM Users u" + whereSql);
                Bind(countCommand);
                using (DbDataReader reader = await db.Execute(countCommand))
                {
                    if (await reader.ReadAsync()) result.total = L(reader, "total");
                }

                var command = db.GetCommand(UserSelectSql + whereSql + @"
                    ORDER BY u.createdon DESC, u.id DESC
                    LIMIT @pagesize OFFSET @pageoffset");
                Bind(command);
                db.AddParameter(command, "pagesize", DbTypes.Types.Integer).Value = size;
                db.AddParameter(command, "pageoffset", DbTypes.Types.Integer).Value = (page - 1) * size;
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        result.items.Add(ReadUser(reader));
                    }
                }
            }
            return result;
        }
    }
}