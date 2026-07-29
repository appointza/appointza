import { buildBookAppointmentPath } from "@/utils/templateBookingNav.util";
import { environment, getUiBaseUrl } from "@/utils/environment";

export type TemplateVariableGroup = {
  title: string;
  items: { token: string; description: string; example?: string }[];
};

/** Page sections aligned with the builder “Your business data” blocks. */
export const TEMPLATE_PAGE_SECTIONS = [
  {
    name: "Home / Organization",
    summary: "Name, tagline, logo, about text, Book button",
    variables: [
      "{{organisationdetail.name}}",
      "{{organisationdetail.tagline}}",
      "{{organisationdetail.notes}}",
      "{{#organizationlogo}}",
      "{{ORGANISATION_LOGO_URL}}",
      "{{organisationdetail.organisationlogo}}",
      "{{/organizationlogo}}",
      "{{BOOKNOWURL}}",
    ],
  },
  {
    name: "Google Map / Location",
    summary: "Address, map embed, phone, Google Maps link",
    variables: [
      "{{locationdetail.addressline1}}",
      "{{locationdetail.city}}",
      "{{locationdetail.state}}",
      "{{locationdetail.pincode}}",
      "{{locationdetail.mobile}}",
      "{{#googlemaps}}{{locationdetail.googlelocation}}{{/googlemaps}}",
    ],
  },
  {
    name: "Services / Products",
    summary: "Service catalog — section title OUTSIDE loop; ONE card per {{#orgnaisatinservice}} iteration inside a grid",
    variables: [
      "{{#orgnaisatinservice}}",
      "{{Servicename}}",
      "{{prize}}",
      "{{timetaken}}",
      "{{notes}}",
      "{{service_id}}",
      "{{SERVICE_BOOK_URL}}",
      "{{#service_image_id}}",
      "{{SERVICE_IMAGE_URL}}",
      "{{/service_image_id}}",
      "{{/orgnaisatinservice}}",
    ],
  },
  {
    name: "Availability / Time Slots",
    summary: "Working hours and opening times",
    variables: [
      "{{#OrganisationServiceTiming}}",
      "{{day_name}}",
      "{{start_time}}",
      "{{end_time}}",
      "{{/OrganisationServiceTiming}}",
    ],
  },
  {
    name: "Event / Schedule Section",
    summary: "Public events list with register links",
    variables: [
      "{{#hasevents}}",
      "{{#events}}",
      "{{event_name}}",
      "{{event_date}}",
      "{{entry_amount}}",
      "{{EVENTBOOKURL}}",
      "{{#event_image_id}}",
      "{{EVENT_IMAGE_URL}}",
      "{{/event_image_id}}",
      "{{/events}}",
      "{{/hasevents}}",
    ],
  },
  {
    name: "Testimonials / Reviews",
    summary: "Ratings and customer comments — show section only if reviews exist",
    variables: [
      "{{#reviews}}",
      "{{rating_stars}}",
      "{{comment}}",
      "{{/reviews}}",
    ],
  },
  {
    name: "Amenities",
    summary: "Facility checklist — show section only if amenities exist",
    variables: [
      "{{#facilities}}",
      "{{facility_displaytext}}",
      "{{/facilities}}",
    ],
  },
  {
    name: "Gallery / Portfolio",
    summary: "Location photo grid — show section only if photos exist",
    variables: [
      "{{#locationimages}}",
      "{{location_image_id}}",
      "{{LOCATION_IMAGE_URL}}",
      "{{/locationimages}}",
    ],
  },
  {
    name: "Videos",
    summary: "Location video gallery — show section only if video URLs exist",
    variables: [
      "{{#locationvideos}}",
      "{{LOCATION_VIDEO_EMBED_URL}}",
      "{{LOCATION_VIDEO_URL}}",
      "{{/locationvideos}}",
    ],
  },
] as const;

export const TEMPLATE_VARIABLE_GROUPS: TemplateVariableGroup[] = [
  {
    title: "Home / Organization",
    items: [
      { token: "{{organisationdetail.name}}", description: "Business name" },
      { token: "{{organisationdetail.tagline}}", description: "Tagline" },
      { token: "{{organisationdetail.notes}}", description: "About / description" },
      {
        token: "{{#organizationlogo}} ... {{/organizationlogo}}",
        description: "Show logo only if uploaded — wrap the img tag inside this block",
        example:
          '{{#organizationlogo}}<img src="{{ORGANISATION_LOGO_URL}}" alt="{{organisationdetail.name}}" style="max-height:56px;width:auto;object-fit:contain" />{{/organizationlogo}}',
      },
      {
        token: "{{ORGANISATION_LOGO_URL}}",
        description: "Full logo image URL (use inside {{#organizationlogo}} block)",
      },
      {
        token: "{{organisationdetail.organisationlogo}}",
        description: "Logo file ID (optional — prefer {{ORGANISATION_LOGO_URL}})",
      },
      {
        token: "{{BOOKNOWURL}}",
        description: "Book appointment link",
        example: '<a href="{{BOOKNOWURL}}" data-appointza-book>Book now</a>',
      },
      { token: "{{currentyear}}", description: "Footer year (auto)" },
    ],
  },
  {
    title: "Google Map / Location",
    items: [
      { token: "{{locationdetail.addressline1}}", description: "Street address" },
      { token: "{{locationdetail.addressline2}}", description: "Address line 2" },
      { token: "{{locationdetail.city}}", description: "City" },
      { token: "{{locationdetail.state}}", description: "State" },
      { token: "{{locationdetail.pincode}}", description: "PIN / postal code" },
      { token: "{{locationdetail.mobile}}", description: "Phone / WhatsApp" },
      { token: "{{#googlemaps}} ... {{/googlemaps}}", description: "Maps link — only if set" },
      { token: "{{#addressline2}} ... {{/addressline2}}", description: "Line 2 — only if set" },
    ],
  },
  {
    title: "Services / Products",
    items: [
      { token: "{{#orgnaisatinservice}} ... {{/orgnaisatinservice}}", description: "Repeat ONE service card only — never put section headers inside this loop" },
      { token: "{{Servicename}}", description: "Service name" },
      { token: "{{prize}}", description: "Price" },
      { token: "{{timetaken}}", description: "Duration (minutes)" },
      { token: "{{notes}}", description: "Description" },
      { token: "{{service_id}}", description: "Service ID (inside service loop)" },
      {
        token: "{{SERVICE_BOOK_URL}}",
        description: "Book link for this service (org + location + service id)",
        example: '<a href="{{SERVICE_BOOK_URL}}" data-appointza-book>Book</a>',
      },
      {
        token: "{{SERVICE_IMAGE_URL}}",
        description: "Full service image URL (inside service loop, when image exists)",
        example:
          '{{#service_image_id}}<img src="{{SERVICE_IMAGE_URL}}" alt="{{Servicename}}" style="max-height:200px;width:100%;object-fit:cover" />{{/service_image_id}}',
      },
      { token: "{{service_image_id}}", description: "Service image (optional — prefer {{SERVICE_IMAGE_URL}})" },
    ],
  },
  {
    title: "Availability / Time Slots",
    items: [
      { token: "{{#OrganisationServiceTiming}} ... {{/OrganisationServiceTiming}}", description: "One row per day" },
      { token: "{{day_name}}", description: "Day name" },
      { token: "{{start_time}}", description: "Opens" },
      { token: "{{end_time}}", description: "Closes" },
    ],
  },
  {
    title: "Events / Schedule",
    items: [
      { token: "{{#hasevents}} ... {{/hasevents}}", description: "Wrap events section — hidden if no events" },
      { token: "{{#events}} ... {{/events}}", description: "One card per event" },
      { token: "{{event_name}}", description: "Event title" },
      { token: "{{event_date}}", description: "Date" },
      { token: "{{entry_amount}}", description: "Ticket price" },
      { token: "{{EVENTBOOKURL}}", description: "Register link" },
      {
        token: "{{EVENT_IMAGE_URL}}",
        description: "Full event image URL (inside events loop)",
        example:
          '{{#event_image_id}}<img src="{{EVENT_IMAGE_URL}}" alt="{{event_name}}" style="max-height:200px;width:100%;object-fit:cover" />{{/event_image_id}}',
      },
    ],
  },
  {
    title: "Testimonials / Reviews",
    items: [
      { token: "{{#reviews}} ... {{/reviews}}", description: "Hidden if no reviews" },
      { token: "{{rating_stars}}", description: "Star rating display" },
      { token: "{{comment}}", description: "Review text" },
    ],
  },
  {
    title: "Amenities",
    items: [
      { token: "{{#facilities}} ... {{/facilities}}", description: "Hidden if no amenities" },
      { token: "{{facility_displaytext}}", description: "Amenity label" },
    ],
  },
  {
    title: "Gallery / Portfolio",
    items: [
      { token: "{{#locationimages}} ... {{/locationimages}}", description: "Hidden if no photos" },
      {
        token: "{{location_image_id}}",
        description: "Gallery photo (inside locationimages loop)",
        example:
          '{{#locationimages}}<img src="{{LOCATION_IMAGE_URL}}" alt="Gallery" style="max-height:220px;width:100%;object-fit:cover" />{{/locationimages}}',
      },
      {
        token: "{{LOCATION_IMAGE_URL}}",
        description: "Full gallery image URL (inside {{#locationimages}} loop)",
      },
    ],
  },
  {
    title: "Videos",
    items: [
      {
        token: "{{#locationvideos}} ... {{/locationvideos}}",
        description: "One video per location; hidden when the location has no video URLs",
      },
      {
        token: "{{LOCATION_VIDEO_EMBED_URL}}",
        description: "Embed-safe YouTube, Vimeo, or hosted-video URL",
        example:
          '{{#locationvideos}}<iframe src="{{LOCATION_VIDEO_EMBED_URL}}" title="Business video" loading="lazy" allowfullscreen></iframe>{{/locationvideos}}',
      },
      {
        token: "{{LOCATION_VIDEO_URL}}",
        description: "Original video URL for a normal link",
      },
    ],
  },
  {
    title: "Contact form",
    items: [
      { token: 'class="az-form"', description: "Contact form — saves enquiries as leads" },
      { token: 'name="name" | email | phone | message"', description: "Required field names" },
    ],
  },
  {
    title: "Images & links",
    items: [
      { token: "{{environment.baseurl}}", description: "Base URL for file images" },
      { token: "data-appointza-book", description: "On Book / Register links" },
    ],
  },
];

export type TemplateBusinessContext = {
  organisationId: number;
  organisationName: string;
  organisationLogoId: number;
  locationId: number;
  locationName: string;
  userEmail?: string;
};

function businessDisplayName(ctx: TemplateBusinessContext): string {
  return ctx.organisationName?.trim() || "Your business";
}

export function buildVariablesReferenceText(): string {
  const lines: string[] = [
    "TEMPLATE VARIABLES REFERENCE",
    "============================",
    "",
    "Syntax: {{variable}} — replaced with live business data when the page is published.",
    "Loops: {{#block}} ... {{/block}} — repeat for each item; entire block hidden if list is empty.",
    "Conditionals: {{#block}} ... {{/block}} — show inner HTML only when that data exists.",
    "",
  ];

  for (const group of TEMPLATE_VARIABLE_GROUPS) {
    lines.push(group.title.toUpperCase());
    lines.push("-".repeat(group.title.length));
    for (const item of group.items) {
      lines.push(`  ${item.token}`);
      lines.push(`    ${item.description}`);
      if (item.example) lines.push(`    Example: ${item.example}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function buildBusinessDataText(ctx: TemplateBusinessContext): string {
  const name = businessDisplayName(ctx);
  const orgId = ctx.organisationId > 0 ? ctx.organisationId : 0;
  const locId = ctx.locationId > 0 ? ctx.locationId : 0;
  const logoId = ctx.organisationLogoId > 0 ? ctx.organisationLogoId : 0;
  const bookPath =
    orgId > 0 && locId > 0
      ? buildBookAppointmentPath(orgId, locId)
      : "/book-appointment/{organisationId}/{locationId}";
  const serviceBookExample =
    orgId > 0 && locId > 0
      ? buildBookAppointmentPath(orgId, locId, 123)
      : "/book-appointment/{organisationId}/{locationId}?serviceId={serviceId}";
  const bookUrl =
    orgId > 0 && locId > 0
      ? `${getUiBaseUrl()}${bookPath}`
      : `${getUiBaseUrl()}/book-appointment/{organisationId}/{locationId}`;
  const apiBase =
    environment.baseurl ||
    (typeof window !== "undefined" ? window.location.origin : "https://appointza.com");
  const logoUrl = logoId > 0 ? `${apiBase}/api/Files/Get?id=${logoId}` : "";

  return [
    "YOUR BUSINESS DATA",
    "==================",
    "",
    `Business name: ${name}`,
    ctx.locationName ? `Location: ${ctx.locationName}` : "",
    ctx.userEmail ? `Email: ${ctx.userEmail}` : "",
    orgId > 0 ? `Organisation ID: ${orgId}` : "",
    locId > 0 ? `Location ID: ${locId}` : "",
    logoId > 0
      ? `Logo file ID: ${logoId}`
      : "Logo: not uploaded — omit the entire {{#organizationlogo}} block",
    logoUrl ? `Logo image URL: ${logoUrl}` : "",
    `General booking page: ${bookUrl}`,
    `Per-service booking (example): ${getUiBaseUrl()}${serviceBookExample}`,
    `Image base URL: ${apiBase}`,
    "",
    "Placeholders like {{organisationdetail.name}} are filled from this profile when the page goes live.",
    "If a section has no data (no events, no gallery photos, no amenities), hide that whole section.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAiTemplatePrompt(_ctx: TemplateBusinessContext): string {
  return [
    "# Appointza Master Prompt",
    "",
    "## OUTPUT",
    "",
    "Return one complete HTML document with embedded CSS only.",
    "",
    "## IMPORTANT",
    "",
    "- Preserve ALL Appointza variables exactly.",
    "- Never invent or rename variables.",
    "- Never hardcode booking URLs.",
    "- Improve only the UI.",
    "- Return HTML only without Markdown or explanations.",
    "",
    "## Variables",
    "",
    "### Organisation",
    "",
    "{{organisationdetail.id}}",
    "{{organisationdetail.name}}",
    "{{organisationdetail.tagline}}",
    "{{organisationdetail.notes}}",
    "{{organisationdetail.organisationlogo}}",
    "{{organisationemail}}",
    "{{currentyear}}",
    "",
    "### Location",
    "",
    "{{locationdetail.id}}",
    "{{locationdetail.name}}",
    "{{locationdetail.addressline1}}",
    "{{locationdetail.addressline2}}",
    "{{locationdetail.city}}",
    "{{locationdetail.state}}",
    "{{locationdetail.country}}",
    "{{locationdetail.pincode}}",
    "{{locationdetail.latitude}}",
    "{{locationdetail.longitude}}",
    "{{locationdetail.googlelocation}}",
    "{{locationdetail.mobile}}",
    "",
    "### Booking",
    "",
    "{{BOOKNOWURL}}",
    "{{EVENTBOOKURL}}",
    "",
    "### Services",
    "",
    "{{#orgnaisatinservice}}",
    "{{Servicename}}",
    "{{prize}}",
    "{{timetaken}}",
    "{{notes}}",
    "{{service_image_id}}",
    "{{/orgnaisatinservice}}",
    "",
    "### Business Hours",
    "",
    "{{#OrganisationServiceTiming}}",
    "{{day_name}}",
    "{{start_time}}",
    "{{end_time}}",
    "{{/OrganisationServiceTiming}}",
    "",
    "### Events",
    "",
    "{{#hasevents}}",
    "{{#events}}",
    "{{event_name}}",
    "{{event_date}}",
    "{{entry_amount}}",
    "{{remainingslot}}",
    "{{description}}",
    "{{/events}}",
    "{{/hasevents}}",
    "",
    "### Gallery",
    "",
    "{{#locationimages}}",
    "{{location_image_id}}",
    "{{/locationimages}}",
    "",
    "### Videos",
    "",
    "{{#locationvideos}}",
    "{{LOCATION_VIDEO_EMBED_URL}}",
    "{{LOCATION_VIDEO_URL}}",
    "{{/locationvideos}}",
    "",
    "### Conditionals",
    "",
    "{{#organizationlogo}}{{/organizationlogo}}",
    "{{#googlemaps}}{{/googlemaps}}",
    "{{#coordinates}}{{/coordinates}}",
    "{{#country}}{{/country}}",
    "{{#addressline2}}{{/addressline2}}",
    "",
    "## Rules",
    "",
    "- Only cards or media items repeat inside loops.",
    "- Never put sections, headings, grids, or outer containers inside loops.",
    "- Use CSS Grid and Flexbox.",
    "- Use a mobile-first responsive design.",
    "- Use a luxury parlour aesthetic.",
    "- Include Hero, About, Services, Gallery, Hours, Events, Videos, Reviews, Contact, and Footer when data is available.",
    "- Never create fake services, events, images, videos, reviews, contact details, or addresses.",
    "- Hide optional sections when their loop has no items.",
    "",
    "### Booking links",
    "",
    "Use:",
    "",
    '<a href="{{BOOKNOWURL}}" data-appointza-book>Book now</a>',
    "",
    "Event registration:",
    "",
    '<a href="{{EVENTBOOKURL}}" data-appointza-book>Register</a>',
    "",
    "Never link booking buttons to `/explore`, `/services`, `#services`, or invented URLs.",
    "",
    "### Logo",
    "",
    "Wrap the logo inside its conditional:",
    "",
    "{{#organizationlogo}}",
    '<img src="{{environment.baseurl}}/api/Files/Get?id={{organisationdetail.organisationlogo}}" alt="{{organisationdetail.name}}">',
    "{{/organizationlogo}}",
    "",
    "### Service image",
    "",
    "Inside each service card use:",
    "",
    '<img src="{{environment.baseurl}}/api/Files/Get?id={{service_image_id}}" alt="{{Servicename}}">',
    "",
    "### Gallery",
    "",
    "Create the Gallery section and grid outside the loop. Repeat only one image inside the loop:",
    "",
    '<section id="gallery">',
    "  <h2>Gallery</h2>",
    '  <div class="gallery-grid">',
    "    {{#locationimages}}",
    '    <img src="{{location_image_id}}" alt="{{organisationdetail.name}} gallery">',
    "    {{/locationimages}}",
    "  </div>",
    "</section>",
    "",
    "### Videos",
    "",
    "Create the Videos section and grid outside the loop. Repeat only one video card inside the loop.",
    "Use `{{LOCATION_VIDEO_EMBED_URL}}` only as the iframe source. Never use `{{LOCATION_VIDEO_URL}}` as the iframe source.",
    "Make video iframes responsive with aspect-ratio 16/9 and width 100%.",
    "",
    "{{#locationvideos}}",
    '<div class="video-card">',
    "  <iframe",
    '    src="{{LOCATION_VIDEO_EMBED_URL}}"',
    '    title="{{organisationdetail.name}} video"',
    '    loading="lazy"',
    '    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"',
    "    allowfullscreen>",
    "  </iframe>",
    '  <a href="{{LOCATION_VIDEO_URL}}" target="_blank" rel="noopener noreferrer">Watch video</a>',
    "</div>",
    "{{/locationvideos}}",
    "",
    "### Map",
    "",
    "Build the map embed from coordinates using `output=embed`. Never use a `/maps/embed?pb=` URL.",
    "Never put `{{locationdetail.googlelocation}}` in an iframe source; it is a link only.",
    "",
    "Map iframe (only inside {{#coordinates}}):",
    "",
    "{{#coordinates}}",
    '<div class="map-wrap">',
    "  <iframe",
    '    title="{{locationdetail.name}} map"',
    '    loading="lazy"',
    '    referrerpolicy="no-referrer-when-downgrade"',
    "    allowfullscreen",
    '    src="https://www.google.com/maps?q={{locationdetail.latitude}},{{locationdetail.longitude}}&output=embed">',
    "  </iframe>",
    "</div>",
    "{{/coordinates}}",
    "",
    "Directions link (only inside {{#googlemaps}}):",
    "",
    "{{#googlemaps}}",
    '<a href="{{locationdetail.googlelocation}}" target="_blank" rel="noopener">View on Google Maps</a>',
    "{{/googlemaps}}",
    "",
    "### Contact form",
    "",
    "The contact form must use:",
    "",
    '<form class="az-form">',
    '  <input name="name" type="text" required>',
    '  <input name="email" type="email" required>',
    '  <input name="phone" type="tel">',
    '  <textarea name="message" required></textarea>',
    '  <button type="submit">Send message</button>',
    "</form>",
    "",
    "## Validation",
    "",
    "- Exactly one Hero.",
    "- Exactly one Services section.",
    "- Exactly one Services grid.",
    "- Only service cards repeat inside the service loop.",
    "- Only gallery images repeat inside the gallery loop.",
    "- Only video cards repeat inside the video loop.",
    "- Map iframe uses output=embed, never pb.",
    "- {{locationdetail.googlelocation}} is used only in an <a href>.",
    "- No nested sections.",
    "- No repeated headings.",
    "- No invented or altered variables.",
    "- No hardcoded booking URLs.",
    "- Return HTML only.",
  ].join("\n");
}

/** AI prompt that returns TemplateBuilderProject JSON (blocks mode). */
export function buildAiBlockTemplatePrompt(ctx: TemplateBusinessContext): string {
  const name = ctx.organisationName?.trim() || "your business";
  const liveBlocks = [
    "appointza-organization — Home / name, logo, Book button (variant 1–4, showLogo)",
    "appointza-location — Address + map + contact (variant 1–4)",
    "appointza-services — Live services catalog (variant 1–4)",
    "appointza-timings — Business hours (variant 1–4)",
    "appointza-events — Public events (variant 1–4)",
    "appointza-reviews — Reviews (variant 1–4)",
    "appointza-facilities — Amenities (variant 1–4)",
    "appointza-location-images — Gallery photos (variant 1–4)",
  ];
  const staticBlocks = [
    "header, hero, hero-2, hero-3, hero-4, hero-5, hero-6",
    "about, features, stats, logos, timeline",
    "pricing, membership, media, gallery, testimonials",
    "cta-booking, time-slots, live-status",
    "form, map, social, faq, team, offers, footer",
  ];

  return [
    "# Appointza Blocks Master Prompt",
    "",
    `Design a booking page for "${name}" as a block project JSON (not free-form HTML).`,
    "",
    "## OUTPUT",
    "",
    "Return ONLY valid JSON matching this shape (no Markdown fences, no commentary):",
    "",
    "{",
    '  "builderVersion": 2,',
    '  "pages": {',
    '    "home": {',
    '      "id": "home",',
    '      "name": "Home",',
    '      "blocks": [',
    "        {",
    '          "id": "unique-string",',
    '          "type": "block-type",',
    '          "visible": true,',
    '          "data": {}',
    "        }",
    "      ]",
    "    }",
    "  }",
    "}",
    "",
    "## IMPORTANT",
    "",
    "- Prefer live `appointza-*` blocks for real business data.",
    "- Do not invent services, prices, photos, reviews, or addresses inside block data.",
    "- For live blocks, `data` may only include layout flags (e.g. variant, showLogo).",
    "- For static blocks, you may edit marketing copy in `data`, and may use {{variables}} in text fields.",
    "- Every block needs a unique `id`, a known `type`, `visible: true`, and a `data` object.",
    "- Order blocks top-to-bottom for a complete page.",
    "- Return JSON only.",
    "",
    "## Recommended page order",
    "",
    "1. header",
    "2. appointza-organization (or hero)",
    "3. about (optional)",
    "4. appointza-services",
    "5. appointza-location-images",
    "6. appointza-timings",
    "7. appointza-events (optional)",
    "8. appointza-facilities (optional)",
    "9. appointza-reviews (optional)",
    "10. appointza-location",
    "11. cta-booking or form",
    "12. footer",
    "",
    "## Allowed live block types",
    "",
    ...liveBlocks.map((line) => `- ${line}`),
    "",
    "## Allowed static block types",
    "",
    ...staticBlocks.map((line) => `- ${line}`),
    "",
    "## Example live block",
    "",
    "{",
    '  "id": "appointza-services-1",',
    '  "type": "appointza-services",',
    '  "visible": true,',
    '  "data": { "variant": 2 }',
    "}",
    "",
    "## Example static hero",
    "",
    "{",
    '  "id": "hero-1",',
    '  "type": "hero",',
    '  "visible": true,',
    '  "data": {',
    '    "title": "{{organisationdetail.name}}",',
    '    "subtitle": "{{organisationdetail.tagline}}",',
    '    "buttonText": "Book appointment",',
    '    "useLiveBookUrl": true',
    "  }",
    "}",
    "",
    "## Validation",
    "",
    "- builderVersion must be 2",
    "- pages.home.blocks must be a non-empty array",
    "- Use only allowed block types",
    "- No invented variables or hardcoded booking URLs",
    "- Return JSON only",
  ].join("\n");
}
