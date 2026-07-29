using appointza.Authentication.Services;
using appointza.Models;
using appointza.Models.Campusza;
using appointza.Utils;

namespace appointza.Services.Campusza
{
    /// <summary>
    /// Campusza login against platform Users (APPOINTZA) + user_product_profile; org/staff from campusza DB.
    /// </summary>
    public class UserLoginService
    {
        private readonly IDbProvider platformDbProvider;
        private readonly ICampuszaDbProvider campuszaDbProvider;
        private readonly PlatformUserCredentialService credentialService;
        private readonly UserProductProfileService productProfileService;
        private readonly CustomCryptography cryptography;

        public UserLoginService(
            IDbProvider platformDbProvider,
            ICampuszaDbProvider campuszaDbProvider,
            PlatformUserCredentialService credentialService,
            UserProductProfileService productProfileService,
            CustomCryptography cryptography)
        {
            this.platformDbProvider = platformDbProvider;
            this.campuszaDbProvider = campuszaDbProvider;
            this.credentialService = credentialService;
            this.productProfileService = productProfileService;
            this.cryptography = cryptography;
        }

        public async Task<UserLoginRes> Login(UserLoginReq req)
        {
            if (string.IsNullOrWhiteSpace(req.email) || string.IsNullOrWhiteSpace(req.password))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Email and password are required.");

            string email = req.email.Trim();
            string passwordHash = cryptography.CalculateSHA256Hash(req.password);

            using IDb platformDb = await platformDbProvider.GetDb();
            await platformDb.Connect();

            var credential = await credentialService.GetByEmailTransaction(platformDb, email);

            // Platform user missing, wrong password, or no passwordhash → sync from legacy campusza.users
            if (credential == null
                || string.IsNullOrWhiteSpace(credential.passwordhash)
                || !PasswordMatches(credential.passwordhash, passwordHash))
            {
                var synced = await SyncLegacyCampuszaUserToPlatformAsync(email, passwordHash);
                if (synced != null)
                    credential = synced;
            }

            if (credential == null || !PasswordMatches(credential.passwordhash, passwordHash))
                throw new AppException(AppException.ErrorCodes.InvalidCredential, "Invalid email or password.");

            if (!credential.isactive)
                throw new AppException(AppException.ErrorCodes.InvalidCredential, "User is not active.");

            var profile = await productProfileService.SelectPrimaryForLoginTransaction(
                platformDb, credential.id, ProductCodes.Campusza);

            if (profile == null)
                profile = await TryCreateProfileFromLegacyAsync(platformDb, credential.id, email);

            if (profile == null)
                throw new AppException(AppException.ErrorCodes.InvalidCredential,
                    "No Campusza access for this account. Register your school or contact your administrator.");

            return await BuildLoginResponseAsync(credential.id, credential.email, profile);
        }

        public async Task<UserLoginRes> UpdateProfile(UserProfileUpdateReq req)
        {
            if (string.IsNullOrWhiteSpace(req.userId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "User id is required.");
            if (string.IsNullOrWhiteSpace(req.currentPassword))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Current password is required.");

            if (!long.TryParse(req.userId.Trim(), out long platformUserId) || platformUserId <= 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Invalid user id.");

            using IDb platformDb = await platformDbProvider.GetDb();
            await platformDb.Connect();

            var credential = await credentialService.GetByIdTransaction(platformDb, platformUserId);
            if (credential == null)
                throw new AppException(AppException.ErrorCodes.UserNotFound, "User not found.");

            string currentHash = cryptography.CalculateSHA256Hash(req.currentPassword);
            if (!PasswordMatches(credential.passwordhash, currentHash))
                throw new AppException(AppException.ErrorCodes.InvalidCredential, "Current password is incorrect.");

            string targetEmail = credential.email;
            if (!string.IsNullOrWhiteSpace(req.newEmail))
            {
                targetEmail = req.newEmail.Trim();
                if (targetEmail.Length < 3 || targetEmail.IndexOf('@') < 1)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Enter a valid email address.");
                if (!targetEmail.Equals(credential.email, StringComparison.OrdinalIgnoreCase)
                    && await credentialService.EmailExistsTransaction(platformDb, targetEmail, platformUserId))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest, "That email is already in use.");
                }
            }

            string targetPasswordHash = credential.passwordhash;
            if (!string.IsNullOrWhiteSpace(req.newPassword))
            {
                if (req.newPassword.Length < 6)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "New password must be at least 6 characters.");
                targetPasswordHash = cryptography.CalculateSHA256Hash(req.newPassword);
            }

            string targetName = UsernameFromEmail(targetEmail);
            await credentialService.UpdateEmailAndPasswordAsync(
                platformDb, platformUserId, targetName, targetEmail, targetPasswordHash);

            var profile = await productProfileService.SelectPrimaryForLoginTransaction(
                platformDb, platformUserId, ProductCodes.Campusza);

            if (profile == null)
                throw new AppException(AppException.ErrorCodes.UserNotFound, "Campusza profile not found.");

            if (string.Equals(profile.role, "staff", StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(profile.profileid))
            {
                using IDb campuszaDb = await campuszaDbProvider.GetDb();
                await campuszaDb.Connect();
                await SyncStaffEmail(campuszaDb, profile.profileid, profile.externalorgid, targetEmail);
            }

            return await BuildLoginResponseAsync(platformUserId, targetEmail, profile);
        }

        private static bool PasswordMatches(string storedHash, string computedHash)
        {
            return !string.IsNullOrWhiteSpace(storedHash)
                && string.Equals(storedHash, computedHash, StringComparison.OrdinalIgnoreCase);
        }

        private async Task<UserLoginRes> BuildLoginResponseAsync(long platformUserId, string email, UserProductProfile profile)
        {
            using IDb campuszaDb = await campuszaDbProvider.GetDb();
            await campuszaDb.Connect();

            var org = await GetOrganization(campuszaDb, profile.externalorgid);

            string staffId = "";
            if (string.Equals(profile.role, "staff", StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(profile.profileid))
                    staffId = profile.profileid;
                else
                {
                    var resolved = await GetStaffIdByEmailAndOrg(campuszaDb, email, profile.externalorgid);
                    if (!string.IsNullOrWhiteSpace(resolved))
                        staffId = resolved;
                }
            }

            return new UserLoginRes
            {
                userId = platformUserId.ToString(),
                email = email,
                role = profile.role,
                organizationId = profile.externalorgid,
                organizationName = org?.Name ?? "",
                organizationSlug = org?.Slug ?? "",
                staffId = staffId
            };
        }

        /// <summary>
        /// Copy or update platform user + Campusza profile from legacy campusza.users (same email/password).
        /// </summary>
        private async Task<PlatformUserCredential?> SyncLegacyCampuszaUserToPlatformAsync(string email, string passwordHash)
        {
            using IDb campuszaDb = await campuszaDbProvider.GetDb();
            await campuszaDb.Connect();

            var legacy = await GetLegacyCampuszaUser(campuszaDb, email);
            if (legacy == null || !PasswordMatches(legacy.passwordHash, passwordHash))
                return null;

            using IDb platformDb = await platformDbProvider.GetDb();
            await platformDb.Connect();
            await platformDb.BeginTransaction();

            try
            {
                var existing = await credentialService.GetByEmailTransaction(platformDb, email);
                long userId;

                if (existing != null)
                {
                    userId = existing.id;
                    await credentialService.UpdateEmailAndPasswordAsync(
                        platformDb,
                        userId,
                        legacy.username,
                        legacy.email,
                        legacy.passwordHash);
                }
                else
                {
                    userId = await credentialService.InsertForCampuszaAsync(
                        platformDb,
                        legacy.username,
                        legacy.email,
                        "",
                        legacy.passwordHash);
                }

                await EnsureCampuszaProfileAsync(platformDb, userId, legacy);

                await platformDb.CommitTransaction();
                return await credentialService.GetByIdTransaction(platformDb, userId);
            }
            catch
            {
                await platformDb.RollbackTransaction();
                throw;
            }
        }

        private async Task<UserProductProfile?> TryCreateProfileFromLegacyAsync(IDb platformDb, long userId, string email)
        {
            using IDb campuszaDb = await campuszaDbProvider.GetDb();
            await campuszaDb.Connect();

            var legacy = await GetLegacyCampuszaUser(campuszaDb, email);
            if (legacy == null)
                return null;

            await EnsureCampuszaProfileAsync(platformDb, userId, legacy);
            return await productProfileService.SelectPrimaryForLoginTransaction(
                platformDb, userId, ProductCodes.Campusza);
        }

        private async Task EnsureCampuszaProfileAsync(IDb platformDb, long userId, LegacyUserRow legacy)
        {
            var existing = await productProfileService.SelectPrimaryForLoginTransaction(
                platformDb, userId, ProductCodes.Campusza);

            if (existing != null)
                return;

            await productProfileService.InsertTransaction(
                platformDb,
                userId,
                ProductCodes.Campusza,
                legacy.role,
                legacy.organizationId,
                string.IsNullOrWhiteSpace(legacy.profileId) ? userId.ToString() : legacy.profileId,
                legacy.status);
        }

        private sealed class LegacyUserRow
        {
            public string email { get; set; } = "";
            public string username { get; set; } = "";
            public string role { get; set; } = "";
            public string status { get; set; } = "";
            public string organizationId { get; set; } = "";
            public string passwordHash { get; set; } = "";
            public string profileId { get; set; } = "";
        }

        private static async Task<LegacyUserRow?> GetLegacyCampuszaUser(IDb db, string email)
        {
            string query = @"
                SELECT email, username, role, status, organization_id, password_hash, profile_id
                FROM users
                WHERE lower(email) = lower(@email) AND is_active = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;

            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return null;

            return new LegacyUserRow
            {
                email = reader["email"]?.ToString() ?? "",
                username = reader["username"]?.ToString() ?? "",
                role = reader["role"]?.ToString() ?? "",
                status = reader["status"]?.ToString() ?? "active",
                organizationId = reader["organization_id"]?.ToString() ?? "",
                passwordHash = reader["password_hash"]?.ToString() ?? "",
                profileId = reader["profile_id"]?.ToString() ?? "",
            };
        }

        private static string UsernameFromEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return "";
            int at = email.IndexOf('@');
            string local = at > 0 ? email.Substring(0, at) : email;
            local = local.Trim().Replace(" ", "_", StringComparison.Ordinal);
            return local.Length > 0 ? local : email;
        }

        private static async Task SyncStaffEmail(IDb db, string staffId, string organizationId, string email)
        {
            if (string.IsNullOrWhiteSpace(staffId) || string.IsNullOrWhiteSpace(organizationId))
                return;

            string query = @"
                UPDATE staff
                SET email = @email, updated_at = @updated_at
                WHERE staff_id = @staff_id AND organization_id = @organization_id AND is_active = true;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email.Trim();
            db.AddParameter(cmd, "staff_id", DbTypes.Types.String).Value = staffId;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        private static async Task<(string Name, string Slug)?> GetOrganization(IDb db, string organizationId)
        {
            if (string.IsNullOrWhiteSpace(organizationId))
                return null;

            string query = @"
                SELECT name, slug FROM organizations
                WHERE id = @id AND is_active = true LIMIT 1;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = organizationId;

            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
            {
                return (
                    reader["name"]?.ToString() ?? "",
                    reader["slug"]?.ToString() ?? ""
                );
            }

            return null;
        }

        private static async Task<string?> GetStaffIdByEmailAndOrg(IDb db, string email, string organizationId)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(organizationId))
                return null;

            string query = @"
                SELECT staff_id FROM staff
                WHERE lower(email) = lower(@email)
                  AND organization_id = @organization_id AND is_active = true
                LIMIT 1;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;

            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
            {
                var id = reader["staff_id"]?.ToString();
                if (!string.IsNullOrWhiteSpace(id))
                    return id;
            }

            return null;
        }
    }
}
