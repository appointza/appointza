using System.Security.Cryptography;
using System.Text;
using appointza.Models;
using appointza.Models.Hospitality;

namespace appointza.Utils
{
    /// <summary>
    /// Builds the public subdomain HTML ETag/version key so template saves and live data changes invalidate caches.
    /// </summary>
    public static class PublicHtmlVersionKey
    {
        public static string Build(Sitedetails site, IList<Event>? events, string? templateHtml = null)
        {
            var locUpdated = site.locationdetail?.modifiedon ?? site.locationdetail?.createdon ?? DateTime.MinValue;
            var orgUpdated = site.organisationdetail?.modifiedon ?? site.organisationdetail?.createdon ?? DateTime.MinValue;
            var eventStamp = events?
                .Select(e => e.updated_at)
                .DefaultIfEmpty(DateTime.MinValue)
                .Max() ?? DateTime.MinValue;

            var services = site.orgnaisatinservice ?? new List<OrganisationServices>();
            var rooms = site.hospitality_rooms ?? new List<OrganisationRoom>();
            var serviceCount = services.Count;
            var roomCount = rooms.Count;
            var serviceStamp = services
                .Select(s => s.modifiedon == default ? s.createdon : s.modifiedon)
                .DefaultIfEmpty(DateTime.MinValue)
                .Max();
            var roomStamp = rooms
                .Select(r => r.updated_at)
                .DefaultIfEmpty(DateTime.MinValue)
                .Max();
            var serviceIds = string.Join(",", services.Select(s => s.id).OrderBy(id => id));
            var roomIds = string.Join(",", rooms.Select(r => r.id).OrderBy(id => id));
            var templateId = site.locationdetail?.templateid ?? 0;
            var htmlHash = ShortHash(templateHtml ?? site.template_html ?? "");

            return string.Join(':',
                site.locationdetail?.id ?? 0,
                locUpdated.ToString("O"),
                orgUpdated.ToString("O"),
                eventStamp.ToString("O"),
                $"s{serviceCount}",
                $"r{roomCount}",
                serviceStamp.ToString("O"),
                roomStamp.ToString("O"),
                $"sid[{serviceIds}]",
                $"rid[{roomIds}]",
                $"t{templateId}",
                $"h{htmlHash}");
        }

        public static string ShortHash(string value)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value ?? ""));
            return Convert.ToHexString(bytes.AsSpan(0, 8)).ToLowerInvariant();
        }
    }
}
