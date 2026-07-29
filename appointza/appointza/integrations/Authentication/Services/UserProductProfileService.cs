using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Authentication.Services
{
    public class UserProductProfileService
    {
        private readonly IDbProvider dbProvider;

        public UserProductProfileService(IDbProvider dbProvider)
        {
            this.dbProvider = dbProvider;
        }

        public async Task InsertTransaction(
            IDb db,
            long userid,
            string product,
            string role,
            string externalOrgId,
            string profileId,
            string status = "active")
        {
            string query = @"
                INSERT INTO user_product_profile (
                    userid, product, role, externalorgid, profileid, status, isactive, createdon, modifiedon
                )
                VALUES (
                    @userid, @product, @role, @externalorgid, @profileid, @status, true, @now, @now
                );
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            db.AddParameter(cmd, "product", DbTypes.Types.String).Value = product;
            db.AddParameter(cmd, "role", DbTypes.Types.String).Value = role;
            db.AddParameter(cmd, "externalorgid", DbTypes.Types.String).Value = externalOrgId;
            db.AddParameter(cmd, "profileid", DbTypes.Types.String).Value = profileId;
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        public async Task<UserProductProfile?> SelectPrimaryForLoginTransaction(IDb db, long userid, string product)
        {
            string query = @"
                SELECT id, userid, product, role, externalorgid, profileid, status, isactive
                FROM user_product_profile
                WHERE userid = @userid
                  AND product = @product
                  AND isactive = true
                  AND lower(status) = 'active'
                ORDER BY id ASC
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "userid", DbTypes.Types.Long).Value = userid;
            db.AddParameter(cmd, "product", DbTypes.Types.String).Value = product;

            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return null;

            return MapProfile(reader);
        }

        public async Task UpdateProfileForStaffTransaction(
            IDb db,
            string profileId,
            string externalOrgId,
            string role,
            string status)
        {
            string query = @"
                UPDATE user_product_profile
                SET role = @role,
                    status = @status,
                    modifiedon = @modifiedon
                WHERE product = @product
                  AND profileid = @profileid
                  AND externalorgid = @externalorgid
                  AND isactive = true;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "product", DbTypes.Types.String).Value = ProductCodes.Campusza;
            db.AddParameter(cmd, "profileid", DbTypes.Types.String).Value = profileId;
            db.AddParameter(cmd, "externalorgid", DbTypes.Types.String).Value = externalOrgId;
            db.AddParameter(cmd, "role", DbTypes.Types.String).Value = role;
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(cmd, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        private static UserProductProfile MapProfile(DbDataReader reader)
        {
            return new UserProductProfile
            {
                id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]),
                product = reader["product"]?.ToString() ?? "",
                role = reader["role"]?.ToString() ?? "",
                externalorgid = reader["externalorgid"]?.ToString() ?? "",
                profileid = reader["profileid"]?.ToString() ?? "",
                status = reader["status"]?.ToString() ?? "",
                isactive = reader["isactive"] != DBNull.Value && Convert.ToBoolean(reader["isactive"]),
            };
        }
    }
}
