using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class RoomService
{
    private readonly AppDataStore _data;
    private readonly OrganisationResolver _orgResolver;
    private readonly BookingDetailService _bookings;
    private readonly LogService _logs;

    public RoomService(AppDataStore data, OrganisationResolver orgResolver, BookingDetailService bookings, LogService logs)
    {
        _data = data;
        _orgResolver = orgResolver;
        _bookings = bookings;
        _logs = logs;
        EnsureDailySync();
    }

    private void EnsureDailySync()
    {
        Hydrate();
        if (RoomDaySync.ApplyDailyUpdates(_data.Rooms))
            Persist();
    }

    private void Hydrate() =>
        RoomHydrator.Apply(_data.Rooms, _data.Customers, _data.BookingDetails);

    public IReadOnlyList<Room> GetAll()
    {
        EnsureDailySync();
        return _data.Rooms
            .Where(r => r.OrganisationId == _orgResolver.OrganisationId)
            .OrderBy(r => r.FloorNumber)
            .ThenBy(r => r.RoomNumber)
            .ToList();
    }

    public Room? GetById(string id)
    {
        EnsureDailySync();
        var orgId = _orgResolver.OrganisationId;
        if (string.IsNullOrEmpty(orgId))
            return null;

        var room = _data.Rooms.FirstOrDefault(r => r.Id == id && r.OrganisationId == orgId);
        if (room != null)
            RoomHydrator.EnsureDefaults(room);
        return room;
    }

    public void Save(Room room)
    {
        room.UpdatedAt = DateTime.UtcNow;
        room.OrganisationId = _orgResolver.OrganisationId;

        var idx = _data.Rooms.FindIndex(r => r.Id == room.Id);
        var isNew = idx < 0;
        RoomHydrator.StripForPersist(room);
        if (idx >= 0) _data.Rooms[idx] = room;
        else
        {
            room.CreatedAt = DateTime.UtcNow;
            _data.Rooms.Add(room);
        }
        Persist();
        _logs.Add(isNew ? "create" : "update", "room", room.Id, $"Room {room.RoomNumber} {(isNew ? "created" : "updated")}");
    }

    public void Delete(string id)
    {
        var room = GetById(id);
        if (room == null) return;
        _data.Rooms.RemoveAll(r => r.Id == id && r.OrganisationId == _orgResolver.OrganisationId);
        Persist();
        _logs.Add("delete", "room", id, $"Room {room.RoomNumber} deleted");
    }

    public void UpdateStatus(string id, RoomStatus status)
    {
        var room = GetById(id);
        if (room == null) return;
        room.Status = status;
        if (!RoomCatalog.NeedsCleaningAssignment(status))
            room.CleaningAssignment = null;
        RoomHydrator.StripForPersist(room);
        var idx = _data.Rooms.FindIndex(r => r.Id == id);
        if (idx >= 0) _data.Rooms[idx] = room;
        Persist();
        _logs.Add("status_change", "room", id, $"Room {room.RoomNumber} → {status}");
    }

    public void Checkout(string id)
    {
        var room = GetById(id);
        if (room == null) return;
        room.Status = RoomStatus.checkout_pending;
        RoomHydrator.StripForPersist(room);
        var idx = _data.Rooms.FindIndex(r => r.Id == id);
        if (idx >= 0) _data.Rooms[idx] = room;
        Persist();
        _logs.Add("checkout", "room", id, $"Room {room.RoomNumber} checkout initiated");
    }

    public void MarkClean(string id)
    {
        var room = GetById(id);
        if (room == null) return;
        _bookings.CompleteForRoom(id);
        room.Status = RoomStatus.available;
        room.CleaningAssignment = null;
        RoomHydrator.StripForPersist(room);
        var idx = _data.Rooms.FindIndex(r => r.Id == id);
        if (idx >= 0) _data.Rooms[idx] = room;
        Persist();
        _logs.Add("clean", "room", id, $"Room {room.RoomNumber} marked available");
    }

    public void AssignCleaning(string id, string userId, string userName, bool moveToCleaning)
    {
        var room = GetById(id);
        if (room == null) return;
        room.CleaningAssignment = new CleaningAssignment
        {
            UserId = userId,
            UserName = userName,
            AssignedAt = DateTime.UtcNow
        };
        if (moveToCleaning) room.Status = RoomStatus.cleaning;
        RoomHydrator.StripForPersist(room);
        var idx = _data.Rooms.FindIndex(r => r.Id == id);
        if (idx >= 0) _data.Rooms[idx] = room;
        Persist();
        _logs.Add("assign", "room", id, $"{userName} assigned to room {room.RoomNumber}");
    }

    public void ClearCleaningAssignment(string id)
    {
        var room = GetById(id);
        if (room == null) return;
        room.CleaningAssignment = null;
        RoomHydrator.StripForPersist(room);
        var idx = _data.Rooms.FindIndex(r => r.Id == id);
        if (idx >= 0) _data.Rooms[idx] = room;
        Persist();
    }

    public void ExtendStay(string id, int extraNights)
    {
        var room = GetById(id);
        if (room?.Pricing == null) return;
        var extraCost = extraNights * room.Pricing.PricePerNight;
        _bookings.ExtendStay(id, extraNights, extraCost);
        _logs.Add("extend", "room", id, $"Stay extended +{extraNights} night(s) on room {room.RoomNumber}");
    }

    public void AddCharges(string id, decimal amount)
    {
        var room = GetById(id);
        if (room == null) return;
        _bookings.UpdatePayment(id, amount, 0);
        _logs.Add("charge", "room", id, $"₹{amount:N0} added to room {room.RoomNumber}");
    }

    public (Dictionary<RoomStatus, int> Counts, List<IGrouping<int, Room>> Floors, DateOnly AsOf) GetStatusBoard(DateOnly? asOf = null)
    {
        EnsureDailySync();
        var viewDate = asOf ?? RoomDaySync.Today;
        var orgId = _orgResolver.OrganisationId;
        var orgBookings = _data.BookingDetails
            .Where(b => string.Equals(b.OrganisationId, orgId, StringComparison.OrdinalIgnoreCase))
            .ToList();

        var projected = GetAll()
            .Select(room => RoomAvailabilityProjector.ProjectForDate(room, viewDate, orgBookings, _data.Customers))
            .ToList();

        var counts = Enum.GetValues<RoomStatus>().ToDictionary(s => s, _ => 0);
        foreach (var room in projected)
            counts[room.Status]++;

        var floors = projected
            .OrderBy(r => r.FloorNumber)
            .ThenBy(r => r.RoomNumber)
            .GroupBy(r => r.FloorNumber)
            .ToList();

        return (counts, floors, viewDate);
    }

    private void Persist()
    {
        foreach (var room in _data.Rooms)
            RoomHydrator.StripForPersist(room);
        _data.SaveRooms();
        Hydrate();
    }
}
