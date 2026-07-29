/** Shared homepage SEO copy — used in Index.tsx meta/schema and MarketingHomePage. */

export const HOME_SEO_TITLE = "Free Business Website & Online Booking Software | Appointza";

export const HOME_SEO_DESCRIPTION =
  "Create a free business website with online appointment booking, payments, WhatsApp reminders, slot scheduling, and business management for salons, clinics, gyms, events, resorts, and more.";

export const HOME_SEO_KEYWORDS = [
  "appointment booking software",
  "online booking system",
  "online appointment booking",
  "booking software",
  "appointment scheduling software",
  "free business website",
  "business website builder",
  "booking website",
  "online booking platform",
  "appointment management software",
  "slot booking software",
  "booking management system",
  "online appointment system",
  "service business software",
  "appointment booking app",
  "WhatsApp booking system",
  "salon booking software",
  "clinic management software",
  "gym booking software",
  "event booking software",
  "QR check-in software",
  "India booking software",
  "spa booking software",
  "doctor appointment booking",
  "resort booking software",
  "party hall booking software",
  "sports turf booking software",
].join(", ");

export type HomeFaqItem = { question: string; answer: string };

export const HOME_FAQ_ITEMS: HomeFaqItem[] = [
  {
    question: "What is appointment booking software?",
    answer:
      "Appointment booking software is an online booking system that lets service businesses accept online appointments, manage slot scheduling, send WhatsApp reminders, collect payments, and track bookings from one dashboard. Appointza combines appointment scheduling software with a free business website and booking management tools built for India.",
  },
  {
    question: "How can I create a free booking website?",
    answer:
      "Sign up on Appointza to create a free business website with your own online booking page in minutes. Our business website builder includes your service catalog, live slot availability, online appointment booking, and payment collection — no coding required.",
  },
  {
    question: "Which businesses can use Appointza?",
    answer:
      "Appointza is service business software for salons, spas, clinics, gyms, tutors, consultants, resorts, party halls, event organizers, sports turf venues, and service centers. If your business runs on appointments, events, or slot bookings, our online booking platform fits your workflow.",
  },
  {
    question: "Does Appointza support online payments?",
    answer:
      "Yes. Appointza supports UPI, card, and wallet payments through Razorpay so customers can pay when they book online. Prepaid bookings reduce no-shows and keep your booking management system and revenue records in sync.",
  },
  {
    question: "Can customers book appointments online?",
    answer:
      "Yes. Customers can book appointments online 24/7 through your booking website. They choose a service, pick an available slot from your online booking calendar, and receive instant confirmation — a core feature of our online appointment system.",
  },
  {
    question: "Does Appointza send WhatsApp reminders?",
    answer:
      "Yes. Appointza is a WhatsApp booking system that sends automated confirmations and reminders before each appointment. SMS reminders are also available, helping reduce no-shows without manual follow-up.",
  },
  {
    question: "Can I manage multiple branches?",
    answer:
      "Yes. Appointza supports multi-location booking with staff calendars, branch-level controls, and centralized reporting — ideal for clinic management software, salon chains, and franchise operators scaling across India.",
  },
  {
    question: "Is Appointza suitable for salons and clinics?",
    answer:
      "Absolutely. Appointza works as salon booking software and clinic appointment software with staff scheduling, customer records, online payments, and WhatsApp reminders. Doctors, therapists, and salon owners use it as their primary appointment management software.",
  },
  {
    question: "Can I manage events and appointments together?",
    answer:
      "Yes. Appointza handles both online appointment booking and event booking software features — including event ticket booking, capacity limits, and QR check-in software for fast entry at the door.",
  },
  {
    question: "Does Appointza offer a free plan?",
    answer:
      "Yes. Start with a free plan that includes a free business website and 50 free bookings every month. Upgrade anytime for more free bookings, lower per-booking fees, and advanced booking management system features.",
  },
];

export const buildHomeFaqSchema = (pageUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
  url: pageUrl,
});

export const buildHomeBreadcrumbSchema = (baseUrl: string) => ({
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
