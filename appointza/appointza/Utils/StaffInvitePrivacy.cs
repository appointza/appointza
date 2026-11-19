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
        /// True when the looked-up user may see full identity in the invite UI.
        /// Same organisation or unattached customer (organisationid 0).
        /// </summary>
        public static bool CanRevealIdentity(long userOrganisationId, long callerOrganisationId)
        {
            if (callerOrganisationId <= 0) return false;
            return userOrganisationId <= 0 || userOrganisationId == callerOrganisationId;
        }
    }
}
