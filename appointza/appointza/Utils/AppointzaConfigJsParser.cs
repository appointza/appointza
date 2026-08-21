using System.Text.RegularExpressions;

namespace appointza.Utils
{
    /// <summary>
    /// Reads the same <c>config.js</c> the browser loads (<c>window.APP_CONFIG</c>) so the API
    /// uses the same <c>baseurl</c> / <c>templateBaseUrl</c> as the UI without a second copy in appsettings.
    /// </summary>
    public static class AppointzaConfigJsParser
    {
        public static IReadOnlyList<string> GetConfigJsPathCandidates()
        {
            var paths = new List<string>();
            var cwd = Directory.GetCurrentDirectory();
            var baseDir = AppContext.BaseDirectory;

            // Deployed: next to the executable (wwwroot is typical for this project)
            paths.Add(Path.GetFullPath(Path.Combine(baseDir, "wwwroot", "config.js")));

            // Run from build output with wwwroot under production
            paths.Add(Path.GetFullPath(Path.Combine(baseDir, "config.js")));

            // Server project working directory
            paths.Add(Path.GetFullPath(Path.Combine(cwd, "wwwroot", "config.js")));

            // Monorepo: Appointza production build output
            paths.Add(Path.GetFullPath(Path.Combine(cwd, "..", "..", "appointzabuild", "appointzaproduction", "wwwroot", "config.js")));
            paths.Add(Path.GetFullPath(Path.Combine(cwd, "..", "..", "appointzabuild", "appointzaproduction", "config.js")));
            paths.Add(Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "..", "appointzabuild", "appointzaproduction", "wwwroot", "config.js")));
            paths.Add(Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "..", "appointzabuild", "appointzaproduction", "config.js")));

            return DeduplicateExisting(paths);
        }

        private static IReadOnlyList<string> DeduplicateExisting(IEnumerable<string> paths)
        {
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var list = new List<string>();
            foreach (var p in paths)
            {
                if (string.IsNullOrWhiteSpace(p) || seen.Contains(p)) continue;
                seen.Add(p);
                if (File.Exists(p)) list.Add(p);
            }
            return list;
        }

        /// <summary>Try to load from the first path that contains a parsable <c>baseurl</c>.</summary>
        public static bool TryLoad(out string? baseUrl, out string? templateBaseUrl, out string? loadedFromPath)
        {
            baseUrl = null;
            templateBaseUrl = null;
            loadedFromPath = null;
            foreach (var path in GetConfigJsPathCandidates())
            {
                try
                {
                    var text = File.ReadAllText(path);
                    if (!TryParse(text, out var b, out var t) || string.IsNullOrWhiteSpace(b))
                        continue;
                    baseUrl = b.Trim();
                    templateBaseUrl = t?.Trim();
                    loadedFromPath = path;
                    return true;
                }
                catch
                {
                    // try next
                }
            }
            return false;
        }

        public static bool TryParse(string content, out string? baseUrl, out string? templateBaseUrl)
        {
            baseUrl = null;
            templateBaseUrl = null;
            if (string.IsNullOrWhiteSpace(content)) return false;

            var baseMatch = Regex.Match(
                content,
                @"\bbaseurl\s*:\s*['""]([^'""]+)['""]",
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
            if (baseMatch.Success) baseUrl = baseMatch.Groups[1].Value;

            var tplMatch = Regex.Match(
                content,
                @"\btemplateBaseUrl\s*:\s*['""]([^'""]+)['""]",
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
            if (tplMatch.Success) templateBaseUrl = tplMatch.Groups[1].Value;

            return !string.IsNullOrWhiteSpace(baseUrl);
        }
    }
}
