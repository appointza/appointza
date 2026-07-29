using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class PackageService
{
    private readonly AppDataStore _data;
    private readonly OrganisationResolver _org;
    private readonly LogService _logs;
    private readonly WebsiteProfileSyncService _websiteSync;

    public PackageService(
        AppDataStore data,
        OrganisationResolver org,
        LogService logs,
        WebsiteProfileSyncService websiteSync)
    {
        _data = data;
        _org = org;
        _logs = logs;
        _websiteSync = websiteSync;
        EnsurePackageIds();
    }

    public IReadOnlyList<PropertyPackage> GetAll() =>
        _org.Current.Packages
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Name)
            .ToList();

    public PropertyPackage? GetById(string id) =>
        _org.Current.Packages.FirstOrDefault(p => p.Id == id);

    public PropertyPackage CreateEmpty() => new()
    {
        OrganisationId = _org.OrganisationId,
        Kind = "stay",
        IsActive = true,
        MinimumNights = 1,
        MaxGuests = 2,
        IncludedGuests = 2,
        ExtraGuestCharge = 0,
        SortOrder = _org.Current.Packages.Count,
    };

    public void Save(PropertyPackage package)
    {
        var orgId = _org.OrganisationId;
        if (string.IsNullOrEmpty(orgId))
            throw new InvalidOperationException("No organisation is selected for this session.");

        var org = _data.RequireOrganisation(orgId);

        var isNew = string.IsNullOrEmpty(package.Id) ||
                    org.Packages.All(p => p.Id != package.Id);

        package.OrganisationId = org.Id;
        var now = DateTime.UtcNow;
        package.UpdatedAt = now;

        if (isNew)
        {
            if (string.IsNullOrEmpty(package.Id))
                package.Id = Guid.NewGuid().ToString();
            package.CreatedAt = now;
            org.Packages.Add(package);
        }
        else
        {
            var idx = org.Packages.FindIndex(p => p.Id == package.Id);
            if (idx >= 0)
            {
                package.CreatedAt = org.Packages[idx].CreatedAt;
                org.Packages[idx] = package;
            }
            else
            {
                package.CreatedAt = now;
                org.Packages.Add(package);
            }
        }

        _websiteSync.SyncFromProfile(org);
        _org.Save(org);
        _logs.Add(isNew ? "create" : "update", "package", package.Id, $"{package.Name} {(isNew ? "created" : "updated")}");
    }

    public void Delete(string id)
    {
        var orgId = _org.OrganisationId;
        if (string.IsNullOrEmpty(orgId))
            throw new InvalidOperationException("No organisation is selected for this session.");

        var org = _data.RequireOrganisation(orgId);

        var package = GetById(id);
        org.Packages.RemoveAll(p => p.Id == id);
        _websiteSync.SyncFromProfile(org);
        _org.Save(org);
        if (package != null)
            _logs.Add("delete", "package", id, $"{package.Name} removed");
    }

    private void EnsurePackageIds()
    {
        var org = _org.Current;
        var changed = false;
        foreach (var package in org.Packages)
        {
            if (!string.IsNullOrEmpty(package.Id)) continue;
            package.Id = Guid.NewGuid().ToString();
            package.OrganisationId = org.Id;
            changed = true;
        }
        if (changed)
            _org.Save(org);
    }
}
