using appointza.Utils;
using System.Data.Common;

namespace appointza.Services.Campusza
{
    /// <summary>Resolve Campusza org UUID from JWT (preferred) or request, and verify it exists.</summary>
    internal static class CampuszaOrganizationScope
    {
        /// <summary>JWT org id wins over client body so stale localStorage cannot override the session.</summary>
        public static string ResolveOrganizationId(RequestState requestState, string? fromReq)
        {
            var fromJwt = requestState.CampuszaOrganizationId;
            if (!string.IsNullOrWhiteSpace(fromJwt))
                return fromJwt.Trim();

            if (!string.IsNullOrWhiteSpace(fromReq))
                return fromReq.Trim();

            return "";
        }

        public static async Task<string> RequireOrganizationIdAsync(IDb db, RequestState requestState, string? fromReq)
        {
            var orgId = ResolveOrganizationId(requestState, fromReq);
            if (string.IsNullOrWhiteSpace(orgId))
            {
                throw new AppException(
                    AppException.ErrorCodes.BadRequest,
                    "Organization context is missing. Sign out and sign in again.");
            }

            if (!await OrganizationExistsAsync(db, orgId))
            {
                throw new AppException(
                    AppException.ErrorCodes.BadRequest,
                    "Your school organization was not found in Campusza. Register the school or contact your administrator.");
            }

            return orgId;
        }

        public static async Task<bool> OrganizationExistsAsync(IDb db, string organizationId)
        {
            if (string.IsNullOrWhiteSpace(organizationId))
                return false;

            const string query = @"
                SELECT 1 FROM organizations
                WHERE id = @id AND is_active = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = organizationId.Trim();

            using DbDataReader reader = await db.Execute(cmd);
            return await reader.ReadAsync();
        }
    }
}
