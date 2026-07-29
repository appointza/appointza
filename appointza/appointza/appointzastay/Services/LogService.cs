using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class LogService
{
    private readonly AppDataStore _data;
    private readonly OrganisationResolver _org;

    public LogService(AppDataStore data, OrganisationResolver org)
    {
        _data = data;
        _org = org;
    }

    public IReadOnlyList<LogEntry> GetAll(int? take = null)
    {
        var query = _data.Logs.OrderByDescending(l => l.CreatedAt).AsEnumerable();
        if (take.HasValue) query = query.Take(take.Value);
        return query.ToList();
    }

    public LogEntry Add(
        string action,
        string entityType,
        string? entityId,
        string message,
        string? userId = null,
        string? organisationId = null)
    {
        var orgId = !string.IsNullOrWhiteSpace(organisationId)
            ? organisationId.Trim()
            : _org.OrganisationId;

        // Registration has no resolver tenant yet — use the organisation being created.
        if (string.IsNullOrWhiteSpace(orgId) &&
            string.Equals(entityType, "organisation", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(entityId))
        {
            orgId = entityId!;
        }

        if (string.IsNullOrWhiteSpace(orgId))
            orgId = _data.Organisations.FirstOrDefault()?.Id ?? "";

        var entry = new LogEntry
        {
            OrganisationId = orgId,
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Message = message,
            CreatedAt = DateTime.UtcNow
        };

        // Never fail signup/auth on logging when no organisation is known.
        if (string.IsNullOrWhiteSpace(entry.OrganisationId))
            return entry;

        _data.Logs.Insert(0, entry);
        if (_data.Logs.Count > 500) _data.Logs.RemoveAt(_data.Logs.Count - 1);
        _data.SaveLog(entry);
        return entry;
    }
}
