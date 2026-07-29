import type { TemplateBuilderCategory } from "@/types/templateBuilder.types";

/**
 * Block palette — same idea as Webzys BlockPalette when websiteType = "appointza".
 * Each item maps to a block `type` string used in pages.home.blocks[].
 */
export const TEMPLATE_BUILDER_CATEGORIES: TemplateBuilderCategory[] = [
  {
    name: "Your business data",
    blocks: [
      { type: "appointza-organization", name: "Home / Organization", description: "Name, tagline, logo, Book button", mode: "appointza" },
      { type: "appointza-location", name: "Google Map / Location", description: "Address + map + contact", mode: "appointza" },
      { type: "appointza-services", name: "Services / Products", description: "Service catalog from your org", mode: "appointza" },
      { type: "appointza-timings", name: "Availability / Time Slots", description: "Working hours / timings", mode: "appointza" },
      { type: "appointza-events", name: "Event / Schedule Section", description: "Public events list", mode: "appointza" },
      { type: "appointza-reviews", name: "Testimonials / Reviews", description: "Ratings & comments", mode: "appointza" },
      { type: "appointza-facilities", name: "Amenities", description: "Facility checklist", mode: "appointza" },
      { type: "appointza-location-images", name: "Gallery / Portfolio", description: "Location photo grid", mode: "appointza" },
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
    name: "Header / Navigation Menu",
    blocks: [{ type: "header", name: "Header / Navigation", description: "Top nav menu with links", mode: "static" }],
  },
  {
    name: "About Us",
    blocks: [{ type: "about", name: "About Us", description: "Story / introduction section", mode: "static" }],
  },
  {
    name: "Pricing",
    blocks: [
      { type: "pricing", name: "Pricing", description: "Price cards you edit", mode: "static" },
      { type: "membership", name: "Membership / Subscription Plans", description: "Tier cards", mode: "static" },
    ],
  },
  {
    name: "Features / Benefits",
    blocks: [
      { type: "features", name: "Features / Benefits", description: "Icon grid of benefits", mode: "static" },
      { type: "stats", name: "Statistics / Counters", description: "Number counters", mode: "static" },
      { type: "logos", name: "Client / Brand Logos", description: "Logo row/grid", mode: "static" },
      { type: "timeline", name: "Timeline / Process Flow", description: "Step-by-step process", mode: "static" },
    ],
  },
  {
    name: "Gallery / Portfolio",
    blocks: [
      { type: "media", name: "Photo & Video Section", description: "Images + video embeds", mode: "static" },
      { type: "gallery", name: "Gallery (static)", description: "Static image grid", mode: "static" },
    ],
  },
  {
    name: "Testimonials / Reviews",
    blocks: [{ type: "testimonials", name: "Testimonials", description: "Quote cards", mode: "static" }],
  },
  {
    name: "Booking / Appointment",
    blocks: [
      { type: "cta-booking", name: "Call To Action (CTA)", description: "Book now button", mode: "static" },
      { type: "time-slots", name: "Availability / Time Slots", description: "Explainer + book link", mode: "static" },
      { type: "live-status", name: "Live Status / Availability Indicator", description: "Open / busy / closed badge", mode: "static" },
    ],
  },
  {
    name: "Contact Information",
    blocks: [
      { type: "form", name: "Contact form", description: "Message form", mode: "static" },
      { type: "map", name: "Google Map / Location (static)", description: "Map embed by address", mode: "static" },
      { type: "social", name: "Social Media Links", description: "Icon row", mode: "static" },
    ],
  },
  {
    name: "FAQ",
    blocks: [{ type: "faq", name: "FAQ", description: "Accordion Q&A", mode: "static" }],
  },
  {
    name: "Team Members",
    blocks: [{ type: "team", name: "Team members", description: "Team member cards", mode: "static" }],
  },
  {
    name: "Offers / Promotions",
    blocks: [{ type: "offers", name: "Offers / Promotions", description: "Promo banner", mode: "static" }],
  },
  {
    name: "Blog / News",
    blocks: [{ type: "blog", name: "Blog / News", description: "Article list preview", mode: "static" }],
  },
  {
    name: "Notifications / Announcements",
    blocks: [{ type: "announcements", name: "Announcements", description: "Banner + list", mode: "static" }],
  },
  {
    name: "Search / Filters",
    blocks: [
      { type: "search", name: "Search bar", description: "Search input UI", mode: "static" },
      { type: "filters", name: "Filters / Categories", description: "Pills / dropdown filters UI", mode: "static" },
    ],
  },
  {
    name: "Support / Help Center",
    blocks: [{ type: "support", name: "Support / Help Center", description: "Help links + contact", mode: "static" }],
  },
  {
    name: "Policies",
    blocks: [
      { type: "privacy", name: "Privacy Policy", description: "Privacy policy snippet", mode: "static" },
      { type: "terms", name: "Terms & Conditions", description: "Terms snippet", mode: "static" },
      { type: "policy", name: "Refund / Cancellation Policy", description: "Cancellation / refund policy", mode: "static" },
    ],
  },
  {
    name: "Careers / Jobs",
    blocks: [{ type: "careers", name: "Careers / Jobs", description: "Open roles list", mode: "static" }],
  },
  {
    name: "Login / Signup",
    blocks: [{ type: "auth", name: "Login / Signup", description: "Auth CTA / form UI", mode: "static" }],
  },
  {
    name: "Dashboard / User Panel",
    blocks: [{ type: "dashboard", name: "Dashboard / User Panel", description: "User panel UI", mode: "static" }],
  },
  {
    name: "Loyalty / Rewards",
    blocks: [{ type: "loyalty", name: "Loyalty / Rewards", description: "Points + perks UI", mode: "static" }],
  },
  {
    name: "Download App Section",
    blocks: [{ type: "download-app", name: "Download App", description: "App store badges", mode: "static" }],
  },
  {
    name: "Newsletter Subscription",
    blocks: [{ type: "newsletter", name: "Newsletter subscription", description: "Email capture form", mode: "static" }],
  },
  {
    name: "Online Payment",
    blocks: [{ type: "payment-info", name: "Online payment", description: "Accepted payment methods", mode: "static" }],
  },
  {
    name: "WhatsApp / Chat Button",
    blocks: [
      { type: "float-whatsapp", name: "WhatsApp / Chat Button", description: "Floating WhatsApp button", mode: "static" },
      { type: "float-call", name: "Call Button", description: "Floating phone button", mode: "static" },
    ],
  },
  {
    name: "Footer",
    blocks: [{ type: "footer", name: "Footer", description: "Links & copyright", mode: "static" }],
  },
];

export const ALL_BLOCK_TYPES = TEMPLATE_BUILDER_CATEGORIES.flatMap((c) => c.blocks);

export function getBlockMeta(type: string) {
  return ALL_BLOCK_TYPES.find((b) => b.type === type);
}
