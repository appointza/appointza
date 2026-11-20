using appointza.Models;

namespace appointza.Utils
{
    /// <summary>Helpers for org-admin staff invite lookups (no cross-org PII).</summary>
    public static class StaffInvitePrivacy
    {
        public static string MaskDisplayName(string? name)
        {
            var trimmed = (name ?? "").Trim();
            if (string.IsNullOrEmpty(trimmed)) return "User";
            var parts = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1)
            {
                var p = parts[0];
                return p.Length <= 1 ? "*" : $"{p[0]}***";
            }
            return $"{parts[0][0]}*** {parts[^1][0]}***";
        }

        /// <summary>
        /// True ONLY when the looked-up user already belongs to the caller's organisation.
        /// Users outside the caller's org (including unattached customers with organisationid 0)
        /// must never reveal full name or email.
        /// </summary>
        public static bool CanRevealIdentity(long userOrganisationId, long callerOrganisationId)
        {
            if (callerOrganisationId <= 0 || userOrganisationId <= 0) return false;
            return userOrganisationId == callerOrganisationId;
        }

        /// <summary>
        /// True when the authenticated caller is an organisation admin (org owner/primary account
        /// or explicitly granted staff-management permission) for the target organisation.
        /// </summary>
        public static bool IsOrgAdminForStaffInvite(Users? caller, long callerOrganisationId)
        {
            if (caller == null || caller.id <= 0 || callerOrganisationId <= 0) return false;
            if (!caller.isactive || caller.issuspended) return false;
            if (caller.isfactory) return true;
            if (caller.organisationid != callerOrganisationId) return false;
            if (caller.parentid <= 0) return true;
            return caller.attributes?.permission?.editandviewStaffManagement == true;
        }
    }
}
