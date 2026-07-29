using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

/// <summary>Allowlisted data for anonymous website and booking responses.</summary>
public static class PublicWebsiteProjection
{
    public static object Organisation(Organisation org) => new
    {
        org.Id,
        org.Name,
        org.Slug,
        propertyType = org.PropertyType.ToString(),
        bookingType = org.BookingType.ToString(),
        org.MinimumHours,
        org.Tagline,
        org.Description,
        org.Address,
        org.City,
        org.State,
        org.Country,
        org.Pincode,
        org.Latitude,
        org.Longitude,
        org.Phone,
        org.WhatsApp,
        org.Email,
        org.CheckInTime,
        org.CheckOutTime,
        org.OvernightTimeMode,
        org.CancellationPolicy,
        org.PaymentPolicy,
        org.Rules,
        org.Highlights,
        org.Amenities,
        org.Images,
        org.NearbyPlaces,
        org.Activities,
        Packages = org.Packages.Where(package => package.IsActive).OrderBy(package => package.SortOrder),
        GuestServices = org.GuestServices.Where(service => service.IsActive).OrderBy(service => service.SortOrder),
        org.Offers,
        org.Reviews,
        org.FoodMenu,
        org.TravelInfo,
        org.Faq,
        Slots = org.Slots.Where(slot => slot.IsActive).OrderBy(slot => slot.SortOrder).ThenBy(slot => slot.Name),
        Closures = org.Closures.OrderBy(c => c.FromDate).ThenBy(c => c.ToDate),
        org.Weather,
        org.ContactInfo,
        org.Seo,
        org.WebsiteUrl,
        org.Subdomain,
        payment = new
        {
            onlineEnabled = org.PaymentGateway.IsOnlineReady && org.PaymentGateway.CollectAtBooking,
            isActive = org.PaymentGateway.IsActive,
            collectAtBooking = org.PaymentGateway.CollectAtBooking,
            isConfigured = org.PaymentGateway.IsConfigured,
            gateway = org.PaymentGateway.GatewayName,
            environment = org.PaymentGateway.Environment,
        },
    };

    public static object Room(Room room) => new
    {
        room.Id,
        room.RoomNumber,
        room.RoomName,
        room.RoomType,
        room.FloorNumber,
        room.BuildingWing,
        room.Capacity,
        room.Pricing,
        room.Amenities,
        room.MainPhoto,
        room.GalleryPhotos,
        room.RoomVideo,
        room.Status,
        room.BookingRules,
    };

    public static IReadOnlyList<object> Rooms(IEnumerable<Room> rooms) =>
        rooms.Select(Room).ToList();
}
