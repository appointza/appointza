using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

/// <summary>
/// Builds the complete Ooty Room Stay website as Site Builder blocks stored on Organisation.Website.
/// </summary>
public static class OotyWebsiteFactory
{
    private const string PropertyName = "Ooty Room Stay";
    private const string Phone = "+91 98765 43210";
    private const string WhatsApp = "+919876543210";
    private const string Email = "stay@ootyroomstay.com";
    private const string Address = "Near Botanical Garden Road, Ooty, Tamil Nadu 643001";

    public static SitePage BuildPage()
    {
        return new SitePage
        {
            Meta = new SitePageMeta
            {
                Template = "ooty-room-stay",
                PropertyName = PropertyName,
                Location = "Ooty, Tamil Nadu"
            },
            Settings = new SitePageSettings
            {
                BackgroundColor = "#faf8f5",
                TextColor = "#1a1a1a"
            },
            TemplateMode = "html",
            CustomHtml = StayDefaultHtmlTemplate.Html,
            Blocks = [],
            ProfileSync = new SitePageProfileSync { SyncFromOrganisation = true },
        };
    }

    /// <summary>Legacy block-based Ooty layout (site builder "blocks" mode).</summary>
    public static SitePage BuildBlocksPage()
    {
        var pad = new BlockPadding { Top = 64, Right = 24, Bottom = 64, Left = 24 };
        var blocks = new List<PageBlock>
        {
            NavBlock(),
            HeroBlock(),
            WithPad(HighlightsBlock(), pad),
            WithPad(AboutBlock(), pad),
            WithPad(RoomsBlock(), pad),
            WithPad(BookingBlock(), pad),
            WithPad(AmenitiesBlock(), pad),
            WithPad(GalleryBlock(), pad),
            WithPad(NearbyBlock(), pad),
            WithPad(ThingsToDoBlock(), pad),
            WithPad(DiningBlock(), pad),
            WithPad(PackagesBlock(), pad),
            WithPad(ReviewsBlock(), pad),
            WithPad(WeatherBlock(), pad),
            WithPad(TravelGuideBlock(), pad),
            WithPad(PoliciesBlock(), pad),
            WithPad(FaqBlock(), pad),
            WithPad(ContactBlock(), pad),
            WithPad(PaymentBlock(), pad),
            FooterBlock(),
        };

        return new SitePage
        {
            Meta = new SitePageMeta
            {
                Template = "ooty-room-stay",
                PropertyName = PropertyName,
                Location = "Ooty, Tamil Nadu"
            },
            Settings = new SitePageSettings
            {
                BackgroundColor = "#faf8f5",
                TextColor = "#1a1a1a"
            },
            TemplateMode = "blocks",
            Blocks = blocks
        };
    }

    private static PageBlock WithPad(PageBlock block, BlockPadding padding)
    {
        block.Layout.Padding = padding;
        return block;
    }

    private static PageBlock NavBlock() => new()
    {
        Type = WebsiteSectionMap.Navigation,
        Layout = { Padding = new BlockPadding { Top = 0, Right = 24, Bottom = 0, Left = 24 } },
        Props = new Dictionary<string, object?>
        {
            ["logo"] = PropertyName,
            ["logoImageUrl"] = AppBranding.LogoUrl,
            ["links"] = new object[]
            {
                Link("Home", "#home"),
                Link("About", "#about"),
                Link("Rooms", "#rooms"),
                Link("Book", "#booking"),
                Link("Gallery", "#gallery"),
                Link("Contact", "#contact"),
            },
            ["ctaLabel"] = "Book Now",
            ["ctaUrl"] = "#booking",
            ["layout"] = "minimal",
            ["sticky"] = true,
        }
    };

    private static PageBlock HeroBlock() => new()
    {
        Type = WebsiteSectionMap.Hero,
        Props = new Dictionary<string, object?>
        {
            ["hotelName"] = PropertyName,
            ["tagline"] = "A peaceful mountain stay in Ooty with comfortable rooms and beautiful views",
            ["heroImageUrl"] = "",
            ["ctaLabel"] = "Book Now",
            ["showBookingWidget"] = true,
            ["overlayOpacity"] = 0.45,
            ["textColor"] = "#ffffff",
        }
    };

    private static PageBlock HighlightsBlock() => new()
    {
        Type = WebsiteSectionMap.Highlights,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Why Guests Love Us",
            ["columns"] = "3",
            ["features"] = new object[]
            {
                Feature("🏔", "Mountain View", "Wake up to misty hills and valley views"),
                Feature("🛏", "Comfortable Rooms", "Clean, cozy rooms with premium bedding"),
                Feature("📶", "Free Wi-Fi", "Stay connected throughout your visit"),
                Feature("🚗", "Free Parking", "Secure parking for all guests"),
                Feature("🍳", "Breakfast", "Fresh breakfast served every morning"),
                Feature("⭐", "Guest Rated Stay", "Loved by couples, families & solo travellers"),
            }
        }
    };

    private static PageBlock AboutBlock() => new()
    {
        Type = WebsiteSectionMap.About,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "About Our Property",
            ["description"] = "Located in a peaceful area of Ooty, our stay offers modern comfort with easy access to major tourist attractions. Enjoy warm hospitality, clean rooms, and the calm of the Nilgiri hills.",
            ["locationHighlights"] = new[] { "5 min to Botanical Garden", "10 min to Ooty Lake", "Quiet residential area", "Easy cab access" },
            ["amenitiesOverview"] = new[] { "Mountain-facing rooms", "Hot water 24/7", "Daily housekeeping", "Travel desk assistance" },
        }
    };

    private static PageBlock RoomsBlock() => new()
    {
        Type = WebsiteSectionMap.Rooms,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Rooms & Suites",
            ["subtitle"] = "Choose the perfect room for your Ooty getaway",
            ["useLiveRooms"] = true,
            ["ctaLabel"] = "Book This Room",
            ["roomTypes"] = new object[]
            {
                RoomType("Deluxe Valley View Room", "₹3,500", "2 Adults · Queen Bed · 220 sq ft",
                    "Spacious room with valley views, heater, balcony & attached bathroom"),
                RoomType("Standard Double Room", "₹2,500", "2 Adults · Double Bed · 180 sq ft",
                    "Comfortable double room ideal for couples"),
                RoomType("Family Room", "₹4,500", "4 Guests · King + Single · 320 sq ft",
                    "Perfect for families with extra space and sofa seating"),
                RoomType("Premium Suite", "₹8,000", "2 Adults · King Bed · 450 sq ft",
                    "Luxury suite with living area, bathtub & panoramic views"),
            }
        }
    };

    private static PageBlock BookingBlock() => new()
    {
        Type = WebsiteSectionMap.Booking,
        Props = new Dictionary<string, object?>
        {
            ["useLiveRooms"] = true,
            ["ctaLabel"] = "Check Availability & Pay",
        }
    };

    private static PageBlock AmenitiesBlock() => new()
    {
        Type = WebsiteSectionMap.Amenities,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Amenities & Facilities",
            ["amenities"] = new object[]
            {
                Amenity("🛏", "Premium Beds", "Comfortable mattresses & fresh linen"),
                Amenity("🚿", "Hot Water", "24/7 hot water in all bathrooms"),
                Amenity("📺", "Smart TV", "Entertainment in every room"),
                Amenity("🌐", "Free Wi-Fi", "High-speed internet access"),
                Amenity("🔥", "Room Heater", "Essential for cool Ooty nights"),
                Amenity("🧴", "Toiletries", "Complimentary bath essentials"),
                Amenity("🚗", "Free Parking", "On-site parking for guests"),
                Amenity("🛎", "Room Service", "In-room dining available"),
                Amenity("🧹", "Housekeeping", "Daily cleaning service"),
                Amenity("☕", "Tea / Coffee", "Complimentary tea & coffee maker"),
                Amenity("🌳", "Garden", "Peaceful garden to relax"),
                Amenity("🔥", "Bonfire", "Evening bonfire on request"),
                Amenity("✈", "Airport Pickup", "Coimbatore airport transfers"),
                Amenity("🚕", "Cab Booking", "Local sightseeing cabs"),
                Amenity("🗺", "Sightseeing", "Curated Ooty tour packages"),
                Amenity("🧳", "Luggage Storage", "Early check-in / late checkout storage"),
            }
        }
    };

    private static PageBlock GalleryBlock() => new()
    {
        Type = WebsiteSectionMap.Gallery,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Gallery",
            ["columns"] = "3",
            ["galleryItems"] = new object[]
            {
                Gallery("Rooms", "Deluxe Valley View"),
                Gallery("Rooms", "Family Room Interior"),
                Gallery("Exterior", "Property Front View"),
                Gallery("Mountain View", "Morning Mist"),
                Gallery("Dining", "Breakfast Setup"),
                Gallery("Garden", "Evening Garden"),
                Gallery("Activities", "Bonfire Night"),
                Gallery("Mountain View", "Sunset Viewpoint"),
            }
        }
    };

    private static PageBlock NearbyBlock() => new()
    {
        Type = WebsiteSectionMap.Nearby,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Nearby Places & How to Reach",
            ["airportDistance"] = "Coimbatore Airport · 88 km · ~3 hrs drive",
            ["railwayDistance"] = "Mettupalayam Station · 52 km · ~1.5 hrs · Toy train available",
            ["attractions"] = new object[]
            {
                Attraction("Ooty Lake", "4 km · 10 mins drive"),
                Attraction("Botanical Garden", "3 km · 8 mins drive"),
                Attraction("Rose Garden", "5 km · 12 mins drive"),
                Attraction("Doddabetta Peak", "10 km · 25 mins drive"),
                Attraction("Tea Estate", "8 km · 20 mins drive"),
                Attraction("Toy Train Station", "2 km · 5 mins drive"),
                Attraction("Ooty Bus Stand", "3 km · 8 mins drive"),
                Attraction("Charing Cross Market", "2 km · 5 mins drive"),
            }
        }
    };

    private static PageBlock ThingsToDoBlock() => new()
    {
        Type = WebsiteSectionMap.ThingsToDo,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Things To Do in Ooty",
            ["subtitle"] = "Activities & experiences we recommend",
            ["services"] = new object[]
            {
                Service("🌿 Nature Walk", "Guided walks through tea gardens & pine forests"),
                Service("🚣 Boating", "Boating at Ooty Lake — tickets arranged at desk"),
                Service("📸 Photography", "Best viewpoints for sunrise & mist photography"),
                Service("🏔 Viewpoint Visit", "Doddabetta peak & Pykara falls trips"),
                Service("☕ Tea Factory Tour", "Visit local tea factory & tasting session"),
                Service("🥾 Trekking", "Short treks for beginners & experienced hikers"),
            }
        }
    };

    private static PageBlock DiningBlock() => new()
    {
        Type = "services",
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Food & Dining",
            ["subtitle"] = "Fresh meals with local & Indian flavours",
            ["services"] = new object[]
            {
                Service("🍳 Breakfast", "South Indian & continental breakfast buffet"),
                Service("🍽 Lunch", "Vegetarian thali & North Indian meals"),
                Service("🌙 Dinner", "Homestyle dinner with local Nilgiri specials"),
                Service("☕ In-room Dining", "Tea, coffee & snacks to your room"),
            }
        }
    };

    private static PageBlock PackagesBlock() => new()
    {
        Type = WebsiteSectionMap.Packages,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Packages & Offers",
            ["subtitle"] = "Special stays for every occasion",
            ["packages"] = new object[]
            {
                Package("Honeymoon Package", "₹12,999", "Room decoration, breakfast, candlelight setup & late checkout", "Popular"),
                Package("Family Package", "₹18,999", "2-night stay, meals for 4, sightseeing cab & extra bed", "Best Value"),
                Package("Weekend Offer", "₹2,999/night", "15% off on Fri–Sun bookings · Min 2 nights", "Limited"),
                Package("Extended Stay", "₹2,200/night", "Discounted rate for stays of 5+ nights", null),
            }
        }
    };

    private static PageBlock ReviewsBlock() => new()
    {
        Type = WebsiteSectionMap.Reviews,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Guest Reviews",
            ["averageRating"] = 4.8,
            ["totalReviews"] = 126,
            ["reviews"] = new object[]
            {
                Review("Priya Sharma", 5, "Clean rooms, amazing view, peaceful stay. Staff was very helpful!", "Jan 2026"),
                Review("Raj Kumar", 5, "Perfect location near Botanical Garden. Hot water & Wi-Fi worked great.", "Dec 2025"),
                Review("Meera Nair", 4, "Lovely breakfast and cozy rooms. Would visit again in monsoon.", "Nov 2025"),
            }
        }
    };

    private static PageBlock WeatherBlock() => new()
    {
        Type = WebsiteSectionMap.Weather,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Ooty Weather",
            ["backgroundColor"] = "#1e3a5f",
            ["textColor"] = "#ffffff",
            ["stats"] = new object[]
            {
                Stat("18°C", "Current Temperature"),
                Stat("Partly Cloudy", "Today's Condition"),
                Stat("Light Rain", "Tomorrow Forecast"),
                Stat("12°C – 20°C", "This Week Range"),
            }
        }
    };

    private static PageBlock TravelGuideBlock() => new()
    {
        Type = WebsiteSectionMap.Highlights,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Travel Guide — How To Reach",
            ["columns"] = "3",
            ["features"] = new object[]
            {
                Feature("✈", "Coimbatore Airport", "88 km · ~3 hours by cab · We arrange pickup"),
                Feature("🚂", "Mettupalayam Railway", "52 km · Toy train to Ooty · Scenic journey"),
                Feature("🚌", "Ooty Bus Stand", "3 km from property · Regular buses from Bangalore & Chennai"),
            }
        }
    };

    private static PageBlock PoliciesBlock() => new()
    {
        Type = WebsiteSectionMap.Policies,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Rules & Policies",
            ["checkIn"] = "2:00 PM",
            ["checkOut"] = "11:00 AM",
            ["cancellation"] = "Free cancellation up to 24 hours before check-in. 50% charge within 24 hours.",
            ["refund"] = "Refunds processed within 5–7 business days to original payment method.",
            ["houseRules"] = new[]
            {
                "Valid government ID required at check-in",
                "No smoking inside rooms",
                "Pets not allowed",
                "Quiet hours after 10 PM",
                "Payment: UPI, card & Razorpay accepted",
                "Extra bed available on request",
            }
        }
    };

    private static PageBlock FaqBlock() => new()
    {
        Type = WebsiteSectionMap.Faq,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Frequently Asked Questions",
            ["style"] = "accordion",
            ["items"] = new object[]
            {
                Faq("Is parking available?", "Yes, free secure parking is available for all guests."),
                Faq("Is food available?", "Yes, we serve breakfast, lunch and dinner. In-room dining is also available."),
                Faq("Do you provide extra beds?", "Yes, extra beds can be arranged on request for a nominal charge."),
                Faq("Is Wi-Fi available?", "Yes, complimentary high-speed Wi-Fi is available in all rooms and common areas."),
                Faq("Do you allow pets?", "Sorry, pets are not allowed at the property."),
                Faq("What ID is required?", "A valid government photo ID (Aadhaar, Passport, or Driving Licence) is mandatory at check-in."),
            }
        }
    };

    private static PageBlock ContactBlock() => new()
    {
        Type = WebsiteSectionMap.Contact,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Contact Us",
            ["address"] = Address,
            ["phone"] = Phone,
            ["email"] = Email,
            ["whatsapp"] = WhatsApp,
            ["whatsappLabel"] = "Chat on WhatsApp",
            ["mapEmbedUrl"] = "",
        }
    };

    private static PageBlock PaymentBlock() => new()
    {
        Type = WebsiteSectionMap.Payment,
        Props = new Dictionary<string, object?>
        {
            ["title"] = "Secure Online Payment",
            ["subtitle"] = "Pay advance or full amount via Razorpay",
            ["enableAdvance"] = true,
            ["enableFull"] = true,
            ["razorpayKey"] = "rzp_test_••••••",
            ["confirmationMessage"] = "Booking confirmation sent to your email & WhatsApp instantly.",
        }
    };

    private static PageBlock FooterBlock() => new()
    {
        Type = WebsiteSectionMap.Footer,
        Layout = { Padding = new BlockPadding { Top = 48, Right = 24, Bottom = 48, Left = 24 } },
        Props = new Dictionary<string, object?>
        {
            ["logo"] = PropertyName,
            ["logoImageUrl"] = AppBranding.LogoUrl,
            ["tagline"] = "A peaceful mountain stay in Ooty",
            ["copyright"] = $"© {DateTime.UtcNow.Year} {PropertyName}. All rights reserved.",
        }
    };

    private static Dictionary<string, object?> Link(string label, string href) =>
        new() { ["label"] = label, ["href"] = href };

    private static Dictionary<string, object?> Feature(string icon, string title, string description) =>
        new() { ["icon"] = icon, ["title"] = title, ["description"] = description };

    private static Dictionary<string, object?> RoomType(string name, string price, string capacity, string description) =>
        new() { ["name"] = name, ["price"] = price, ["capacity"] = capacity, ["description"] = description, ["available"] = true };

    private static Dictionary<string, object?> Amenity(string icon, string name, string description) =>
        new() { ["icon"] = icon, ["name"] = name, ["description"] = description };

    private static Dictionary<string, object?> Gallery(string category, string label) =>
        new() { ["category"] = category, ["label"] = label };

    private static Dictionary<string, object?> Attraction(string name, string distance) =>
        new() { ["name"] = name, ["distance"] = distance };

    private static Dictionary<string, object?> Service(string title, string description) =>
        new() { ["title"] = title, ["description"] = description };

    private static Dictionary<string, object?> Package(string name, string price, string description, string? badge) =>
        new() { ["name"] = name, ["price"] = price, ["description"] = description, ["badge"] = badge };

    private static Dictionary<string, object?> Review(string author, int rating, string quote, string date) =>
        new() { ["author"] = author, ["rating"] = rating, ["quote"] = quote, ["date"] = date };

    private static Dictionary<string, object?> Stat(string value, string label) =>
        new() { ["value"] = value, ["label"] = label };

    private static Dictionary<string, object?> Faq(string question, string answer) =>
        new() { ["question"] = question, ["answer"] = answer };
}
