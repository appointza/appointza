using System.Text.RegularExpressions;

namespace appointza.Models.AppointzaStay;

public enum AssetKind { upload, url }

public enum AssetCategory
{
    logo,
    hero,
    gallery,
    favicon,
    social,
    document,
    other
}

public class OrganizationAsset
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = "";
    public AssetKind Kind { get; set; } = AssetKind.upload;
    public AssetCategory Category { get; set; } = AssetCategory.other;
    public string Url { get; set; } = "";
    public string? FileName { get; set; }
    public string? MimeType { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record PickableImage(string Id, string Title, string Url, string CategoryLabel, string Source);

public class OrganizationProfile
{
    public string Name { get; set; } = AppBranding.Name;
    public string Tagline { get; set; } = AppBranding.Tagline;
    public string WebsiteUrl { get; set; } = "";
    /// <summary>User-chosen subdomain, e.g. "example" for example.appointzastay.com</summary>
    public string Subdomain { get; set; } = "";
    public string? LogoAssetId { get; set; }
    public List<OrganizationAsset> Assets { get; set; } = [];
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string CustomDomain =>
        string.IsNullOrWhiteSpace(Subdomain) ? "" : $"{Subdomain}.{AppBranding.CustomDomainSuffix}";

    public string CustomDomainUrl =>
        string.IsNullOrWhiteSpace(CustomDomain) ? "" : $"https://{CustomDomain}";
}

public static class OrganizationDomain
{
    private static readonly HashSet<string> ReservedSubdomains =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "www", "app", "api", "admin", "mail", "ftp", "cdn", "static", "assets", "help", "support", "status",
        };

    public static string SlugFromName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return "property";

        var slug = Regex.Replace(name.Trim().ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "property" : slug;
    }

    public static string NormalizeSubdomain(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return "";

        var value = input.Trim().ToLowerInvariant();
        var suffix = AppBranding.CustomDomainSuffix;

        if (value.EndsWith('.' + suffix, StringComparison.Ordinal))
            value = value[..^(suffix.Length + 1)];

        if (value.Contains('.'))
            throw new ArgumentException($"Use only the subdomain part (e.g. myhotel), not the full domain.");

        if (value.Length is < 3 or > 63)
            throw new ArgumentException("Subdomain must be 3–63 characters.");

        if (!System.Text.RegularExpressions.Regex.IsMatch(value, @"^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"))
            throw new ArgumentException("Use lowercase letters, numbers, and hyphens only. Cannot start or end with a hyphen.");

        if (ReservedSubdomains.Contains(value))
            throw new ArgumentException("That subdomain is reserved. Choose another name.");

        return value;
    }

  public static bool TryParseSubdomainFromHost(string? host, out string subdomain)
    {
        subdomain = "";
        if (string.IsNullOrWhiteSpace(host))
            return false;

        var hostOnly = host.Split(':')[0].Trim().ToLowerInvariant();
        if (hostOnly is "localhost" or "127.0.0.1")
            return false;

        if (hostOnly.EndsWith(".localhost", StringComparison.Ordinal))
        {
            subdomain = hostOnly[..^".localhost".Length];
            return subdomain.Length >= 3 && !ReservedSubdomains.Contains(subdomain);
        }

        var suffix = AppBranding.CustomDomainSuffix.ToLowerInvariant();
        var dottedSuffix = "." + suffix;
        if (hostOnly.EndsWith(dottedSuffix, StringComparison.Ordinal))
        {
            subdomain = hostOnly[..^dottedSuffix.Length];
            if (subdomain is "" or "www")
                return false;
            return subdomain.Length >= 3 && !ReservedSubdomains.Contains(subdomain);
        }

        return false;
    }

    public static string BuildPublicWebsiteUrl(
        string? subdomain,
        string? requestHost = null,
        string? requestScheme = "https",
        string appPath = "/appointzastay")
    {
        if (string.IsNullOrWhiteSpace(subdomain))
            return "";

        var sub = subdomain.Trim().ToLowerInvariant();
        var scheme = string.IsNullOrWhiteSpace(requestScheme) ? "https" : requestScheme.Trim().TrimEnd(':');
        var path = string.IsNullOrWhiteSpace(appPath) ? "/" : (appPath.StartsWith('/') ? appPath : "/" + appPath);
        if (!path.EndsWith('/'))
            path += "/";

        if (!string.IsNullOrWhiteSpace(requestHost))
        {
            var hostOnly = requestHost.Split(':')[0].Trim().ToLowerInvariant();
            if (hostOnly.EndsWith(".localhost", StringComparison.Ordinal) ||
                hostOnly.Equals("localhost", StringComparison.OrdinalIgnoreCase))
            {
                var port = requestHost.Contains(':') ? ":" + requestHost.Split(':')[^1] : "";
                return $"{scheme}://{sub}.localhost{port}{path}";
            }

            if (TryParseSubdomainFromHost(requestHost, out var parsed) &&
                string.Equals(parsed, sub, StringComparison.OrdinalIgnoreCase))
                return $"{scheme}://{requestHost.Trim()}{path}";
        }

        return $"{scheme}://{sub}.{AppBranding.CustomDomainSuffix}{path}";
    }
}

public static class AssetCatalog
{
    public static readonly (AssetCategory Value, string Label, string Icon)[] Categories =
    [
        (AssetCategory.logo, "Logo", "◆"),
        (AssetCategory.hero, "Hero / Banner", "▤"),
        (AssetCategory.gallery, "Gallery", "▦"),
        (AssetCategory.favicon, "Favicon", "●"),
        (AssetCategory.social, "Social / Link", "🔗"),
        (AssetCategory.document, "Document", "📄"),
        (AssetCategory.other, "Other", "📁"),
    ];

    public static string CategoryLabel(AssetCategory category) =>
        Categories.FirstOrDefault(c => c.Value == category).Label ?? category.ToString();

    public static string CategoryIcon(AssetCategory category) =>
        Categories.FirstOrDefault(c => c.Value == category).Icon ?? "📁";

    public static bool IsImageAsset(OrganizationAsset asset)
    {
        if (asset.Kind == AssetKind.upload)
        {
            return asset.MimeType?.StartsWith("image/", StringComparison.OrdinalIgnoreCase) == true ||
                   asset.Url.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
                   asset.Url.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase) ||
                   asset.Url.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
                   asset.Url.EndsWith(".gif", StringComparison.OrdinalIgnoreCase) ||
                   asset.Url.EndsWith(".webp", StringComparison.OrdinalIgnoreCase) ||
                   asset.Url.EndsWith(".svg", StringComparison.OrdinalIgnoreCase);
        }

        return asset.Url.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
               asset.Url.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase) ||
               asset.Url.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
               asset.Url.EndsWith(".gif", StringComparison.OrdinalIgnoreCase) ||
               asset.Url.EndsWith(".webp", StringComparison.OrdinalIgnoreCase) ||
               asset.Url.EndsWith(".svg", StringComparison.OrdinalIgnoreCase) ||
               asset.Url.Contains("images.unsplash.com", StringComparison.OrdinalIgnoreCase) ||
               asset.Url.Contains("images.pexels.com", StringComparison.OrdinalIgnoreCase);
    }

    public static bool TryParseCategory(string? value, out AssetCategory category)
    {
        category = AssetCategory.gallery;
        if (string.IsNullOrWhiteSpace(value))
            return true;

        var trimmed = value.Trim();
        if (Enum.TryParse(trimmed, ignoreCase: true, out category))
            return true;

        if (int.TryParse(trimmed, out var index) && Enum.IsDefined(typeof(AssetCategory), index))
        {
            category = (AssetCategory)index;
            return true;
        }

        return false;
    }
}

public class UploadImagesForm
{
    public List<IFormFile>? Files { get; set; }
    public string? Category { get; set; }
    public string? Notes { get; set; }
    public string? TitlePrefix { get; set; }
}
