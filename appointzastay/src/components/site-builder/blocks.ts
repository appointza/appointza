import type { LucideIcon } from "lucide-react";
import {
  LayoutTemplate,
  Sparkles,
  Rows3,
  BarChart3,
  Tag,
  Quote,
  HelpCircle,
  Mail,
  Megaphone,
  Minus,
  Menu,
  SplitSquareHorizontal,
  MonitorPlay,
  Image as ImageIcon,
  Video,
  Waves,
  Type,
  LayoutGrid,
  Cpu,
  Box,
  BedDouble,
  Wifi,
  Images,
  CalendarCheck,
  Gift,
  Star,
  MapPin,
  ShieldCheck,
  CreditCard,
  Hotel,
} from "lucide-react";
import type { PageBlock } from "./types";

export type BlockCategory =
  | "Structure"
  | "Hero"
  | "Content"
  | "Conversion"
  | "Hotel"
  | "Footer";

export type BlockKind =
  | "nav"
  | "hero"
  | "heroSplit"
  | "heroShowcase"
  | "heroBackground"
  | "heroVideo"
  | "heroAnimated"
  | "heroMinimal"
  | "heroCards"
  | "heroSaas"
  | "hero3d"
  | "features"
  | "services"
  | "stats"
  | "pricing"
  | "testimonials"
  | "faq"
  | "contact"
  | "cta"
  | "footer"
  | "hotelHero"
  | "hotelAbout"
  | "hotelRooms"
  | "hotelAllRooms"
  | "hotelAmenities"
  | "hotelGallery"
  | "hotelBooking"
  | "hotelPackages"
  | "hotelReviews"
  | "hotelNearby"
  | "hotelContact"
  | "hotelPolicies"
  | "hotelPayment";

export interface BlockDef {
  kind: BlockKind;
  label: string;
  category: BlockCategory;
  icon: LucideIcon;
  defaults: Record<string, unknown>;
}

export interface BlockInstance {
  id: string;
  kind: BlockKind;
  props: Record<string, unknown>;
}

const heroCenteredDefaults = {
  eyebrow: "v2.0 — Now in public beta",
  title: "Building for the next era of design.",
  subtitle:
    "An architectural approach to high-fidelity interface production. Precision in every pixel, speed in every move.",
  primaryCta: "Start Building",
  secondaryCta: "Documentation",
};

export const BLOCK_DEFS: BlockDef[] = [
  {
    kind: "nav",
    label: "Navigation",
    category: "Structure",
    icon: Menu,
    defaults: { brand: "KRAFT", links: ["Work", "About", "Contact"] },
  },
  {
    kind: "hero",
    label: "Hero — Centered",
    category: "Hero",
    icon: Sparkles,
    defaults: heroCenteredDefaults,
  },
  {
    kind: "heroSplit",
    label: "Hero — Split",
    category: "Hero",
    icon: SplitSquareHorizontal,
    defaults: {
      eyebrow: "Design Systems Platform",
      title: "Ship interfaces with structural integrity.",
      subtitle:
        "A unified workspace for design, code and content — built around a single source of truth.",
      primaryCta: "Get Started",
      secondaryCta: "Watch Demo",
      imageLabel: "PRODUCT.MEDIA",
    },
  },
  {
    kind: "heroShowcase",
    label: "Hero — Product Showcase",
    category: "Hero",
    icon: MonitorPlay,
    defaults: {
      title: "The dashboard your team actually opens.",
      subtitle: "Realtime metrics, zero setup. Connect data in under a minute.",
      primaryCta: "Try Free",
      secondaryCta: "Book Demo",
    },
  },
  {
    kind: "heroBackground",
    label: "Hero — Background Image",
    category: "Hero",
    icon: ImageIcon,
    defaults: {
      title: "Made for the bold.",
      subtitle: "A platform crafted for teams that move with intent.",
      primaryCta: "Begin",
    },
  },
  {
    kind: "heroVideo",
    label: "Hero — Video",
    category: "Hero",
    icon: Video,
    defaults: {
      title: "Motion is the message.",
      subtitle: "Tell your story with full-bleed video and a single clear call to action.",
      primaryCta: "Watch the film",
    },
  },
  {
    kind: "heroAnimated",
    label: "Hero — Animated Gradient",
    category: "Hero",
    icon: Waves,
    defaults: {
      eyebrow: "AI · Realtime · Open",
      title: "Build at the speed of thought.",
      subtitle: "The new way to design, prototype and deploy — all in one canvas.",
      primaryCta: "Start Free",
      secondaryCta: "See Pricing",
    },
  },
  {
    kind: "heroMinimal",
    label: "Hero — Minimal",
    category: "Hero",
    icon: Type,
    defaults: {
      title: "Less, on purpose.",
      subtitle: "A studio building tools for considered work.",
      primaryCta: "Read more →",
    },
  },
  {
    kind: "heroCards",
    label: "Hero — Card Grid",
    category: "Hero",
    icon: LayoutGrid,
    defaults: {
      title: "Everything you need to launch.",
      subtitle: "Three pillars, one workflow.",
      cards: [
        { title: "Design", body: "Reusable, brand-aware components." },
        { title: "Build", body: "Production code from the first click." },
        { title: "Ship", body: "One-command deployment to the edge." },
      ],
    },
  },
  {
    kind: "heroSaas",
    label: "Hero — AI SaaS",
    category: "Hero",
    icon: Cpu,
    defaults: {
      badge: "Backed by Sequoia",
      title: "Your AI co-pilot for revenue ops.",
      subtitle:
        "Forecast pipeline, score leads and brief reps — automatically. Trained on your stack.",
      primaryCta: "Start free trial",
      secondaryCta: "Talk to sales",
      logos: ["Linear", "Notion", "Vercel", "Stripe", "Figma"],
    },
  },
  {
    kind: "hero3d",
    label: "Hero — 3D Object",
    category: "Hero",
    icon: Box,
    defaults: {
      title: "Dimensional by default.",
      subtitle: "Bring depth, light and weight to the surfaces your users touch.",
      primaryCta: "Explore",
      secondaryCta: "Gallery",
    },
  },
  {
    kind: "features",
    label: "Feature Grid",
    category: "Content",
    icon: Rows3,
    defaults: {
      eyebrow: "Capabilities",
      title: "Engineered for craft.",
      items: [
        { n: "01", title: "Precision Grid", body: "Fixed layouts that respond to viewport changes with mathematical certainty." },
        { n: "02", title: "Typography First", body: "Built-in scales for display, body, and technical metadata systems." },
        { n: "03", title: "Open Logic", body: "Extend your builder with custom logic hooks and API integrations." },
      ],
    },
  },
  {
    kind: "services",
    label: "Services",
    category: "Content",
    icon: LayoutTemplate,
    defaults: {
      title: "What we do.",
      items: [
        { title: "Brand Systems", body: "Visual identity and design foundations." },
        { title: "Product Design", body: "End-to-end interface and interaction." },
        { title: "Engineering", body: "Performant code, shipped to production." },
      ],
    },
  },
  {
    kind: "stats",
    label: "Stats",
    category: "Content",
    icon: BarChart3,
    defaults: {
      items: [
        { value: "120+", label: "Projects shipped" },
        { value: "14", label: "Countries reached" },
        { value: "99.9%", label: "Uptime delivered" },
        { value: "4.9", label: "Avg. client rating" },
      ],
    },
  },
  {
    kind: "pricing",
    label: "Pricing",
    category: "Conversion",
    icon: Tag,
    defaults: {
      title: "Simple, structural pricing.",
      tiers: [
        { name: "Studio", price: "$24", per: "/mo", features: ["1 project", "Basic blocks", "Export HTML"] },
        { name: "Practice", price: "$72", per: "/mo", features: ["10 projects", "All blocks", "Custom domains", "Priority support"], featured: true },
        { name: "Atelier", price: "Custom", per: "", features: ["Unlimited", "SSO", "Dedicated CSM"] },
      ],
    },
  },
  {
    kind: "testimonials",
    label: "Testimonials",
    category: "Conversion",
    icon: Quote,
    defaults: {
      items: [
        { quote: "The cleanest builder we've shipped with. Pages feel architectural, not assembled.", author: "Mira Lindqvist", role: "Design Lead, Norm" },
        { quote: "Replaced three tools. The block model just clicks for a small team.", author: "Daniel Okafor", role: "Founder, Saltworks" },
      ],
    },
  },
  {
    kind: "faq",
    label: "FAQ",
    category: "Conversion",
    icon: HelpCircle,
    defaults: {
      title: "Common questions.",
      items: [
        { q: "Do I own the output?", a: "Yes. Every page can be exported as static HTML and CSS." },
        { q: "Can I add my own blocks?", a: "Custom blocks can be registered through the block schema API." },
        { q: "Is there a free tier?", a: "Studio is free for a single project, no credit card required." },
      ],
    },
  },
  {
    kind: "contact",
    label: "Contact",
    category: "Footer",
    icon: Mail,
    defaults: {
      title: "Start a conversation.",
      subtitle: "Tell us about the project. We reply within one business day.",
    },
  },
  {
    kind: "cta",
    label: "Call to Action",
    category: "Footer",
    icon: Megaphone,
    defaults: {
      title: "Ready to build with intention?",
      cta: "Open the editor",
    },
  },
  {
    kind: "footer",
    label: "Footer",
    category: "Footer",
    icon: Minus,
    defaults: {
      brand: "STRUCT",
      tagline: "Designed in the open. Built with precision.",
      columns: [
        { title: "Product", links: ["Blocks", "Templates", "Pricing"] },
        { title: "Company", links: ["About", "Journal", "Contact"] },
        { title: "Legal", links: ["Privacy", "Terms"] },
      ],
    },
  },
  {
    kind: "hotelHero",
    label: "Hotel — Hero Banner",
    category: "Hotel",
    icon: Hotel,
    defaults: {
      brand: "THE AZURE PALMS",
      title: "An island of quiet, minutes from the city.",
      subtitle: "Five-star comfort, locally rooted hospitality.",
      primaryCta: "Book Now",
    },
  },
  {
    kind: "hotelAbout",
    label: "Hotel — About",
    category: "Hotel",
    icon: Sparkles,
    defaults: {
      title: "About the hotel",
      description:
        "Tucked between palm groves and the coastline, The Azure Palms offers 84 sea-view rooms, two restaurants, an infinity pool and a full-service spa.",
      highlights: [
        "2 km from the historic old town",
        "Beachfront with private access",
        "All-day dining & rooftop bar",
      ],
    },
  },
  {
    kind: "hotelRooms",
    label: "Hotel — Room Types",
    category: "Hotel",
    icon: BedDouble,
    defaults: {
      title: "Rooms & suites",
      useLiveRooms: false,
      rooms: [
        { name: "Standard Room", capacity: "2 guests", price: "$120", per: "/night", features: ["Queen bed", "City view", "32m²"] },
        { name: "Deluxe Room", capacity: "2 guests", price: "$180", per: "/night", features: ["King bed", "Sea view", "42m²"] },
        { name: "Suite", capacity: "3 guests", price: "$320", per: "/night", features: ["Living area", "Balcony", "65m²"] },
        { name: "Family Room", capacity: "4 guests", price: "$260", per: "/night", features: ["2 bedrooms", "Sea view", "70m²"] },
      ],
    },
  },
  {
    kind: "hotelAllRooms",
    label: "Hotel — All Rooms (Live)",
    category: "Hotel",
    icon: BedDouble,
    defaults: {
      title: "Our rooms",
      subtitle: "All rooms from your property — synced from Staff → Rooms.",
      useLiveRooms: true,
      showStatus: true,
    },
  },
  {
    kind: "hotelAmenities",
    label: "Hotel — Amenities",
    category: "Hotel",
    icon: Wifi,
    defaults: {
      title: "Amenities",
      items: [
        "Free WiFi", "Air Conditioning", "Swimming Pool", "Restaurant",
        "Free Parking", "Gym", "24/7 Room Service", "Spa & Wellness",
      ],
    },
  },
  {
    kind: "hotelGallery",
    label: "Hotel — Gallery",
    category: "Hotel",
    icon: Images,
    defaults: {
      title: "Gallery",
      categories: ["Hotel", "Rooms", "Restaurant", "Pool"],
    },
  },
  {
    kind: "hotelBooking",
    label: "Hotel — Availability & Booking",
    category: "Hotel",
    icon: CalendarCheck,
    defaults: {
      cta: "Search Rooms",
    },
  },
  {
    kind: "hotelPackages",
    label: "Hotel — Packages & Offers",
    category: "Hotel",
    icon: Gift,
    defaults: {
      title: "Packages & offers",
      packages: [
        { name: "Weekend Escape", desc: "2 nights + breakfast for two.", price: "From $260" },
        { name: "Family Package", desc: "Kids stay & eat free, all weekend.", price: "From $410" },
        { name: "Honeymoon Suite", desc: "Champagne, spa credit, late checkout.", price: "From $580" },
        { name: "Corporate Stay", desc: "Flexible rates, fast WiFi, meeting room.", price: "From $190" },
      ],
    },
  },
  {
    kind: "hotelReviews",
    label: "Hotel — Reviews & Ratings",
    category: "Hotel",
    icon: Star,
    defaults: {
      title: "What guests say",
      rating: "4.8",
      count: "1,284 reviews",
      reviews: [
        { name: "Aisha R.", stars: 5, text: "Stunning property, faultless service. We'll be back." },
        { name: "Marco D.", stars: 5, text: "Best breakfast we've had on the coast. Room was huge." },
        { name: "Priya S.", stars: 4, text: "Beautiful pool. Front desk was lovely with our kids." },
      ],
    },
  },
  {
    kind: "hotelNearby",
    label: "Hotel — Nearby Attractions",
    category: "Hotel",
    icon: MapPin,
    defaults: {
      title: "Getting around",
      items: [
        { name: "International Airport", distance: "18 km · 25 min" },
        { name: "Central Railway Station", distance: "6 km · 12 min" },
        { name: "Old Town & Markets", distance: "2 km · 6 min" },
        { name: "Lighthouse Beach", distance: "On-site" },
      ],
    },
  },
  {
    kind: "hotelContact",
    label: "Hotel — Contact & Location",
    category: "Hotel",
    icon: MapPin,
    defaults: {
      title: "Find us",
      address: "12 Coral Drive, Marine Bay",
      phone: "+1 (555) 014-2200",
      whatsapp: "+1 (555) 014-2200",
      email: "stay@azurepalms.com",
    },
  },
  {
    kind: "hotelPolicies",
    label: "Hotel — Policies",
    category: "Hotel",
    icon: ShieldCheck,
    defaults: {
      title: "Hotel policies",
      items: [
        { label: "Check-in", value: "From 14:00" },
        { label: "Check-out", value: "Until 11:00" },
        { label: "Cancellation", value: "Free up to 48h before arrival" },
        { label: "Refunds", value: "Processed within 5–7 business days" },
        { label: "House rules", value: "No smoking. Pets on request." },
      ],
    },
  },
  {
    kind: "hotelPayment",
    label: "Hotel — Online Payment",
    category: "Hotel",
    icon: CreditCard,
    defaults: {
      title: "Secure online payment",
      subtitle: "Powered by Razorpay. Pay an advance or in full at booking.",
      options: ["Advance payment (20%)", "Full payment", "Pay at hotel"],
      cta: "Confirm & Pay",
    },
  },
];

export const CATEGORY_ORDER: BlockCategory[] = [
  "Structure",
  "Hero",
  "Content",
  "Conversion",
  "Hotel",
  "Footer",
];

export const KIND_TO_TYPE: Record<BlockKind, string> = {
  nav: "navigation",
  hero: "hero-centered",
  heroSplit: "hero-split",
  heroShowcase: "hero-product-showcase",
  heroBackground: "hero-background-image",
  heroVideo: "hero-video",
  heroAnimated: "hero-animated-gradient",
  heroMinimal: "hero-minimal",
  heroCards: "hero-card-grid",
  heroSaas: "hero-ai-saas",
  hero3d: "hero-3d",
  features: "feature-grid",
  services: "services",
  stats: "stats",
  pricing: "pricing",
  testimonials: "testimonials",
  faq: "faq",
  contact: "contact",
  cta: "call-to-action",
  footer: "footer",
  hotelHero: "hotel-hero-banner",
  hotelAbout: "hotel-about",
  hotelRooms: "hotel-room-types",
  hotelAllRooms: "hotel-all-rooms",
  hotelAmenities: "hotel-amenities",
  hotelGallery: "hotel-gallery",
  hotelBooking: "hotel-booking",
  hotelPackages: "hotel-packages",
  hotelReviews: "hotel-reviews",
  hotelNearby: "hotel-attractions",
  hotelContact: "hotel-contact",
  hotelPolicies: "hotel-policies",
  hotelPayment: "hotel-payment",
};

export const TYPE_TO_KIND: Record<string, BlockKind> = {
  ...Object.fromEntries(
    Object.entries(KIND_TO_TYPE).map(([kind, type]) => [type, kind as BlockKind]),
  ) as Record<string, BlockKind>,
  "feature-grid-travel": "features",
  "services-dining": "services",
};

const DEFAULT_PADDING = { top: 80, right: 40, bottom: 80, left: 40 };
const DEFAULT_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };

export const getBlockDef = (kind: BlockKind): BlockDef =>
  BLOCK_DEFS.find((b) => b.kind === kind)!;

export const createBlockInstance = (kind: BlockKind): BlockInstance => ({
  id: `${kind}-${Math.random().toString(36).slice(2, 9)}`,
  kind,
  props: structuredClone(getBlockDef(kind).defaults),
});

export function getKindForType(type: string): BlockKind | undefined {
  return TYPE_TO_KIND[type];
}

export function getBlockDefForType(type: string): BlockDef | undefined {
  const kind = TYPE_TO_KIND[type];
  return kind ? getBlockDef(kind) : undefined;
}

/** @deprecated use getBlockDefForType */
export function getBlockMeta(type: string) {
  const def = getBlockDefForType(type);
  if (!def) return undefined;
  return { type: KIND_TO_TYPE[def.kind], name: def.label, category: def.category.toLowerCase(), icon: "" };
}

export function getCatalogByCategory() {
  return CATEGORY_ORDER.map((category, index) => ({
    id: category,
    order: index + 1,
    label: category.toUpperCase(),
    items: BLOCK_DEFS.filter((b) => b.category === category),
  }));
}

function applySiteNameToDefaults(kind: BlockKind, props: Record<string, unknown>, siteName: string) {
  if (kind === "nav") props.brand = siteName;
  if (kind === "hotelHero") {
    props.brand = siteName;
    props.title = props.title ?? `Welcome to ${siteName}`;
  }
  if (kind === "footer") props.brand = siteName;
}

export function createPageBlockFromKind(kind: BlockKind, siteName = "Your property"): PageBlock {
  const props = structuredClone(getBlockDef(kind).defaults);
  applySiteNameToDefaults(kind, props, siteName);
  return {
    id: crypto.randomUUID(),
    type: KIND_TO_TYPE[kind],
    props,
    layout: {
      width: 100,
      height: "auto",
      padding: { ...DEFAULT_PADDING },
      margin: { ...DEFAULT_MARGIN },
    },
  };
}

/** @deprecated use createPageBlockFromKind */
export function createDefaultBlock(type: string, siteName = "Your property"): PageBlock {
  const kind = TYPE_TO_KIND[type];
  if (kind) return createPageBlockFromKind(kind, siteName);
  return {
    id: crypto.randomUUID(),
    type,
    props: { title: type },
    layout: {
      width: 100,
      height: "auto",
      padding: { ...DEFAULT_PADDING },
      margin: { ...DEFAULT_MARGIN },
    },
  };
}

export function pageBlockToInstance(block: PageBlock): BlockInstance | null {
  const kind = TYPE_TO_KIND[block.type];
  if (!kind) return null;
  return { id: block.id, kind, props: block.props };
}
