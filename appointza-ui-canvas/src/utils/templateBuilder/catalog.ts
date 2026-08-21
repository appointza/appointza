import type { TemplateBuilderCategory } from "@/types/templateBuilder.types";

/**
 * Block palette — same idea as Webzys BlockPalette when websiteType = "appointza".
 * Each item maps to a block `type` string used in pages.home.blocks[].
 */
export const TEMPLATE_BUILDER_CATEGORIES: TemplateBuilderCategory[] = [
  {
    name: "Live — Business",
    blocks: [
      { type: "appointza-organization", name: "Business home", description: "Name, logo, about, Book", mode: "appointza" },
      { type: "appointza-services", name: "Services catalog", description: "Services from your org", mode: "appointza" },
      { type: "appointza-events", name: "Events & workshops", description: "Public events list", mode: "appointza" },
      { type: "appointza-facilities", name: "Amenities / facilities", description: "Facility checklist", mode: "appointza" },
      { type: "appointza-timings", name: "Business hours", description: "Opening hours / timings", mode: "appointza" },
      { type: "appointza-location-images", name: "Photo gallery", description: "Location photo grid", mode: "appointza" },
      { type: "appointza-location-videos", name: "Video gallery", description: "Location video embeds", mode: "appointza" },
      {
        type: "appointza-reviews",
        name: "Customer reviews",
        description: "Customer reviews (shows when review data exists)",
        mode: "appointza",
      },
      { type: "appointza-location", name: "Map / Location", description: "Address, phone, map", mode: "appointza" },
    ],
  },
  {
    name: "Live — Hospitality / Stay",
    blocks: [
      { type: "appointza-rooms", name: "Rooms", description: "Bookable rooms for this location", mode: "appointza" },
      { type: "appointza-hospitality-packages", name: "Packages", description: "Stay packages from hospitality profile", mode: "appointza" },
      { type: "appointza-guest-services", name: "Guest services", description: "Extra guest services & add-ons", mode: "appointza" },
      { type: "appointza-food-menu", name: "Food menu", description: "Meals & dining options", mode: "appointza" },
      { type: "appointza-hospitality-policies", name: "Policies", description: "Cancellation & payment policies", mode: "appointza" },
      { type: "appointza-nearby-places", name: "Nearby places", description: "Local attractions around your property", mode: "appointza" },
    ],
  },
  {
    name: "Hero / Banner",
    blocks: [
      { type: "hero", name: "Hero Centered", description: "Centered hero with headline & CTA", mode: "static" },
      { type: "hero-2", name: "Hero Split", description: "Split hero (text + image)", mode: "static" },
      { type: "hero-3", name: "Hero Minimal", description: "Minimal centered hero", mode: "static" },
      { type: "hero-4", name: "Hero Image BG", description: "Hero with full image background", mode: "static" },
      { type: "hero-5", name: "Hero Left Aligned", description: "Left-aligned hero with optional image", mode: "static" },
      { type: "hero-6", name: "Hero Video BG", description: "Hero with video background", mode: "static" },
    ],
  },
  {
    name: "Page layout",
    blocks: [
      { type: "header", name: "Header / Navigation", description: "Top nav menu with links", mode: "static" },
      { type: "section", name: "Content section", description: "Editable title + body section", mode: "static" },
      { type: "footer", name: "Footer", description: "Links & copyright", mode: "static" },
    ],
  },
  {
    name: "Marketing sections",
    blocks: [
      { type: "about", name: "About Us", description: "Story / introduction section", mode: "static" },
      { type: "features", name: "Features / Benefits", description: "Icon grid of benefits", mode: "static" },
      { type: "stats", name: "Statistics / Counters", description: "Number counters", mode: "static" },
      { type: "logos", name: "Client / Brand Logos", description: "Logo row/grid", mode: "static" },
      { type: "timeline", name: "Timeline / Process Flow", description: "Step-by-step process", mode: "static" },
      { type: "pricing", name: "Pricing", description: "Price cards you edit", mode: "static" },
      { type: "membership", name: "Membership / Subscription Plans", description: "Tier cards", mode: "static" },
      { type: "media", name: "Photo & Video Section", description: "Images + video embeds", mode: "static" },
      { type: "gallery", name: "Gallery (static)", description: "Static image grid", mode: "static" },
      { type: "testimonials", name: "Testimonials", description: "Editable quote cards", mode: "static" },
      { type: "faq", name: "FAQ", description: "Accordion Q&A", mode: "static" },
      { type: "team", name: "Team members", description: "Team member cards", mode: "static" },
      { type: "offers", name: "Offers / Promotions", description: "Promo banner", mode: "static" },
      { type: "blog", name: "Blog / News", description: "Article list preview", mode: "static" },
      { type: "announcements", name: "Announcements", description: "Banner + list", mode: "static" },
    ],
  },
  {
    name: "Booking & contact",
    blocks: [
      { type: "cta-booking", name: "Call To Action (CTA)", description: "Book now button", mode: "static" },
      { type: "time-slots", name: "Availability / Time Slots", description: "Explainer + book link", mode: "static" },
      { type: "live-status", name: "Live Status / Availability Indicator", description: "Open / busy / closed badge", mode: "static" },
      { type: "form", name: "Contact form", description: "Message form", mode: "static" },
      { type: "map", name: "Google Map / Location (static)", description: "Map embed by address", mode: "static" },
      { type: "social", name: "Social Media Links", description: "Icon row", mode: "static" },
    ],
  },
  {
    name: "Extra widgets",
    blocks: [
      { type: "search", name: "Search bar", description: "Search input UI", mode: "static" },
      { type: "filters", name: "Filters / Categories", description: "Pills / dropdown filters UI", mode: "static" },
      { type: "support", name: "Support / Help Center", description: "Help links + contact", mode: "static" },
      { type: "privacy", name: "Privacy Policy", description: "Privacy policy snippet", mode: "static" },
      { type: "terms", name: "Terms & Conditions", description: "Terms snippet", mode: "static" },
      { type: "policy", name: "Refund / Cancellation Policy", description: "Cancellation / refund policy", mode: "static" },
      { type: "careers", name: "Careers / Jobs", description: "Open roles list", mode: "static" },
      { type: "auth", name: "Login / Signup", description: "Auth CTA / form UI", mode: "static" },
      { type: "dashboard", name: "Dashboard / User Panel", description: "User panel UI", mode: "static" },
      { type: "loyalty", name: "Loyalty / Rewards", description: "Points + perks UI", mode: "static" },
      { type: "download-app", name: "Download App", description: "App store badges", mode: "static" },
      { type: "newsletter", name: "Newsletter subscription", description: "Email capture form", mode: "static" },
      { type: "payment-info", name: "Online payment", description: "Accepted payment methods", mode: "static" },
      { type: "float-whatsapp", name: "WhatsApp / Chat Button", description: "Floating WhatsApp button", mode: "static" },
      { type: "float-call", name: "Call Button", description: "Floating phone button", mode: "static" },
    ],
  },
];

export const ALL_BLOCK_TYPES = TEMPLATE_BUILDER_CATEGORIES.flatMap((c) => c.blocks);

export function getBlockMeta(type: string) {
  return ALL_BLOCK_TYPES.find((b) => b.type === type);
}
