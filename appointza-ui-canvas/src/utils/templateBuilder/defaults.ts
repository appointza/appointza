import type { TemplateBuilderPage } from "@/types/templateBuilder.types";
import { BLOCK_BACKGROUND_DEFAULTS } from "./blockBackground";

/** Default editable fields when a block is dropped on the canvas (Webzys getDefaultBlockData pattern). */
export function getDefaultBlockData(blockType: string): Record<string, unknown> {
  const map: Record<string, Record<string, unknown>> = {
    hero: {
      variant: 1,
      title: "{{organisationdetail.name}}",
      subtitle: "{{organisationdetail.tagline}}",
      buttonText: "Book appointment",
      useLiveBookUrl: true,
    },
    "hero-2": {
      variant: 1,
      title: "{{organisationdetail.name}}",
      subtitle: "{{organisationdetail.tagline}}",
      buttonText: "Book appointment",
      secondaryButtonText: "View services",
      image: "",
      imageId: 0,
    },
    "hero-3": {
      variant: 1,
      title: "{{organisationdetail.name}}",
      subtitle: "{{organisationdetail.tagline}}",
      buttonText: "Book appointment",
    },
    "hero-4": {
      variant: 1,
      title: "{{organisationdetail.name}}",
      subtitle: "{{organisationdetail.tagline}}",
      buttonText: "Book appointment",
      image: "",
      imageId: 0,
      overlayOpacity: 0.45,
    },
    "hero-5": {
      variant: 1,
      title: "{{organisationdetail.name}}",
      subtitle: "{{organisationdetail.tagline}}",
      buttonText: "Book appointment",
      secondaryButtonText: "",
      image: "",
      imageId: 0,
    },
    "hero-6": {
      variant: 1,
      title: "{{organisationdetail.name}}",
      subtitle: "{{organisationdetail.tagline}}",
      buttonText: "Book appointment",
      secondaryButtonText: "",
      videoUrl: "",
    },
    header: {
      variant: 1,
      logoText: "{{organisationdetail.name}}",
      links: [
        { label: "About", href: "#about" },
        { label: "Services", href: "#services" },
        { label: "Book", href: "#booking" },
        { label: "Contact", href: "#contact" },
      ],
      ctaText: "Book now",
    },
    about: {
      variant: 1,
      title: "About us",
      content: "Write a short story about your business. What makes you different? Why customers love you?",
    },
    features: {
      variant: 1,
      title: "Features & benefits",
      items: [
        { title: "Fast booking", desc: "Choose a service and slot in seconds." },
        { title: "Trusted team", desc: "Experienced professionals." },
        { title: "Secure payments", desc: "Pay online via Razorpay." },
      ],
    },
    gallery: {
      variant: 1,
      title: "Gallery",
      imageIds: [],
      images: [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1520975958225-3f61d6fbdcfa?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop",
      ],
    },
    media: {
      variant: 1,
      title: "Photos & videos",
      videoUrl: "",
      imageIds: [],
      images: [],
    },
    testimonials: {
      variant: 1,
      title: "What customers say",
      items: [
        { name: "Customer A", quote: "Amazing experience and easy booking." },
        { name: "Customer B", quote: "Professional team and great service." },
        { name: "Customer C", quote: "I’ll definitely come back again." },
      ],
    },
    blog: {
      variant: 1,
      title: "Blog / News",
      posts: [
        { title: "New offer this month", date: "2026-05-01", excerpt: "Save on your first visit…" },
        { title: "How to choose a service", date: "2026-04-20", excerpt: "A quick guide to…" },
      ],
    },
    announcements: {
      variant: 1,
      title: "Announcements",
      items: ["We are open on Sundays this month.", "New services added to the catalog."],
    },
    search: {
      variant: 1,
      placeholder: "Search services…",
    },
    filters: {
      variant: 1,
      title: "Categories",
      items: ["Popular", "New", "Packages", "Memberships"],
    },
    support: {
      variant: 1,
      title: "Support / Help Center",
      items: ["How booking works", "Payment help", "Reschedule policy", "Contact support"],
    },
    privacy: {
      variant: 1,
      title: "Privacy policy",
      content: "We store only what we need to deliver your appointment. Payments are processed securely.",
    },
    terms: {
      variant: 1,
      title: "Terms & conditions",
      content: "By booking you agree to our terms, pricing and policies.",
    },
    careers: {
      variant: 1,
      title: "Careers",
      roles: [
        { title: "Trainer / Staff", location: "Chennai", type: "Full time" },
        { title: "Front desk", location: "Chennai", type: "Part time" },
      ],
    },
    auth: {
      variant: 1,
      title: "Login / Signup",
      content: "Log in to manage bookings, reschedule and view history.",
      primaryText: "Login",
      secondaryText: "Sign up",
    },
    dashboard: {
      variant: 1,
      title: "Dashboard / User Panel",
      items: ["My bookings", "Upcoming appointments", "Invoices", "Profile settings"],
    },
    loyalty: {
      variant: 1,
      title: "Loyalty / Rewards",
      content: "Earn points for each booking and redeem for discounts.",
      pointsLabel: "Points",
    },
    "download-app": {
      variant: 1,
      title: "Download our app",
      content: "Book faster and get reminders on mobile.",
      androidUrl: "#",
      iosUrl: "#",
    },
    newsletter: {
      variant: 1,
      title: "Newsletter",
      content: "Get offers and updates in your inbox.",
      buttonText: "Subscribe",
    },
    logos: {
      variant: 1,
      title: "Trusted by",
      logos: ["Brand One", "Brand Two", "Brand Three", "Brand Four"],
    },
    stats: {
      variant: 1,
      title: "By the numbers",
      items: [
        { label: "Bookings", value: "10k+" },
        { label: "Rating", value: "4.8★" },
        { label: "Locations", value: "12" },
      ],
    },
    timeline: {
      variant: 1,
      title: "How it works",
      steps: [
        { title: "Pick a service", desc: "Choose from the catalog." },
        { title: "Select a slot", desc: "See real-time availability." },
        { title: "Confirm", desc: "Get instant confirmation." },
      ],
    },
    map: {
      variant: 1,
      title: "Find us",
      content: "{{locationdetail.addressline1}}, {{locationdetail.city}}",
    },
    "live-status": {
      variant: 1,
      title: "Live status",
      status: "Open",
      note: "Taking bookings now",
    },
    section: {
      variant: 1,
      title: "About us",
      content:
        "Tell customers about your business. This text is saved in the template; Appointza live blocks below pull real services, hours and location data at runtime.",
      eyebrow: "About us",
    },
    "cta-booking": {
      variant: 1,
      title: "Ready to book?",
      subtitle: "Pick a service and time — confirmation in seconds.",
      buttonText: "Book your appointment",
    },
    "time-slots": {
      variant: 1,
      title: "Live slot availability",
      content: "See real-time openings when you open the booking flow. No phone tag required.",
      buttonText: "Check available slots",
    },
    pricing: {
      variant: 1,
      title: "Pricing",
      plans: [
        {
          name: "Free",
          price: "₹0",
          period: "/mo",
          bookings: "50 bookings/mo",
          afterNote: "Then: ₹10 or 3% per booking",
          cta: "Start free",
        },
        {
          name: "Starter",
          price: "₹299",
          period: "/mo",
          bookings: "50 bookings/mo",
          afterNote: "Then: ₹3 or 2% per booking",
          cta: "Choose Starter",
        },
        {
          name: "Basic",
          price: "₹499",
          period: "/mo",
          bookings: "150 bookings/mo",
          afterNote: "Then: ₹2 or 1.5% per booking",
          cta: "Choose Basic",
          popular: true,
        },
        {
          name: "Pro",
          price: "₹999",
          period: "/mo",
          bookings: "500 bookings/mo",
          afterNote: "Then: ₹1 or 1% per booking",
          cta: "Choose Pro",
        },
        {
          name: "Enterprise",
          price: "₹1,999",
          period: "/mo",
          bookings: "2,000 bookings/mo",
          afterNote: "Then: ₹1 or 1% per booking",
          cta: "Talk to us",
        },
      ],
      footnote: "Transaction fee applies after introductory period — whichever is higher.",
      // Backwards compatible structure (older templates)
      items: [
        { name: "Standard service", price: "₹499", note: "60 min" },
        { name: "Premium service", price: "₹899", note: "90 min" },
        { name: "Package of 5", price: "₹2,199", note: "Best value" },
      ],
    },
    membership: {
      variant: 1,
      title: "Membership plans",
      tiers: [
        { name: "Silver", price: "₹999/mo", perks: ["4 visits / month", "Member rates"] },
        { name: "Gold", price: "₹1,799/mo", perks: ["8 visits", "10% off add-ons"] },
        { name: "Platinum", price: "₹2,999/mo", perks: ["Unlimited visits", "Priority booking"] },
      ],
    },
    offers: {
      variant: 1,
      title: "Limited-time offer",
      code: "APPOINTZA20",
      description: "Save 20% on your first visit this month.",
      buttonText: "Claim offer",
    },
    team: {
      variant: 1,
      title: "Our team",
      members: [
        {
          name: "Lead specialist",
          role: "Senior stylist",
          experience: "10+ years experience",
          description: "Passionate about premium care and personalised service for every client.",
          imageId: 0,
          image: "",
        },
        {
          name: "Senior trainer",
          role: "Wellness coach",
          experience: "8+ years · Certified",
          description: "Helps clients choose the right services and build lasting routines.",
          imageId: 0,
          image: "",
        },
        {
          name: "Client success",
          role: "Bookings specialist",
          experience: "5+ years",
          description: "Makes scheduling easy and keeps every appointment running smoothly.",
          imageId: 0,
          image: "",
        },
      ],
    },
    faq: {
      variant: 1,
      title: "Frequently asked questions",
      items: [
        { q: "How do I book?", a: "Choose a service, pick a slot, and confirm online." },
        { q: "Can I reschedule?", a: "Yes — free reschedule up to 12 hours before your slot." },
        { q: "Do you accept walk-ins?", a: "Booked slots are prioritised; walk-ins subject to availability." },
      ],
    },
    form: {
      variant: 1,
      title: "Contact us",
      subject: "Website enquiry",
      submitLabel: "Send message",
    },
    "payment-info": {
      variant: 1,
      title: "Pay securely online",
      content: "We accept UPI, cards, net banking and wallets via Razorpay.",
    },
    policy: {
      variant: 1,
      policyType: "cancellation",
      title: "Cancellation policy",
      content:
        "Free reschedule or cancellation up to 12 hours before the slot. No-shows may be charged the booking fee.",
    },
    social: {
      variant: 1,
      title: "Follow us",
      links: [
        { label: "Instagram", url: "#" },
        { label: "Facebook", url: "#" },
        { label: "YouTube", url: "#" },
      ],
    },
    footer: {
      variant: 1,
      footerStyle: "rich",
      tagline: "{{organisationdetail.tagline}}",
    },
    "float-whatsapp": { variant: 1, enabled: true },
    "float-call": { variant: 1, enabled: true },
    "appointza-organization": { variant: 1, showLogo: true, showGst: false },
    "appointza-location": { variant: 1 },
    "appointza-services": { variant: 1 },
    "appointza-timings": { variant: 1 },
    "appointza-events": { variant: 1 },
    "appointza-reviews": { variant: 1 },
    "appointza-facilities": { variant: 1 },
    "appointza-location-images": { variant: 1 },
    "appointza-rooms": { variant: 1 },
    "appointza-hospitality-policies": { variant: 1 },
    "appointza-hospitality-packages": { variant: 1 },
    "appointza-food-menu": { variant: 1 },
    "appointza-nearby-places": { variant: 1 },
  };
  return map[blockType] ? { ...map[blockType] } : { title: blockType };
}

export function createDefaultHomePage(): TemplateBuilderPage {
  const ts = Date.now();
  return {
    id: "home",
    name: "Booking page",
    blocks: [
      { id: `appointza-organization-${ts}`, type: "appointza-organization", data: getDefaultBlockData("appointza-organization"), visible: true },
      { id: `section-${ts + 1}`, type: "section", data: getDefaultBlockData("section"), visible: true },
      { id: `appointza-services-${ts + 2}`, type: "appointza-services", data: getDefaultBlockData("appointza-services"), visible: true },
      { id: `cta-booking-${ts + 3}`, type: "cta-booking", data: getDefaultBlockData("cta-booking"), visible: true },
      { id: `appointza-timings-${ts + 4}`, type: "appointza-timings", data: getDefaultBlockData("appointza-timings"), visible: true },
      { id: `appointza-location-${ts + 5}`, type: "appointza-location", data: getDefaultBlockData("appointza-location"), visible: true },
      { id: `footer-${ts + 6}`, type: "footer", data: getDefaultBlockData("footer"), visible: true },
    ],
  };
}

export function createBlock(blockType: string) {
  return {
    id: `${blockType}-${Date.now()}`,
    type: blockType,
    data: { ...getDefaultBlockData(blockType), ...BLOCK_BACKGROUND_DEFAULTS },
    visible: true,
  };
}
