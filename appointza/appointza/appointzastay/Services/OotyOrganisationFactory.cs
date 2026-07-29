using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

/// <summary>Seeds structured organisation columns for Ooty Room Stay (mirrors website sections).</summary>
public static class OotyOrganisationFactory
{
    private const string PropertyName = "Ooty Room Stay";
    private const string Phone = "+91 98765 43210";
    private const string WhatsApp = "+919876543210";
    private const string Email = "stay@ootyroomstay.com";
    private const string Address = "Near Botanical Garden Road, Ooty, Tamil Nadu 643001";

    public static void ApplyTo(Organisation org)
    {
        org.OwnerId = SampleUserIds.Owner;
        org.Name = PropertyName;
        org.Slug = "ooty-room-stay";
        org.Tagline = "A peaceful mountain stay in Ooty with comfortable rooms and beautiful views";
        org.Description =
            "Located in a peaceful area of Ooty, our stay offers modern comfort with easy access to major tourist attractions. Enjoy warm hospitality, clean rooms, and the calm of the Nilgiri hills.";
        org.Address = Address;
        org.City = "Ooty";
        org.State = "Tamil Nadu";
        org.Country = "India";
        org.Pincode = "643001";
        org.Latitude = 11.4064m;
        org.Longitude = 76.6932m;
        org.Phone = Phone;
        org.WhatsApp = WhatsApp;
        org.Email = Email;
        org.CheckInTime = "14:00";
        org.CheckOutTime = "11:00";
        org.CancellationPolicy = "Free cancellation up to 24 hours before check-in. 50% charge within 24 hours.";
        org.PaymentPolicy = "UPI, card & Razorpay accepted. Advance or full payment at booking.";

        org.Rules = new PropertyRules
        {
            HouseRules =
            [
                "Valid government ID required at check-in",
                "No smoking inside rooms",
                "Pets not allowed",
                "Quiet hours after 10 PM",
                "Extra bed available on request",
            ],
            PetPolicy = "Pets are not allowed at the property.",
            IdProofRequired = "Aadhaar, Passport, or Driving Licence",
            RefundPolicy = "Refunds processed within 5–7 business days to original payment method.",
        };

        org.Highlights =
        [
            H("🏔", "Mountain View", "Wake up to misty hills and valley views"),
            H("🛏", "Comfortable Rooms", "Clean, cozy rooms with premium bedding"),
            H("📶", "Free Wi-Fi", "Stay connected throughout your visit"),
            H("🚗", "Free Parking", "Secure parking for all guests"),
            H("🍳", "Breakfast", "Fresh breakfast served every morning"),
            H("⭐", "Guest Rated Stay", "Loved by couples, families & solo travellers"),
        ];

        org.Amenities =
        [
            A("🛏", "Premium Beds", "Comfortable mattresses & fresh linen", "Room"),
            A("🚿", "Hot Water", "24/7 hot water in all bathrooms", "Room"),
            A("📺", "Smart TV", "Entertainment in every room", "Room"),
            A("🌐", "Free Wi-Fi", "High-speed internet access", "Room"),
            A("🔥", "Room Heater", "Essential for cool Ooty nights", "Room"),
            A("🧴", "Toiletries", "Complimentary bath essentials", "Room"),
            A("🚗", "Free Parking", "On-site parking for guests", "Property"),
            A("🛎", "Room Service", "In-room dining available", "Property"),
            A("🧹", "Housekeeping", "Daily cleaning service", "Property"),
            A("☕", "Tea / Coffee", "Complimentary tea & coffee maker", "Property"),
            A("🌳", "Garden", "Peaceful garden to relax", "Property"),
            A("🔥", "Bonfire", "Evening bonfire on request", "Property"),
            A("✈", "Airport Pickup", "Coimbatore airport transfers", "Extra"),
            A("🚕", "Cab Booking", "Local sightseeing cabs", "Extra"),
            A("🗺", "Sightseeing", "Curated Ooty tour packages", "Extra"),
            A("🧳", "Luggage Storage", "Early check-in / late checkout storage", "Extra"),
        ];

        org.Images =
        [
            Img("Rooms", "Deluxe Valley View"),
            Img("Rooms", "Family Room Interior"),
            Img("Exterior", "Property Front View"),
            Img("Mountain View", "Morning Mist"),
            Img("Dining", "Breakfast Setup"),
            Img("Garden", "Evening Garden"),
            Img("Activities", "Bonfire Night"),
            Img("Mountain View", "Sunset Viewpoint"),
        ];

        org.NearbyPlaces =
        [
            N("Ooty Lake", "4 km", "10 mins drive"),
            N("Botanical Garden", "3 km", "8 mins drive"),
            N("Rose Garden", "5 km", "12 mins drive"),
            N("Doddabetta Peak", "10 km", "25 mins drive"),
            N("Tea Estate", "8 km", "20 mins drive"),
            N("Toy Train Station", "2 km", "5 mins drive"),
            N("Ooty Bus Stand", "3 km", "8 mins drive"),
            N("Charing Cross Market", "2 km", "5 mins drive"),
        ];

        org.Activities =
        [
            Act("🌿 Nature Walk", "Guided walks through tea gardens & pine forests"),
            Act("🚣 Boating", "Boating at Ooty Lake — tickets arranged at desk"),
            Act("📸 Photography", "Best viewpoints for sunrise & mist photography"),
            Act("🏔 Viewpoint Visit", "Doddabetta peak & Pykara falls trips"),
            Act("☕ Tea Factory Tour", "Visit local tea factory & tasting session"),
            Act("🥾 Trekking", "Short treks for beginners & experienced hikers"),
        ];

        org.Packages =
        [
            Pkg("pkg-honeymoon", "Honeymoon Package", "₹12,999", "Room decoration, breakfast, candlelight setup & late checkout", "Popular", "honeymoon", 0,
                ["Room decoration", "Breakfast", "Candlelight setup", "Late checkout"]),
            Pkg("pkg-family", "Family Package", "₹18,999", "2-night stay, meals for 4, sightseeing cab & extra bed", "Best Value", "family", 1,
                ["2-night stay", "Meals for 4", "Sightseeing cab", "Extra bed"]),
            Pkg("pkg-weekend", "Weekend Offer", "₹2,999/night", "15% off on Fri–Sun bookings · Min 2 nights", "Limited", "weekend", 2,
                ["15% weekend discount", "Min 2 nights"]),
            Pkg("pkg-extended", "Extended Stay", "₹2,200/night", "Discounted rate for stays of 5+ nights", null, "extended", 3,
                ["5+ nights rate", "Flexible checkout"]),
        ];

        org.Offers =
        [
            Off("Weekend Offer", "₹2,999/night", "15% off Fri–Sun · Min 2 nights", "2026-12-31"),
            Off("Extended Stay", "₹2,200/night", "5+ nights discounted rate", null),
        ];

        org.Reviews =
        [
            Rev("Priya Sharma", 5, "Clean rooms, amazing view, peaceful stay. Staff was very helpful!", "Jan 2026"),
            Rev("Raj Kumar", 5, "Perfect location near Botanical Garden. Hot water & Wi-Fi worked great.", "Dec 2025"),
            Rev("Meera Nair", 4, "Lovely breakfast and cozy rooms. Would visit again in monsoon.", "Nov 2025"),
        ];

        org.FoodMenu =
        [
            Food("Breakfast", "🍳 Breakfast", "South Indian & continental breakfast buffet", ["South Indian", "Continental"]),
            Food("Lunch", "🍽 Lunch", "Vegetarian thali & North Indian meals", ["North Indian", "South Indian"]),
            Food("Dinner", "🌙 Dinner", "Homestyle dinner with local Nilgiri specials", ["Local", "South Indian"]),
            Food("In-room", "☕ In-room Dining", "Tea, coffee & snacks to your room", []),
        ];

        org.TravelInfo =
        [
            Route("✈", "Coimbatore Airport", "88 km", "~3 hours by cab", "We arrange pickup"),
            Route("🚂", "Mettupalayam Railway", "52 km", "~1.5 hours", "Toy train to Ooty · Scenic journey"),
            Route("🚌", "Ooty Bus Stand", "3 km", "8 mins drive", "Regular buses from Bangalore & Chennai"),
        ];

        org.Faq =
        [
            Q("Is parking available?", "Yes, free secure parking is available for all guests."),
            Q("Is food available?", "Yes, we serve breakfast, lunch and dinner. In-room dining is also available."),
            Q("Do you provide extra beds?", "Yes, extra beds can be arranged on request for a nominal charge."),
            Q("Is Wi-Fi available?", "Yes, complimentary high-speed Wi-Fi is available in all rooms and common areas."),
            Q("Do you allow pets?", "Sorry, pets are not allowed at the property."),
            Q("What ID is required?", "A valid government photo ID (Aadhaar, Passport, or Driving Licence) is mandatory at check-in."),
        ];

        org.Weather = new PropertyWeatherSettings
        {
            Title = "Weather",
            ShowOnSite = true,
            Configured = true,
        };

        org.ContactInfo = new PropertyContactInfo
        {
            MapEmbedUrl = "",
            DirectionsUrl = "",
            WhatsAppLabel = "Chat on WhatsApp",
            TravelDistances =
            [
                Route("✈", "Coimbatore Airport", "88 km", "~3 hrs drive"),
                Route("🚂", "Mettupalayam Station", "52 km", "~1.5 hrs"),
                Route("🚌", "Ooty Bus Stand", "3 km", "8 mins"),
                Route("🛒", "Main Market", "2 km", "5 mins"),
            ],
        };

        org.Seo = new PropertySeo
        {
            MetaTitle = $"{PropertyName} — Peaceful Mountain Stay in Ooty",
            MetaDescription = org.Tagline,
            Keywords = ["Ooty hotel", "Ooty rooms", "mountain stay", "Ooty booking", "Nilgiri hills"],
            OgImageUrl = "",
        };

        org.Messaging = new OrganisationMessagingSettings
        {
            WhatsAppEnabled = true,
            WhatsAppBusinessNumber = WhatsApp,
            BookingConfirmationTemplate =
                "Hi {guest_name}, your booking {booking_code} at {property_name} is confirmed. Check-in: {check_in}.",
            CheckInReminderTemplate =
                "Reminder: Your check-in at {property_name} is tomorrow. Address: {address}",
            PaymentReceiptTemplate =
                "Payment of {amount} received for booking {booking_code}. Balance: {balance}. — {property_name}",
        };

        org.WebsiteUrl = "https://ootyroomstay.com";
        org.Subdomain = "ootyroomstay";
        org.Website = OotyWebsiteFactory.BuildPage();
    }

    public static Organisation Build()
    {
        var org = new Organisation { Id = DummyIds.Organisation };
        ApplyTo(org);
        return org;
    }

    private static PropertyHighlight H(string icon, string title, string desc) =>
        new() { Icon = icon, Title = title, Description = desc };

    private static PropertyAmenityItem A(string icon, string name, string desc, string group) =>
        new() { Icon = icon, Name = name, Description = desc, Group = group };

    private static PropertyImage Img(string category, string label) =>
        new() { Category = category, Label = label };

    private static PropertyNearbyPlace N(string name, string distance, string time) =>
        new() { Name = name, Distance = distance, TravelTime = time };

    private static PropertyActivity Act(string title, string desc) =>
        new() { Title = title, Description = desc, Icon = title.Split(' ')[0] };

    private static PropertyPackage Pkg(
        string id, string name, string price, string desc, string? badge, string kind, int sort,
        List<string>? includes = null) =>
        new()
        {
            Id = id,
            Name = name,
            Price = price,
            Description = desc,
            Badge = badge,
            Kind = kind,
            SortOrder = sort,
            Includes = includes ?? [],
            IsActive = true,
        };

    private static PropertyOffer Off(string title, string price, string desc, string? until) =>
        new() { Title = title, Price = price, Description = desc, ValidUntil = until };

    private static PropertyReview Rev(string author, int rating, string quote, string date) =>
        new() { Author = author, Rating = rating, Quote = quote, Date = date };

    private static PropertyFoodItem Food(string meal, string title, string desc, List<string> cuisines) =>
        new() { Meal = meal, Title = title, Description = desc, Cuisines = cuisines };

    private static PropertyTravelRoute Route(string icon, string from, string distance, string time, string? notes = null) =>
        new() { Icon = icon, From = from, Distance = distance, TravelTime = time, Notes = notes };

    private static PropertyFaqItem Q(string q, string a) => new() { Question = q, Answer = a };
}
