using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class AssetService
{
    private static readonly HashSet<string> AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    private static readonly HashSet<string> AllowedMimeTypes =
    [
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    ];

    private readonly AppDataStore _data;
    private readonly OrganisationResolver _org;
    private readonly IWebHostEnvironment _env;
    private readonly LogService _logs;

    public AssetService(AppDataStore data, OrganisationResolver org, IWebHostEnvironment env, LogService logs)
    {
        _data = data;
        _org = org;
        _env = env;
        _logs = logs;
        EnsureUploadDirectory();
    }

    public Organisation GetProfile() => _org.Current;

    public OrganizationAsset? GetAsset(string id) =>
        (_org.Current.Assets ?? []).FirstOrDefault(a => a.Id == id);

    public IReadOnlyList<OrganizationAsset> GetAssets() =>
        (_org.Current.Assets ?? []).OrderByDescending(a => a.UpdatedAt).ToList();

    /// <summary>All image assets for pickers (single library).</summary>
    public IReadOnlyList<PickableImage> GetPickableImages()
    {
        var org = _org.Current;
        return GetAssets()
            .Where(AssetCatalog.IsImageAsset)
            .Select(a => new PickableImage(
                a.Id,
                a.Title,
                a.Url,
                string.IsNullOrWhiteSpace(a.Notes)
                    ? AssetCatalog.CategoryLabel(a.Category)
                    : a.Notes,
                "asset"))
            .ToList();
    }

    public void SaveOrganization(string name, string? tagline, string? websiteUrl, string? logoAssetId, string? subdomain = null)
    {
        var org = _org.Current;
        org.Name = string.IsNullOrWhiteSpace(name) ? AppBranding.Name : name.Trim();
        org.Tagline = (tagline ?? "").Trim();
        org.WebsiteUrl = (websiteUrl ?? "").Trim();
        org.LogoAssetId = string.IsNullOrWhiteSpace(logoAssetId) ? null : logoAssetId;
        org.Assets ??= [];
        if (subdomain != null && !string.IsNullOrWhiteSpace(subdomain))
            ApplySubdomain(org, subdomain);
        _org.Save(org);
        _logs.Add("update", "organisation", org.Id, "Organisation profile saved");
    }

    public void SetOrganizationLogo(string assetId)
    {
        var org = _org.Current;
        org.Assets ??= [];
        if (GetAsset(assetId) == null)
            throw new ArgumentException("Logo asset not found.");

        org.LogoAssetId = assetId;
        _org.Save(org);
        _logs.Add("update", "organisation", org.Id, "Organization logo updated");
    }

    public void SaveSubdomain(string subdomain)
    {
        var org = _org.Current;
        ApplySubdomain(org, subdomain);
        org.UpdatedAt = DateTime.UtcNow;
        Persist();
    }

    private void ApplySubdomain(Organisation org, string subdomain)
    {
        org.Subdomain = OrganizationDomain.NormalizeSubdomain(subdomain);
        org.WebsiteUrl = OrganizationDomain.BuildPublicWebsiteUrl(
            org.Subdomain, _org.RequestHost(), _org.RequestScheme());
    }

    public OrganizationAsset AddUrlAsset(string title, AssetCategory category, string url, string? notes)
    {
        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException("URL is required.");

        var asset = new OrganizationAsset
        {
            Title = string.IsNullOrWhiteSpace(title) ? url.Trim() : title.Trim(),
            Kind = AssetKind.url,
            Category = category,
            Url = url.Trim(),
            Notes = notes?.Trim(),
        };
        _org.Current.Assets ??= [];
        _org.Current.Assets.Add(asset);
        _org.Current.UpdatedAt = DateTime.UtcNow;
        Persist();
        return asset;
    }

    public OrganizationAsset UpdateAsset(string id, string title, AssetCategory category, string url, string? notes)
    {
        var asset = GetAsset(id) ?? throw new InvalidOperationException("Asset not found.");
        asset.Title = string.IsNullOrWhiteSpace(title) ? asset.Title : title.Trim();
        asset.Category = category;
        asset.Notes = notes?.Trim();

        if (asset.Kind == AssetKind.url)
        {
            if (string.IsNullOrWhiteSpace(url))
                throw new ArgumentException("URL is required.");
            asset.Url = url.Trim();
        }

        asset.UpdatedAt = DateTime.UtcNow;
        _org.Current.UpdatedAt = DateTime.UtcNow;
        Persist();
        return asset;
    }

    public async Task<OrganizationAsset> SaveUploadAsync(
        IFormFile file,
        string title,
        AssetCategory category,
        string? notes,
        string? replaceAssetId = null)
    {
        if (file.Length == 0)
            throw new ArgumentException("Choose a file to upload.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            throw new ArgumentException("Only JPG, PNG, GIF, WebP, and SVG images are allowed.");

        if (!string.IsNullOrEmpty(file.ContentType) && !AllowedMimeTypes.Contains(file.ContentType))
            throw new ArgumentException("Invalid image file type.");

        if (file.Length > 5 * 1024 * 1024)
            throw new ArgumentException("Image must be 5 MB or smaller.");

        OrganizationAsset? existing = null;
        if (!string.IsNullOrEmpty(replaceAssetId))
            existing = GetAsset(replaceAssetId);

        var storedName = $"{Guid.NewGuid():N}{ext}";
        var physicalPath = Path.Combine(UploadDirectory, storedName);
        await using (var stream = new FileStream(physicalPath, FileMode.Create))
            await file.CopyToAsync(stream);

        var publicUrl = $"/uploads/org/{storedName}";

        if (existing != null && existing.Kind == AssetKind.upload)
        {
            DeletePhysicalFile(existing.Url);
            existing.Title = string.IsNullOrWhiteSpace(title) ? file.FileName : title.Trim();
            existing.Category = category;
            existing.Url = publicUrl;
            existing.FileName = file.FileName;
            existing.MimeType = file.ContentType;
            existing.Notes = notes?.Trim();
            existing.UpdatedAt = DateTime.UtcNow;
            _org.Current.UpdatedAt = DateTime.UtcNow;
            Persist();
            return existing;
        }

        var asset = new OrganizationAsset
        {
            Title = string.IsNullOrWhiteSpace(title) ? Path.GetFileNameWithoutExtension(file.FileName) : title.Trim(),
            Kind = AssetKind.upload,
            Category = category,
            Url = publicUrl,
            FileName = file.FileName,
            MimeType = file.ContentType,
            Notes = notes?.Trim(),
        };
        _org.Current.Assets ??= [];
        _org.Current.Assets.Add(asset);
        _org.Current.UpdatedAt = DateTime.UtcNow;
        Persist();
        return asset;
    }

    public void DeleteAsset(string id)
    {
        var org = _org.Current;
        var asset = GetAsset(id);
        if (asset == null) return;

        if (asset.Kind == AssetKind.upload)
            DeletePhysicalFile(asset.Url);

        if (org.LogoAssetId == id)
            org.LogoAssetId = null;

        org.Assets.RemoveAll(a => a.Id == id);
        org.UpdatedAt = DateTime.UtcNow;
        Persist();
    }

    private string UploadDirectory => StayStaticFiles.UploadOrgDirectory(_env);

    private void EnsureUploadDirectory() =>
        Directory.CreateDirectory(UploadDirectory);

    private void DeletePhysicalFile(string publicUrl)
    {
        if (string.IsNullOrWhiteSpace(publicUrl) || !publicUrl.StartsWith("/uploads/org/", StringComparison.OrdinalIgnoreCase))
            return;

        var fileName = Path.GetFileName(publicUrl);
        var path = Path.Combine(UploadDirectory, fileName);
        if (File.Exists(path))
            File.Delete(path);
    }

    private void Persist() => _org.SaveCurrent();
}
