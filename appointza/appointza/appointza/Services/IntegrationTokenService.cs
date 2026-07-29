using System.Data.Common;
using System.Security.Cryptography;
using appointza.Authentication.Services;
using appointza.Models;
using appointza.Utils;

namespace appointza.Services
{
    public class IntegrationTokenService
    {
        private readonly IDbProvider _dbProvider;
        private readonly UsersService _usersService;
        private readonly OrganisationService _organisationService;
        private readonly OrganisationLocationService _organisationLocationService;
        private readonly EnquiryService _enquiryService;
        private readonly AppoinmentService _appoinmentService;

        public IntegrationTokenService(
            IDbProvider dbProvider,
            UsersService usersService,
            OrganisationService organisationService,
            OrganisationLocationService organisationLocationService,
            EnquiryService enquiryService,
            AppoinmentService appoinmentService)
        {
            _dbProvider = dbProvider;
            _usersService = usersService;
            _organisationService = organisationService;
            _organisationLocationService = organisationLocationService;
            _enquiryService = enquiryService;
            _appoinmentService = appoinmentService;
        }

        public async Task<IntegrationTokenUrlsRes> GenerateTokenForUser(UsersContext user, string baseUrl, bool regenerate = false)
        {
            if (user == null || user.userid <= 0)
            {
                throw new ArgumentException("Signed-in user is required.");
            }

            using IDb db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureTableTransaction(db);

            var context = await BuildContextForUserTransaction(db, user);
            if (context.organisation_id <= 0)
            {
                throw new InvalidOperationException("Your account is not linked to an organisation.");
            }

            IntegrationToken? existing = null;
            if (regenerate)
            {
                await DeactivateTokensForUserTransaction(db, user.userid, context.organisation_id);
            }
            else
            {
                existing = await SelectActiveTokenForUserTransaction(db, user.userid, context.organisation_id);
            }

            var tokenRow = existing ?? await InsertTokenTransaction(db, user.userid, context.organisation_id, context.location_id, user.userid);
            return BuildUrls(baseUrl, tokenRow.token, context);
        }

        public async Task<IntegrationContextRes> GetContextByToken(string token)
        {
            using IDb db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureTableTransaction(db);

            var tokenRow = await ValidateTokenTransaction(db, token);
            return await BuildContextForTokenTransaction(db, tokenRow);
        }

        public async Task<IntegrationDataRes> GetDataByToken(string token)
        {
            using IDb db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureTableTransaction(db);

            var tokenRow = await ValidateTokenTransaction(db, token);
            var context = await BuildContextForTokenTransaction(db, tokenRow);

            var leads = await _enquiryService.SelectTransaction(db, new EnquirySelectReq
            {
                organisation_id = tokenRow.organisation_id,
                is_active = null,
            });

            var customers = await _appoinmentService.SelectUniqueClientsTransaction(db, new ClientsSelectReq
            {
                organisationid = tokenRow.organisation_id,
            });

            return new IntegrationDataRes
            {
                context = context,
                leads = leads ?? new List<Enquiry>(),
                customers = customers ?? new List<ClientInfoRes>(),
            };
        }

        private static IntegrationTokenUrlsRes BuildUrls(string baseUrl, string token, IntegrationContextRes context)
        {
            var apiBase = (baseUrl ?? "").TrimEnd('/');
            return new IntegrationTokenUrlsRes
            {
                token = token,
                context_url = $"{apiBase}/api/Integration/Context?token={token}",
                data_url = $"{apiBase}/api/Integration/Data?token={token}",
                export_url = $"{apiBase}/api/Integration/Export?token={token}",
                context = context,
            };
        }

        private async Task<IntegrationContextRes> BuildContextForUserTransaction(IDb db, UsersContext user)
        {
            var users = await _usersService.SelectTransaction(db, new UsersSelectReq { id = user.userid });
            var dbUser = users?.FirstOrDefault();
            if (dbUser == null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            return await BuildContextFromDbUserTransaction(db, dbUser, user.organisationid, user.organisationlocationid);
        }

        private async Task<IntegrationContextRes> BuildContextForTokenTransaction(IDb db, IntegrationToken tokenRow)
        {
            var users = await _usersService.SelectTransaction(db, new UsersSelectReq { id = tokenRow.userid });
            var dbUser = users?.FirstOrDefault();
            if (dbUser == null)
            {
                throw new KeyNotFoundException("Token user not found.");
            }

            return await BuildContextFromDbUserTransaction(
                db,
                dbUser,
                tokenRow.organisation_id,
                tokenRow.location_id > 0 ? tokenRow.location_id : dbUser.locationid);
        }

        private async Task<IntegrationContextRes> BuildContextFromDbUserTransaction(
            IDb db,
            Users dbUser,
            long organisationIdHint,
            long locationIdHint)
        {
            long organisationId = organisationIdHint > 0 ? organisationIdHint : dbUser.organisationid;
            long locationId = locationIdHint > 0 ? locationIdHint : dbUser.locationid;

            if (organisationId <= 0 && locationId > 0)
            {
                var staffLocations = await _organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq
                {
                    id = locationId,
                });
                organisationId = staffLocations?.FirstOrDefault()?.organisationid ?? 0;
            }

            var result = new IntegrationContextRes
            {
                userid = dbUser.id,
                user_name = dbUser.name ?? "",
                user_email = dbUser.email ?? "",
                organisation_id = organisationId,
                location_id = locationId,
            };

            if (organisationId > 0)
            {
                var organisations = await _organisationService.SelectTransaction(db, new OrganisationSelectReq
                {
                    id = organisationId,
                });
                result.organisation_name = organisations?.FirstOrDefault()?.name ?? "";
            }

            if (locationId > 0)
            {
                var locations = await _organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq
                {
                    id = locationId,
                });
                result.location_name = locations?.FirstOrDefault()?.name ?? "";
            }
            else if (organisationId > 0)
            {
                var orgLocations = await _organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq
                {
                    organisationid = organisationId,
                });
                var first = orgLocations?.FirstOrDefault();
                if (first != null)
                {
                    result.location_id = first.id;
                    result.location_name = first.name ?? "";
                }
            }

            return result;
        }

        private async Task<IntegrationToken> ValidateTokenTransaction(IDb db, string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new ArgumentException("Token is required.");
            }

            var tokenRow = await SelectByTokenTransaction(db, token.Trim());
            if (tokenRow == null || !tokenRow.is_active)
            {
                throw new UnauthorizedAccessException("Invalid or inactive integration token.");
            }

            await TouchTokenTransaction(db, tokenRow.id);
            return tokenRow;
        }

        private static string GenerateTokenValue()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private async Task EnsureTableTransaction(IDb db)
        {
            const string sql = @"
                CREATE TABLE IF NOT EXISTS integration_tokens (
                    id BIGSERIAL PRIMARY KEY,
                    token VARCHAR(128) NOT NULL UNIQUE,
                    userid BIGINT NOT NULL,
                    organisation_id BIGINT NOT NULL,
                    location_id BIGINT NOT NULL DEFAULT 0,
                    created_by BIGINT NOT NULL DEFAULT 0,
                    is_active BOOLEAN NOT NULL DEFAULT true,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    last_used_at TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_integration_tokens_userid ON integration_tokens(userid);
                CREATE INDEX IF NOT EXISTS idx_integration_tokens_organisation_id ON integration_tokens(organisation_id);
            ";

            DbCommand cmd = db.GetCommand(sql);
            await db.ExecuteNonQuery(cmd);
        }

        private async Task<IntegrationToken?> SelectActiveTokenForUserTransaction(IDb db, long userId, long organisationId)
        {
            const string sql = @"
                SELECT id, token, userid, organisation_id, location_id, created_by, is_active, created_at, last_used_at
                FROM integration_tokens
                WHERE userid = @userid AND organisation_id = @organisation_id AND is_active = TRUE
                ORDER BY created_at DESC
                LIMIT 1
            ";
            DbCommand cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userId;
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;

            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
            {
                return null;
            }

            return ReadToken(reader);
        }

        private async Task<IntegrationToken?> SelectByTokenTransaction(IDb db, string token)
        {
            const string sql = @"
                SELECT id, token, userid, organisation_id, location_id, created_by, is_active, created_at, last_used_at
                FROM integration_tokens
                WHERE token = @token
                LIMIT 1
            ";
            DbCommand cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "token", DbTypes.Types.String).Value = token;

            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
            {
                return null;
            }

            return ReadToken(reader);
        }

        private static IntegrationToken ReadToken(DbDataReader reader)
        {
            return new IntegrationToken
            {
                id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                token = reader["token"] == DBNull.Value ? "" : reader["token"].ToString() ?? "",
                userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]),
                organisation_id = reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]),
                location_id = reader["location_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["location_id"]),
                created_by = reader["created_by"] == DBNull.Value ? 0 : Convert.ToInt64(reader["created_by"]),
                is_active = reader["is_active"] == DBNull.Value || Convert.ToBoolean(reader["is_active"]),
                created_at = reader["created_at"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["created_at"]),
                last_used_at = reader["last_used_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["last_used_at"]),
            };
        }

        private async Task<IntegrationToken> InsertTokenTransaction(
            IDb db,
            long userId,
            long organisationId,
            long locationId,
            long createdBy)
        {
            var token = GenerateTokenValue();
            const string sql = @"
                INSERT INTO integration_tokens (token, userid, organisation_id, location_id, created_by, is_active, created_at)
                VALUES (@token, @userid, @organisation_id, @location_id, @created_by, TRUE, @created_at)
                RETURNING id, token, userid, organisation_id, location_id, created_by, is_active, created_at, last_used_at
            ";
            DbCommand cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "token", DbTypes.Types.String).Value = token;
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userId;
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(cmd, "location_id", DbTypes.Types.Long).Value = locationId;
            db.AddParameter(cmd, "created_by", DbTypes.Types.Long).Value = createdBy;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
            {
                throw new InvalidOperationException("Failed to create integration token.");
            }

            return ReadToken(reader);
        }

        private async Task DeactivateTokensForUserTransaction(IDb db, long userId, long organisationId)
        {
            const string sql = @"
                UPDATE integration_tokens
                SET is_active = FALSE
                WHERE userid = @userid AND organisation_id = @organisation_id AND is_active = TRUE
            ";
            DbCommand cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userId;
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task TouchTokenTransaction(IDb db, long tokenId)
        {
            const string sql = "UPDATE integration_tokens SET last_used_at = @last_used_at WHERE id = @id";
            DbCommand cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = tokenId;
            db.AddParameter(cmd, "last_used_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }
    }
}
