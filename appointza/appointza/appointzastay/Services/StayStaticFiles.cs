using Microsoft.AspNetCore.Hosting;

namespace appointza.Services.AppointzaStay;

/// <summary>
/// Resolves wwwroot paths so uploads are stored where <see cref="Program"/> serves static files.
/// Includes Lodge legacy uploads during local development.
/// </summary>
public static class StayStaticFiles
{
    private static readonly string[] LodgeWwwRootRelatives =
    [
        Path.Combine("..", "..", "..", "lodge", "wwwroot"),
        Path.Combine("..", "..", "lodge", "wwwroot"),
        Path.Combine("..", "..", "..", "..", "lodge", "wwwroot"),
        Path.Combine("..", "lodge", "wwwroot"),
    ];

    public static IReadOnlyList<string> WwwRootCandidates()
    {
        var cwd = Directory.GetCurrentDirectory();
        return
        [
            Path.GetFullPath(Path.Combine(cwd, "..", "..", "appointzabuild", "production", "wwwroot")),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "wwwroot")),
            Path.GetFullPath(Path.Combine(cwd, "wwwroot")),
        ];
    }

    public static IReadOnlyList<string> LodgeWwwRootCandidates()
    {
        var results = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var root in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            foreach (var rel in LodgeWwwRootRelatives)
            {
                var full = Path.GetFullPath(Path.Combine(root, rel));
                if (Directory.Exists(full))
                    results.Add(full);
            }
        }

        return results.ToList();
    }

    /// <summary>Source-tree wwwroot when the API runs from appointzabuild output (dev).</summary>
    public static string? DevelopmentProjectWwwRoot()
    {
        var candidates = new[]
        {
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "appointza", "appointza", "wwwroot")),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "appointza", "appointza", "wwwroot")),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")),
        };

        return candidates.FirstOrDefault(Directory.Exists);
    }

    public static string ResolveWwwRoot()
    {
        foreach (var candidate in WwwRootCandidates())
        {
            if (Directory.Exists(candidate))
                return candidate;
        }

        var fallback = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"));
        Directory.CreateDirectory(fallback);
        return fallback;
    }

    /// <summary>Canonical upload root — ASP.NET <see cref="IWebHostEnvironment.WebRootPath"/>.</summary>
    public static string ResolveUploadWwwRoot(IWebHostEnvironment env)
    {
        if (!string.IsNullOrWhiteSpace(env.WebRootPath) && Directory.Exists(env.WebRootPath))
            return env.WebRootPath;

        return ResolveWwwRoot();
    }

    public static string UploadOrgDirectory(IWebHostEnvironment env)
    {
        var dir = Path.Combine(ResolveUploadWwwRoot(env), "uploads", "org");
        Directory.CreateDirectory(dir);
        return dir;
    }

    public static IEnumerable<string> AllWwwRoots(IWebHostEnvironment? env = null)
    {
        var roots = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        void Add(string? path)
        {
            if (!string.IsNullOrWhiteSpace(path) && Directory.Exists(path))
                roots.Add(path);
        }

        if (env != null)
        {
            Add(env.WebRootPath);
            Add(Path.Combine(env.ContentRootPath, "wwwroot"));
        }

        foreach (var candidate in WwwRootCandidates())
            Add(candidate);

        foreach (var lodge in LodgeWwwRootCandidates())
            Add(lodge);

        Add(DevelopmentProjectWwwRoot());

        return roots;
    }

    /// <summary>All /uploads roots for static file middleware.</summary>
    public static IReadOnlyList<string> UploadServeDirectories(IWebHostEnvironment? env = null)
    {
        var roots = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var www in AllWwwRoots(env))
        {
            var uploads = Path.Combine(www, "uploads");
            if (Directory.Exists(uploads))
                roots.Add(uploads);
        }

        if (roots.Count == 0)
        {
            var primary = env != null
                ? Path.Combine(ResolveUploadWwwRoot(env), "uploads")
                : Path.Combine(ResolveWwwRoot(), "uploads");
            Directory.CreateDirectory(primary);
            roots.Add(primary);
        }

        return roots.ToList();
    }

    /// <summary>Copy uploads from Lodge and other wwwroots into the primary upload folder.</summary>
    public static int SyncUploadsToPrimary(IWebHostEnvironment env)
    {
        var primaryOrg = UploadOrgDirectory(env);
        var copied = 0;

        foreach (var uploadsRoot in UploadServeDirectories(env))
        {
            var sourceOrg = Path.Combine(uploadsRoot, "org");
            if (!Directory.Exists(sourceOrg))
                continue;
            if (string.Equals(sourceOrg, primaryOrg, StringComparison.OrdinalIgnoreCase))
                continue;

            foreach (var source in Directory.GetFiles(sourceOrg))
            {
                var name = Path.GetFileName(source);
                var dest = Path.Combine(primaryOrg, name);
                if (File.Exists(dest))
                    continue;

                File.Copy(source, dest);
                copied++;
            }
        }

        return copied;
    }
}
