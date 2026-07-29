namespace appointza.Models.AppointzaStay;

public class BlockPadding
{
    public int Top { get; set; } = 80;
    public int Right { get; set; } = 40;
    public int Bottom { get; set; } = 80;
    public int Left { get; set; } = 40;
}

public class BlockMargin
{
    public int Top { get; set; }
    public int Right { get; set; }
    public int Bottom { get; set; }
    public int Left { get; set; }
}

public class SitePageSettings
{
    public string BackgroundColor { get; set; } = "#faf8f5";
    public string BackgroundImage { get; set; } = "";
    public string TextColor { get; set; } = "#1a1a1a";
}

public class SitePage
{
    public SitePageMeta? Meta { get; set; }
    public List<PageBlock> Blocks { get; set; } = [];
    public SitePageSettings Settings { get; set; } = new();
    /// <summary>Rendering mode: "html" (default crisp template) or "blocks".</summary>
    public string TemplateMode { get; set; } = "html";
    /// <summary>Organisation-owned HTML template. Rendered only inside a sandboxed iframe.</summary>
    public string CustomHtml { get; set; } = "";
    /// <summary>Profile → Site Builder sync metadata.</summary>
    public SitePageProfileSync ProfileSync { get; set; } = new();
}

public class HtmlTemplatePreviewReq
{
    public string Html { get; set; } = "";
}

public class BlockLayout
{
    public int Width { get; set; } = 100;
    public object Height { get; set; } = "auto";
    public BlockPadding Padding { get; set; } = new();
    public BlockMargin Margin { get; set; } = new();
}

public class PageBlock
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Type { get; set; } = "";
    public Dictionary<string, object?> Props { get; set; } = new();
    public BlockLayout Layout { get; set; } = new();
}

public class BlockDefinition
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Icon { get; set; } = "";
}

public static class BlockRegistry
{
    public static readonly BlockDefinition[] All =
    [
        new() { Id = "navigation", Name = "Nav", Category = "structure", Icon = "☰" },
        new() { Id = "hero-centered", Name = "Hero — Centered", Category = "content", Icon = "◎" },
        new() { Id = "hero-split", Name = "Hero — Split", Category = "content", Icon = "◫" },
        new() { Id = "hero-product-showcase", Name = "Hero — Product Showcase", Category = "content", Icon = "▣" },
        new() { Id = "hero-background-image", Name = "Hero — Background Image", Category = "content", Icon = "▤" },
        new() { Id = "hero-video", Name = "Hero — Video", Category = "content", Icon = "▶" },
        new() { Id = "hero-animated-gradient", Name = "Hero — Animated Gradient", Category = "content", Icon = "◐" },
        new() { Id = "hero-minimal", Name = "Hero — Minimal", Category = "content", Icon = "—" },
        new() { Id = "hero-card-grid", Name = "Hero — Card Grid", Category = "content", Icon = "▦" },
        new() { Id = "hero-ai-saas", Name = "Hero — AI SaaS", Category = "content", Icon = "✦" },
        new() { Id = "hero-3d", Name = "Hero — 3D", Category = "content", Icon = "◈" },
        new() { Id = "feature-grid", Name = "Features", Category = "content", Icon = "▦" },
        new() { Id = "services", Name = "Services", Category = "content", Icon = "◈" },
        new() { Id = "stats", Name = "Stats", Category = "content", Icon = "#" },
        new() { Id = "room-grid", Name = "Room Grid", Category = "content", Icon = "🛏" },
        new() { Id = "room-list", Name = "Room List", Category = "content", Icon = "☰" },
        new() { Id = "room-availability", Name = "Availability Board", Category = "content", Icon = "🏨" },
        new() { Id = "hotel-hero-banner", Name = "Hero Banner", Category = "hotel", Icon = "🏨" },
        new() { Id = "hotel-about", Name = "About Hotel", Category = "hotel", Icon = "ℹ" },
        new() { Id = "hotel-room-types", Name = "Room Types", Category = "hotel", Icon = "🛏" },
        new() { Id = "hotel-all-rooms", Name = "All Rooms (Live)", Category = "hotel", Icon = "🛏" },
        new() { Id = "hotel-amenities", Name = "Amenities", Category = "hotel", Icon = "✦" },
        new() { Id = "hotel-gallery", Name = "Gallery", Category = "hotel", Icon = "▦" },
        new() { Id = "hotel-booking", Name = "Availability & Booking", Category = "hotel", Icon = "📅" },
        new() { Id = "hotel-packages", Name = "Packages & Offers", Category = "hotel", Icon = "🎁" },
        new() { Id = "hotel-reviews", Name = "Reviews & Ratings", Category = "hotel", Icon = "★" },
        new() { Id = "hotel-attractions", Name = "Nearby Attractions", Category = "hotel", Icon = "📍" },
        new() { Id = "hotel-contact", Name = "Contact & Location", Category = "hotel", Icon = "✉" },
        new() { Id = "hotel-policies", Name = "Policies", Category = "hotel", Icon = "📋" },
        new() { Id = "hotel-payment", Name = "Razorpay Payment", Category = "hotel", Icon = "₹" },
        new() { Id = "pricing", Name = "Pricing", Category = "conversion", Icon = "$" },
        new() { Id = "testimonials", Name = "Testimonials", Category = "conversion", Icon = "“" },
        new() { Id = "faq", Name = "FAQ", Category = "conversion", Icon = "?" },
        new() { Id = "contact", Name = "Contact", Category = "conversion", Icon = "✉" },
        new() { Id = "call-to-action", Name = "CTA", Category = "conversion", Icon = "→" },
        new() { Id = "footer", Name = "Footer", Category = "footer", Icon = "▬" },
    ];

    public static PageBlock CreateBlock(string type)
    {
        var block = new PageBlock { Type = type };
        switch (type)
        {
            case "navigation":
                block.Props = new Dictionary<string, object?>
                {
                    ["logo"] = AppBranding.Name,
                    ["logoImageUrl"] = AppBranding.LogoUrl,
                    ["links"] = new object[]
                    {
                        new Dictionary<string, object?> { ["label"] = "Rooms", ["href"] = "#rooms" },
                        new Dictionary<string, object?> { ["label"] = "Availability", ["href"] = "#availability" },
                        new Dictionary<string, object?> { ["label"] = "Contact", ["href"] = "#contact" },
                    },
                    ["ctaLabel"] = "Book Now",
                    ["ctaUrl"] = "#book",
                    ["layout"] = "minimal",
                    ["sticky"] = true,
                };
                block.Layout.Padding = new BlockPadding { Top = 0, Right = 24, Bottom = 0, Left = 24 };
                break;
            case "hero-centered":
                block.Props = new Dictionary<string, object?>
                {
                    ["eyebrow"] = "Welcome",
                    ["title"] = "Your stay, beautifully managed.",
                    ["subtitle"] = "Browse our rooms with live availability.",
                    ["primaryLabel"] = "View Rooms",
                    ["secondaryLabel"] = "Check Availability",
                    ["textAlign"] = "center",
                };
                block.Layout.Padding = new BlockPadding { Top = 64, Right = 24, Bottom = 64, Left = 24 };
                break;
            case "room-grid":
            case "room-availability":
                block.Layout.Padding = new BlockPadding { Top = 48, Right = 24, Bottom = 48, Left = 24 };
                break;
            case "footer":
                block.Props = new Dictionary<string, object?>
                {
                    ["logo"] = AppBranding.Name,
                    ["logoImageUrl"] = AppBranding.LogoUrl,
                    ["tagline"] = AppBranding.Tagline,
                    ["copyright"] = $"© {DateTime.UtcNow.Year} {AppBranding.NameUpper}. All rights reserved.",
                };
                block.Layout.Padding = new BlockPadding { Top = 48, Right = 24, Bottom = 48, Left = 24 };
                break;
            default:
                block.Props = new Dictionary<string, object?> { ["title"] = All.FirstOrDefault(b => b.Id == type)?.Name ?? type };
                break;
        }
        return block;
    }

    public static List<PageBlock> CreateInitialPage() =>
    [
        CreateBlock("navigation"),
        CreateBlock("hero-centered"),
        CreateBlock("room-grid"),
        CreateBlock("room-availability"),
        CreateBlock("footer"),
    ];

    public static List<PageBlock> CreateHotelInitialPage()
    {
        var hotelTypes = new[]
        {
            "hotel-hero-banner", "hotel-about", "hotel-room-types", "hotel-amenities",
            "hotel-gallery", "hotel-booking", "hotel-packages", "hotel-reviews",
            "hotel-attractions", "hotel-contact", "hotel-policies", "hotel-payment",
        };

        var blocks = new List<PageBlock> { CreateBlock("navigation") };
        foreach (var type in hotelTypes)
        {
            var block = CreateBlock(type);
            block.Layout.Padding = type == "hotel-hero-banner"
                ? new BlockPadding()
                : new BlockPadding { Top = 64, Right = 24, Bottom = 64, Left = 24 };
            blocks.Add(block);
        }
        blocks.Add(CreateBlock("footer"));
        return blocks;
    }
}
