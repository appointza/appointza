namespace appointza.Utils
{
    public static class SubdomainHelper
    {
        private static readonly string[] BaseDomains = { "appointza.com", "localhost" };

        /// <summary>
        /// Extracts the custom URL slug from a host like awonderonesurprise.appointza.com.
        /// </summary>
        public static string? ExtractCustomUrlSlug(string host)
        {
            if (string.IsNullOrWhiteSpace(host))
            {
                return null;
            }

            host = host.Trim().ToLowerInvariant();

            if (host.StartsWith("http://") || host.StartsWith("https://"))
            {
                host = new Uri(host).Host.ToLowerInvariant();
            }

            if (host.Contains(':'))
            {
                host = host.Split(':')[0];
            }

            foreach (var domain in BaseDomains)
            {
                if (host == domain || host == $"www.{domain}")
                {
                    return null;
                }

                var suffix = $".{domain}";
                if (!host.EndsWith(suffix))
                {
                    continue;
                }

                var slug = host[..^suffix.Length];
                if (string.IsNullOrEmpty(slug) || slug.Contains('.'))
                {
                    return null;
                }

                return slug;
            }

            return null;
        }
    }
}
