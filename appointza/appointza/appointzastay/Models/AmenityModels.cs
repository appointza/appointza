namespace appointza.Models.AppointzaStay;

public enum AmenityCategoryId
{
    room, bathroom, technology, comfort, food_beverage, safety, property, extra_services
}

public class Amenity
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";
    public AmenityCategoryId Category { get; set; }
    public bool Active { get; set; } = true;
}

public class AmenityCategory
{
    public AmenityCategoryId Id { get; set; }
    public string Label { get; set; } = "";
    public int Order { get; set; }
}

public static class AmenityCatalog
{
    public static readonly AmenityCategory[] Categories =
    [
        new() { Id = AmenityCategoryId.room, Label = "Room Amenities", Order = 1 },
        new() { Id = AmenityCategoryId.bathroom, Label = "Bathroom Amenities", Order = 2 },
        new() { Id = AmenityCategoryId.technology, Label = "Technology", Order = 3 },
        new() { Id = AmenityCategoryId.comfort, Label = "Comfort", Order = 4 },
        new() { Id = AmenityCategoryId.food_beverage, Label = "Food & Beverage", Order = 5 },
        new() { Id = AmenityCategoryId.safety, Label = "Safety", Order = 6 },
        new() { Id = AmenityCategoryId.property, Label = "Property Facilities", Order = 7 },
        new() { Id = AmenityCategoryId.extra_services, Label = "Extra Services", Order = 8 },
    ];

    public static readonly Amenity[] Items =
    [
        new() { Id = "bed-king", Name = "King Bed", Icon = "🛏", Category = AmenityCategoryId.room },
        new() { Id = "bed-queen", Name = "Queen Bed", Icon = "🛏", Category = AmenityCategoryId.room },
        new() { Id = "bed-single", Name = "Single Bed", Icon = "🛏", Category = AmenityCategoryId.room },
        new() { Id = "wardrobe", Name = "Wardrobe", Icon = "🚪", Category = AmenityCategoryId.room },
        new() { Id = "sofa", Name = "Sofa", Icon = "🛋", Category = AmenityCategoryId.room },
        new() { Id = "mirror", Name = "Mirror", Icon = "🪞", Category = AmenityCategoryId.room },
        new() { Id = "curtains", Name = "Curtains", Icon = "🪟", Category = AmenityCategoryId.room },
        new() { Id = "balcony", Name = "Balcony", Icon = "🌅", Category = AmenityCategoryId.room },
        new() { Id = "safe-locker", Name = "Safe Locker", Icon = "🔐", Category = AmenityCategoryId.room },
        new() { Id = "attached-bathroom", Name = "Attached Bathroom", Icon = "🚿", Category = AmenityCategoryId.bathroom },
        new() { Id = "hot-water", Name = "Hot Water", Icon = "♨", Category = AmenityCategoryId.bathroom },
        new() { Id = "shower", Name = "Shower", Icon = "🚿", Category = AmenityCategoryId.bathroom },
        new() { Id = "bathtub", Name = "Bathtub", Icon = "🛁", Category = AmenityCategoryId.bathroom },
        new() { Id = "towels", Name = "Towels", Icon = "🧺", Category = AmenityCategoryId.bathroom },
        new() { Id = "hair-dryer", Name = "Hair Dryer", Icon = "💨", Category = AmenityCategoryId.bathroom },
        new() { Id = "wifi", Name = "Wi-Fi", Icon = "📶", Category = AmenityCategoryId.technology },
        new() { Id = "smart-tv", Name = "Smart TV", Icon = "📺", Category = AmenityCategoryId.technology },
        new() { Id = "work-desk", Name = "Work Desk", Icon = "💻", Category = AmenityCategoryId.technology },
        new() { Id = "bluetooth-speaker", Name = "Bluetooth Speaker", Icon = "🔊", Category = AmenityCategoryId.technology },
        new() { Id = "air-conditioning", Name = "Air Conditioning", Icon = "❄", Category = AmenityCategoryId.comfort },
        new() { Id = "fan", Name = "Fan", Icon = "🌀", Category = AmenityCategoryId.comfort },
        new() { Id = "room-service", Name = "Room Service", Icon = "🍽", Category = AmenityCategoryId.food_beverage },
        new() { Id = "breakfast-included", Name = "Breakfast Included", Icon = "🥐", Category = AmenityCategoryId.food_beverage },
        new() { Id = "mini-fridge", Name = "Mini Fridge", Icon = "🧊", Category = AmenityCategoryId.food_beverage },
        new() { Id = "tea-coffee-maker", Name = "Tea/Coffee Maker", Icon = "☕", Category = AmenityCategoryId.food_beverage },
        new() { Id = "mini-bar", Name = "Mini Bar", Icon = "🍷", Category = AmenityCategoryId.food_beverage },
        new() { Id = "telephone", Name = "Telephone", Icon = "📞", Category = AmenityCategoryId.technology },
        new() { Id = "toiletries", Name = "Toiletries", Icon = "🧴", Category = AmenityCategoryId.bathroom },
        new() { Id = "cctv", Name = "CCTV", Icon = "📹", Category = AmenityCategoryId.safety },
        new() { Id = "fire-alarm", Name = "Fire Alarm", Icon = "🚨", Category = AmenityCategoryId.safety },
        new() { Id = "parking", Name = "Parking", Icon = "🅿", Category = AmenityCategoryId.property },
        new() { Id = "swimming-pool", Name = "Swimming Pool", Icon = "🏊", Category = AmenityCategoryId.property },
        new() { Id = "housekeeping", Name = "Housekeeping", Icon = "🧹", Category = AmenityCategoryId.extra_services },
    ];

    public static Amenity? GetById(string id) => Items.FirstOrDefault(a => a.Id == id);

    public static IEnumerable<Amenity> Resolve(IEnumerable<string> ids) =>
        ids.Select(GetById).Where(a => a != null).Cast<Amenity>();

    public static IEnumerable<Amenity> ByCategory(AmenityCategoryId cat) =>
        Items.Where(a => a.Category == cat && a.Active);
}
