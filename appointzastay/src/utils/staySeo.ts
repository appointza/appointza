/** Shared Appointza Stay homepage SEO — meta, FAQ, and JSON-LD schema builders. */

export const STAY_SEO_TITLE = "Hotel & Party Hall Booking Software | Appointza Stay";

export const STAY_SEO_DESCRIPTION =
  "Create a hotel or party hall booking website with room management, online bookings, payments, occupancy tracking, and guest management—all in one platform.";

export const STAY_SEO_KEYWORDS = [
  "hotel management software",
  "property management software",
  "hotel booking software",
  "hotel booking website",
  "resort booking software",
  "lodge management software",
  "homestay booking software",
  "guest house management software",
  "villa booking software",
  "hostel management software",
  "service apartment management software",
  "party hall booking software",
  "room booking software",
  "online room booking system",
  "booking engine",
  "direct booking website",
  "room reservation system",
  "hotel reservation software",
  "accommodation booking software",
  "cloud hotel management software",
  "hotel PMS",
  "hospitality management software",
  "stay booking platform",
  "online booking system India",
  "wedding hall booking software",
  "banquet hall booking software",
].join(", ");

export type StayFaqItem = { question: string; answer: string };

export const STAY_FAQ_ITEMS: StayFaqItem[] = [
  {
    question: "What is hotel management software?",
    answer:
      "Hotel management software is a property management platform that helps hotels, resorts, and lodges manage rooms, reservations, guests, payments, and occupancy from one dashboard. Appointza Stay combines hotel PMS features with a direct booking website and online room booking system.",
  },
  {
    question: "Can I create a hotel booking website?",
    answer:
      "Yes. Appointza Stay includes a free hotel website builder so you can launch a hotel booking website with rooms, gallery, amenities, and online room booking — your own direct booking website without OTA commissions.",
  },
  {
    question: "Can I manage party hall bookings?",
    answer:
      "Yes. Appointza Stay works as party hall booking software for wedding halls, banquet halls, and event venues. Manage hall availability, accept online bookings, and collect payments alongside room reservations.",
  },
  {
    question: "Does Appointza Stay support online payments?",
    answer:
      "Yes. Accept UPI, cards, net banking, and wallets when guests book online. Direct online booking and payments reduce no-shows and keep revenue in your account.",
  },
  {
    question: "Can guests book directly?",
    answer:
      "Yes. Guests book directly on your hotel booking website or party hall booking page. Your booking engine shows live availability so customers can complete room reservation without phone calls.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes. Connect a custom domain so guests visit yourbrand.com — a professional direct booking website that builds trust and improves search visibility.",
  },
  {
    question: "Does it support multiple properties?",
    answer:
      "Yes. Enterprise plans support multiple hotels, lodges, homestays, or party hall locations from one owner account — ideal for hospitality groups using property management software at scale.",
  },
  {
    question: "Can I manage housekeeping?",
    answer:
      "Yes. Update room status for cleaning, maintenance, occupied, and available. Housekeeping and front desk see the same live board so your room reservation calendar stays accurate.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "Yes. The mobile dashboard lets owners and staff manage bookings, room status, and guest check-in from anywhere — essential cloud hotel management software for busy properties.",
  },
  {
    question: "Is Appointza Stay suitable for resorts?",
    answer:
      "Yes. Resort booking software features include multi-room management, occupancy tracking, guest management, and a branded resort booking website for direct reservations.",
  },
  {
    question: "What is a hotel booking engine?",
    answer:
      "A hotel booking engine is the online system guests use to select dates, choose rooms, and pay on your website. Appointza Stay includes a built-in booking engine with slot availability and instant confirmation.",
  },
  {
    question: "Does Appointza Stay offer a free plan?",
    answer:
      "Yes. Sign up free and get 30 booking credits once — website and hosting included. There is no monthly free allowance after that; recharge when you need more bookings. Upgrade with paid plans as your property grows.",
  },
  {
    question: "Do I pay separately for website design, hosting, or domain?",
    answer:
      "No. Appointza Stay includes your booking website, hosting, domain options, and SSL. Agencies often charge ₹10,000+ for design, ₹3,000/year for hosting, ₹1,000/year for domain, and ₹500–₹1,000/month for maintenance — we cover those. You only recharge booking credits and use them as guests book.",
  },
];

export const STAY_FEATURE_HIGHLIGHTS = [
  "Free Hotel Website",
  "Online Room Booking",
  "Party Hall Booking",
  "Room Reservation Calendar",
  "Property Management",
  "Guest Management",
  "Online Payments",
  "Check-in & Check-out",
  "Housekeeping",
  "Occupancy Tracking",
  "Booking Reports",
  "Mobile Dashboard",
];

export function getStayAppBaseUrl(): string {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  return `${window.location.origin}${base}`;
}

export const buildStayFaqSchema = (pageUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: STAY_FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
  url: pageUrl,
});

export const buildStayBreadcrumbSchema = (baseUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${baseUrl}/`,
    },
  ],
});

export const buildStaySoftwareSchema = (baseUrl: string, imageUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Appointza Stay",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Hotel Management Software",
  operatingSystem: "Web, iOS, Android",
  description: STAY_SEO_DESCRIPTION,
  url: baseUrl,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    description: "Free signup with 30 booking credits, hotel booking website, and room management",
  },
  featureList: STAY_FEATURE_HIGHLIGHTS,
  screenshot: imageUrl,
});

export const buildStayProductSchema = (baseUrl: string, imageUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Appointza Stay Hotel Management Software",
  description: STAY_SEO_DESCRIPTION,
  brand: {
    "@type": "Brand",
    name: "Appointza Stay",
  },
  category: "Hotel Management Software",
  url: baseUrl,
  image: imageUrl,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    url: `${baseUrl}/register`,
  },
});

export const buildStayOrganizationSchema = (baseUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Appointza Stay",
  url: baseUrl,
  description: STAY_SEO_DESCRIPTION,
});

export const buildStayWebSiteSchema = (baseUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Appointza Stay",
  url: baseUrl,
  description: STAY_SEO_DESCRIPTION,
});
