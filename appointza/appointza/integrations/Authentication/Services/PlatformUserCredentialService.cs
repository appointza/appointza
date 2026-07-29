using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Authentication.Services
{
    public class PlatformUserCredentialService
    {
        private readonly IDbProvider dbProvider;

        public PlatformUserCredentialService(IDbProvider dbProvider)
        {
            this.dbProvider = dbProvider;
        }

        public async Task<PlatformUserCredential?> GetByEmailAsync(string email)
        {
            using IDb db = await dbProvider.GetDb();
            await db.Connect();
            return await GetByEmailTransaction(db, email);
        }

        public async Task<PlatformUserCredential?> GetByIdAsync(long id)
        {
            using IDb db = await dbProvider.GetDb();
            await db.Connect();
            return await GetByIdTransaction(db, id);
        }

        public async Task<bool> EmailExistsAsync(string email, long excludeUserId = 0)
        {
            using IDb db = await dbProvider.GetDb();
            await db.Connect();
            return await EmailExistsTransaction(db, email, excludeUserId);
        }

        public async Task<long> InsertForCampuszaAsync(
            IDb db,
            string name,
            string email,
            string mobile,
            string passwordHash)
        {
            string query = @"
                INSERT INTO Users (
                    name, email, mobile, mobilecountrycode, designation,
                    otp, otpexpirationtime, organisationid, locationid, profileimage,
                    passwordhash, version, createdby, createdon, modifiedby, modifiedon,
                    attributes, isactive, issuspended, parentid, isfactory, notes,
                    isverified, accountactive, push_token
                )
                VALUES (
                    @name, @email, @mobile, '', '',
                    '', @otpexpirationtime, 0, 0, 0,
                    @passwordhash, 1, 0, @now, 0, @now,
                    '{}'::jsonb, true, false, 0, false, '',
                    false, true, ''
                )
                RETURNING id;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = name ?? "";
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email ?? "";
            db.AddParameter(cmd, "mobile", DbTypes.Types.String).Value = mobile ?? "";
            db.AddParameter(cmd, "passwordhash", DbTypes.Types.String).Value = passwordHash ?? "";
            db.AddParameter(cmd, "otpexpirationtime", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            using DbDataReader reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
                return reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);

            return 0;
        }

        public async Task UpdateEmailAndPasswordAsync(IDb db, long userId, string name, string email, string passwordHash)
        {
            string query = @"
                UPDATE Users
                SET name = @name,
                    email = @email,
                    passwordhash = @passwordhash,
                    modifiedon = @modifiedon,
                    version = version + 1
                WHERE id = @id AND isactive = true;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = userId;
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = name ?? "";
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email ?? "";
            db.AddParameter(cmd, "passwordhash", DbTypes.Types.String).Value = passwordHash ?? "";
            db.AddParameter(cmd, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        public async Task<PlatformUserCredential?> GetByEmailTransaction(IDb db, string email)
        {
            string query = @"
                SELECT id, name, email, mobile, passwordhash, isactive, accountactive
                FROM Users
                WHERE lower(email) = lower(@email) AND isactive = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email.Trim();

            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return null;

            return MapCredential(reader);
        }

        public async Task<PlatformUserCredential?> GetByIdTransaction(IDb db, long id)
        {
            string query = @"
                SELECT id, name, email, mobile, passwordhash, isactive, accountactive
                FROM Users
                WHERE id = @id AND isactive = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = id;

            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return null;

            return MapCredential(reader);
        }

        public async Task<bool> EmailExistsTransaction(IDb db, string email, long excludeUserId = 0)
        {
            string query = @"
                SELECT 1 FROM Users
                WHERE lower(email) = lower(@email)
                  AND isactive = true
                  AND (@exclude_id = 0 OR id <> @exclude_id)
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email.Trim();
            db.AddParameter(cmd, "exclude_id", DbTypes.Types.Long).Value = excludeUserId;

            using DbDataReader reader = await db.Execute(cmd);
            return await reader.ReadAsync();
        }

        private static PlatformUserCredential MapCredential(DbDataReader reader)
        {
            return new PlatformUserCredential
            {
                id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                name = reader["name"]?.ToString() ?? "",
                email = reader["email"]?.ToString() ?? "",
                mobile = reader["mobile"]?.ToString() ?? "",
                passwordhash = reader["passwordhash"]?.ToString() ?? "",
                isactive = reader["isactive"] != DBNull.Value && Convert.ToBoolean(reader["isactive"]),
                accountactive = reader["accountactive"] != DBNull.Value && Convert.ToBoolean(reader["accountactive"]),
            };
        }
    }
}
