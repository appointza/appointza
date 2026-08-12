using System.Text;
using System.Text.RegularExpressions;
using System.Globalization;

namespace appointza.Utils
{
    /// <summary>
    /// Helper class for generating and normalizing URL slugs
    /// Handles spaces, special characters, and Unicode characters
    /// </summary>
    public static class SlugHelper
    {
        /// <summary>
        /// Converts a string to a URL-safe slug
        /// Example: "Organization Name" => "organization-name"
        /// Example: "São Paulo" => "sao-paulo"
        /// </summary>
        public static string ToSlug(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            // Convert to lowercase
            text = text.ToLowerInvariant();

            // Normalize unicode characters (remove accents, etc.)
            text = RemoveDiacritics(text);

            // Replace spaces and underscores with hyphens
            text = Regex.Replace(text, @"[\s_]+", "-");

            // Remove all non-alphanumeric characters except hyphens
            text = Regex.Replace(text, @"[^a-z0-9\-]", "");

            // Replace multiple consecutive hyphens with a single hyphen
            text = Regex.Replace(text, @"-+", "-");

            // Trim hyphens from start and end
            text = text.Trim('-');

            return text;
        }

        /// <summary>
        /// Normalizes a string for comparison purposes
        /// Removes spaces, special characters, converts to lowercase
        /// </summary>
        public static string Normalize(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            // Convert to lowercase
            text = text.ToLowerInvariant();

            // Normalize unicode characters
            text = RemoveDiacritics(text);

            // Remove all non-alphanumeric characters
            text = Regex.Replace(text, @"[^a-z0-9]", "");

            return text;
        }

        /// <summary>
        /// Removes diacritics (accents) from characters
        /// Example: "é" => "e", "ñ" => "n"
        /// </summary>
        private static string RemoveDiacritics(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return text;

            // Normalize to FormD (decomposed form)
            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                // Keep only non-spacing marks (accents are NonSpacingMark)
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            // Return to FormC (composed form)
            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }

        /// <summary>
        /// Checks if two strings match after normalization
        /// Useful for comparing database values with URL slugs
        /// </summary>
        public static bool NormalizedEquals(string text1, string text2)
        {
            if (string.IsNullOrWhiteSpace(text1) && string.IsNullOrWhiteSpace(text2))
                return true;

            if (string.IsNullOrWhiteSpace(text1) || string.IsNullOrWhiteSpace(text2))
                return false;

            return Normalize(text1).Equals(Normalize(text2), StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Checks if text1 contains text2 after normalization
        /// </summary>
        public static bool NormalizedContains(string text1, string text2)
        {
            if (string.IsNullOrWhiteSpace(text1) || string.IsNullOrWhiteSpace(text2))
                return false;

            return Normalize(text1).Contains(Normalize(text2), StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// First label from a stored custom URL value (slug only).
        /// Examples: "appointzachn", "http://appointzachn.localhost:8083" → normalized "appointzachn"
        /// </summary>
        public static string ExtractCustomUrlSlug(string? storedCustomUrl)
        {
            if (string.IsNullOrWhiteSpace(storedCustomUrl))
                return string.Empty;

            var trimmed = storedCustomUrl.Trim();
            var withoutScheme = Regex.Replace(trimmed, "^https?://", "", RegexOptions.IgnoreCase);
            var hostOnly = withoutScheme.Split('/')[0];
            var slug = hostOnly.Split('.')[0];
            return Normalize(slug);
        }

        public static bool CustomUrlSlugMatches(string? storedCustomUrl, string? requestedSlug)
        {
            var stored = ExtractCustomUrlSlug(storedCustomUrl);
            var requested = Normalize(requestedSlug);
            return !string.IsNullOrEmpty(stored) &&
                   !string.IsNullOrEmpty(requested) &&
                   stored.Equals(requested, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Generates a subdomain URL from organization and location details
        /// Example: "Organization Name", "Area Name", "City Name", "State Name" 
        /// => "organization-name-area-name-city-name-state-name"
        /// </summary>
        public static string GenerateSubdomainUrl(
            string organizationName, 
            string areaName, 
            string cityName, 
            string stateName)
        {
            var orgSlug = ToSlug(organizationName);
            var areaSlug = ToSlug(areaName);
            var citySlug = ToSlug(cityName);
            var stateSlug = ToSlug(stateName);

            // Build subdomain parts, skipping empty values
            var parts = new List<string>();
            
            if (!string.IsNullOrEmpty(orgSlug))
                parts.Add(orgSlug);
            
            if (!string.IsNullOrEmpty(areaSlug))
                parts.Add(areaSlug);
            
            if (!string.IsNullOrEmpty(citySlug))
                parts.Add(citySlug);
            
            if (!string.IsNullOrEmpty(stateSlug))
                parts.Add(stateSlug);

            return string.Join("-", parts);
        }
    }
}
