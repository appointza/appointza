// Catalog of section blocks for the visual Template Builder.
//
// Each section may have multiple block variants ("blocks"). The user picks one
// variant per enabled section, the builder concatenates the chosen HTML
// fragments in order, wraps them inside `wrapTemplateHtml`, and stores the
// result in `referencevalues.description` (referencetypeid = 5).
//
// All placeholders use the same Mustache-style tokens that
// `utils/templateRenderer.util.ts` already understands at runtime, so the
// final page can be rendered by `DynamicTemplatePage` without any extra work.

export interface TemplateBlock {
    /** Stable id, e.g. "hero-card", "services-grid". */
    id: string;
    /** Short label shown next to the radio button. */
    label: string;
    /** One-line description shown under the label. */
    description: string;
    /** HTML fragment using {{...}} placeholders. */
    html: string;
}

export interface TemplateSection {
    /** Stable id used as the wrapper element id. */
    id: string;
    /** Display name in the builder sidebar. */
    title: string;
    /** Short helper text shown under the section title. */
    description: string;
    /** Lucide icon name (rendered by the page). */
    icon: string;
    /** Available variants. The first one is the default. */
    blocks: TemplateBlock[];
    /** Whether the section is enabled by default. */
    defaultEnabled?: boolean;
}

const PRIMARY = "#1AAFCC";
const ACCENT = "#F04E98";

/** Wraps a full HTML document around the assembled section fragments. */
export function wrapTemplateHtml(bodyHtml: string, title: string): string {
    const safeTitle = title?.trim() || "{{organisationdetail.name}}";
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
    <style>
        :root { --brand-primary: ${PRIMARY}; --brand-accent: ${ACCENT}; }
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1f2937; margin: 0; background: #fff; }
        section { padding: 64px 0; }
        h1, h2, h3, h4 { font-weight: 700; color: #0f172a; }
        .btn-brand { background: var(--brand-primary); color: #fff; border: none; padding: 12px 28px; border-radius: 999px; font-weight: 600; }
        .btn-accent { background: var(--brand-accent); color: #fff; border: none; padding: 12px 28px; border-radius: 999px; font-weight: 600; }
        .btn-brand:hover, .btn-accent:hover { filter: brightness(1.05); color: #fff; }
        .price { font-size: 1.5rem; font-weight: 700; color: var(--brand-primary); }
        .service-card, .feature-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; padding: 20px; margin-bottom: 16px; }
        .badge-pill { background: rgba(26, 175, 204, 0.15); color: var(--brand-primary); border-radius: 999px; padding: 4px 12px; font-size: 0.75rem; font-weight: 600; }
        .gallery-image { width: 100%; height: 180px; object-fit: cover; border-radius: 14px; }
        .section-eyebrow { color: var(--brand-primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.8rem; }
        .footer-bar { background: #0f172a; color: #cbd5e1; padding: 32px 0; }
        .footer-bar a { color: #cbd5e1; text-decoration: none; margin-right: 16px; }
        .float-cta { position: fixed; right: 18px; z-index: 999; width: 56px; height: 56px; border-radius: 999px; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 12px 30px rgba(0,0,0,0.18); }
    </style>
</head>
<body>
${bodyHtml}
<script>
// Forward booking-link clicks to the parent app so it can route to
// /book-appointment/:org/:loc (see DynamicTemplatePage.tsx).
(function(){
    document.addEventListener('click', function(ev){
        var a = ev.target && (ev.target.closest && ev.target.closest('a[data-appointza-book]'));
        if (!a) return;
        ev.preventDefault();
        var url = a.getAttribute('href') || '';
        try { window.parent.postMessage({ type: 'appointza:booking-nav', url: url }, '*'); } catch(_) {}
    });
})();
</script>
</body>
</html>`;
}

export const SECTION_CATALOG: TemplateSection[] = [
    {
        id: "home",
        title: "Home (Hero)",
        description: "The top banner with the business name and main call-to-action.",
        icon: "Home",
        defaultEnabled: true,
        blocks: [
            {
                id: "hero-centered",
                label: "Centered hero",
                description: "Big centered title with tagline and primary action.",
                html: `<section id="home" style="background: linear-gradient(135deg, ${PRIMARY} 0%, ${ACCENT} 100%); color: #fff; text-align: center;">
  <div class="container">
    <h1 class="display-4 mb-3" style="color:#fff;">{{organisationdetail.name}}</h1>
    <p class="lead mb-4" style="opacity:0.9;">{{organisationdetail.tagline}}</p>
    <a href="/book-appointment/{{organisationdetail.id}}/{{locationdetail.id}}" data-appointza-book class="btn btn-light btn-brand" style="background:#fff;color:var(--brand-primary);">Book Appointment</a>
  </div>
</section>`,
            },
            {
                id: "hero-split",
                label: "Split hero",
                description: "Text on the left, illustration on the right.",
                html: `<section id="home" style="background:#f8fafc;">
  <div class="container">
    <div class="row align-items-center g-5">
      <div class="col-md-6">
        <span class="section-eyebrow">Welcome to</span>
        <h1 class="display-5 mb-3">{{organisationdetail.name}}</h1>
        <p class="lead text-muted mb-4">{{organisationdetail.tagline}}</p>
        <a href="/book-appointment/{{organisationdetail.id}}/{{locationdetail.id}}" data-appointza-book class="btn btn-brand">Book now</a>
      </div>
      <div class="col-md-6 text-center">
        <img src="{{environment.baseurl}}/api/Files/Get?id={{locationdetail.images.0}}" alt="Hero" style="max-width:100%;border-radius:24px;box-shadow:0 24px 60px rgba(15,23,42,0.12);" onerror="this.style.display='none'" />
      </div>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "about",
        title: "About Us",
        description: "Short story about the business.",
        icon: "Info",
        defaultEnabled: true,
        blocks: [
            {
                id: "about-card",
                label: "Centered card",
                description: "Single centered paragraph with eyebrow heading.",
                html: `<section id="about">
  <div class="container text-center">
    <span class="section-eyebrow">About us</span>
    <h2 class="mb-3">Who we are</h2>
    <p class="text-muted mx-auto" style="max-width:720px;">{{organisationdetail.tagline}} We serve customers from {{locationdetail.city}}, {{locationdetail.state}} with a focus on quality, care and consistency.</p>
  </div>
</section>`,
            },
            {
                id: "about-stats",
                label: "About + key stats",
                description: "Paragraph plus three quick numbers.",
                html: `<section id="about" style="background:#f8fafc;">
  <div class="container">
    <div class="row align-items-center g-5">
      <div class="col-md-7">
        <span class="section-eyebrow">About us</span>
        <h2 class="mb-3">Built around your appointments</h2>
        <p class="text-muted">{{organisationdetail.tagline}} Based in {{locationdetail.city}}, we help customers find the right time and the right service quickly.</p>
      </div>
      <div class="col-md-5">
        <div class="row g-3 text-center">
          <div class="col-4"><div class="feature-card"><h3 class="mb-0" style="color:var(--brand-primary);">10k+</h3><small class="text-muted">Bookings</small></div></div>
          <div class="col-4"><div class="feature-card"><h3 class="mb-0" style="color:var(--brand-primary);">4.8★</h3><small class="text-muted">Avg rating</small></div></div>
          <div class="col-4"><div class="feature-card"><h3 class="mb-0" style="color:var(--brand-primary);">24/7</h3><small class="text-muted">Online</small></div></div>
        </div>
      </div>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "services",
        title: "Services",
        description: "All services pulled from your service catalog.",
        icon: "Sparkles",
        defaultEnabled: true,
        blocks: [
            {
                id: "services-list",
                label: "List with price + duration",
                description: "One service per row.",
                html: `<section id="services">
  <div class="container">
    <span class="section-eyebrow">Services</span>
    <h2 class="mb-4">What we offer</h2>
    {{#orgnaisatinservice}}
    <div class="service-card">
      <div class="row align-items-center">
        <div class="col-md-8">
          <h4 class="fw-bold mb-1">{{Servicename}}</h4>
          <p class="text-muted mb-0">{{notes}}</p>
        </div>
        <div class="col-md-4 text-md-end mt-3 mt-md-0">
          <div class="price">₹{{prize}}</div>
          <span class="badge-pill">{{timetaken}} min</span>
        </div>
      </div>
    </div>
    {{/orgnaisatinservice}}
  </div>
</section>`,
            },
            {
                id: "services-grid",
                label: "3-column grid",
                description: "Tile layout, great for catalogues.",
                html: `<section id="services" style="background:#f8fafc;">
  <div class="container">
    <span class="section-eyebrow">Services</span>
    <h2 class="mb-4">Our service catalog</h2>
    <div class="row g-4">
      {{#orgnaisatinservice}}
      <div class="col-md-4">
        <div class="service-card h-100">
          <h4 class="fw-bold">{{Servicename}}</h4>
          <p class="text-muted">{{notes}}</p>
          <div class="d-flex justify-content-between align-items-center">
            <div class="price">₹{{prize}}</div>
            <span class="badge-pill">{{timetaken}} min</span>
          </div>
        </div>
      </div>
      {{/orgnaisatinservice}}
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "pricing",
        title: "Pricing",
        description: "Service catalog presented as price tiers.",
        icon: "Tag",
        blocks: [
            {
                id: "pricing-table",
                label: "Simple pricing table",
                description: "Two-column rows: service and price.",
                html: `<section id="pricing">
  <div class="container">
    <span class="section-eyebrow">Pricing</span>
    <h2 class="mb-4">Transparent pricing</h2>
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <table class="table align-middle">
          <thead><tr><th>Service</th><th>Duration</th><th class="text-end">Price</th></tr></thead>
          <tbody>
            {{#orgnaisatinservice}}
            <tr>
              <td><strong>{{Servicename}}</strong><br/><small class="text-muted">{{notes}}</small></td>
              <td>{{timetaken}} min</td>
              <td class="text-end price">₹{{prize}}</td>
            </tr>
            {{/orgnaisatinservice}}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>`,
            },
            {
                id: "pricing-cards",
                label: "Pricing cards",
                description: "Highlight cards per service.",
                html: `<section id="pricing" style="background:#f8fafc;">
  <div class="container">
    <span class="section-eyebrow">Pricing</span>
    <h2 class="mb-4">Choose what you need</h2>
    <div class="row g-4">
      {{#orgnaisatinservice}}
      <div class="col-md-4">
        <div class="feature-card text-center h-100">
          <h4>{{Servicename}}</h4>
          <div class="price my-3">₹{{prize}}</div>
          <p class="text-muted">{{notes}}</p>
          <span class="badge-pill">{{timetaken}} min</span>
        </div>
      </div>
      {{/orgnaisatinservice}}
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "booking",
        title: "Booking / Appointment",
        description: "Strong call-to-action that opens the booking flow.",
        icon: "CalendarPlus",
        defaultEnabled: true,
        blocks: [
            {
                id: "booking-cta",
                label: "Full-width CTA banner",
                description: "Bold banner with a single Book now button.",
                html: `<section id="booking" style="background:linear-gradient(135deg, ${PRIMARY} 0%, ${ACCENT} 100%); color:#fff;">
  <div class="container text-center">
    <h2 class="mb-3" style="color:#fff;">Ready to book?</h2>
    <p class="lead mb-4" style="opacity:0.9;">Pick a service and a time that works for you. Confirmation in seconds.</p>
    <a href="/book-appointment/{{organisationdetail.id}}/{{locationdetail.id}}" data-appointza-book class="btn btn-light" style="background:#fff;color:var(--brand-primary);font-weight:600;padding:12px 32px;border-radius:999px;">Book your appointment</a>
  </div>
</section>`,
            },
            {
                id: "booking-split",
                label: "Side-by-side",
                description: "Short pitch with a CTA on the right.",
                html: `<section id="booking">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-md-8">
        <span class="section-eyebrow">Book now</span>
        <h2 class="mb-2">Slots are filling up fast</h2>
        <p class="text-muted mb-0">Reserve your appointment online in under a minute.</p>
      </div>
      <div class="col-md-4 text-md-end mt-3 mt-md-0">
        <a href="/book-appointment/{{organisationdetail.id}}/{{locationdetail.id}}" data-appointza-book class="btn btn-brand">Book appointment</a>
      </div>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "time-slot",
        title: "Time Slot Availability",
        description: "Explains how the customer sees live slots.",
        icon: "CalendarClock",
        blocks: [
            {
                id: "slots-info",
                label: "Info block",
                description: "Static explainer with a CTA.",
                html: `<section id="time-slot" style="background:#f8fafc;">
  <div class="container text-center">
    <span class="section-eyebrow">Real-time</span>
    <h2 class="mb-3">Live slot availability</h2>
    <p class="text-muted mx-auto mb-4" style="max-width:620px;">Choose any of our services and instantly see the next available time slots. No back-and-forth on the phone.</p>
    <a href="/book-appointment/{{organisationdetail.id}}/{{locationdetail.id}}" data-appointza-book class="btn btn-brand">Check available slots</a>
  </div>
</section>`,
            },
            {
                id: "slots-week",
                label: "Working-hours grid",
                description: "Shows weekly working hours.",
                html: `<section id="time-slot">
  <div class="container">
    <span class="section-eyebrow">Availability</span>
    <h2 class="mb-4">When you can book</h2>
    <div class="row g-3">
      {{#OrganisationServiceTiming}}
      <div class="col-md-6 col-lg-4">
        <div class="feature-card d-flex justify-content-between align-items-center">
          <span class="fw-semibold">Day {{day_of_week}}</span>
          <span style="color:var(--brand-primary);font-weight:600;">{{start_time}} – {{end_time}}</span>
        </div>
      </div>
      {{/OrganisationServiceTiming}}
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "gallery",
        title: "Gallery",
        description: "Photos uploaded for this location.",
        icon: "Image",
        blocks: [
            {
                id: "gallery-grid",
                label: "3-column grid",
                description: "Even grid of all images.",
                html: `<section id="gallery" style="background:#f8fafc;">
  <div class="container">
    <span class="section-eyebrow">Gallery</span>
    <h2 class="mb-4">A look around</h2>
    <div class="row g-3">
      {{#each locationdetail.images}}
      <div class="col-md-4 col-6">
        <img src="{{environment.baseurl}}/api/Files/Get?id={{this}}" alt="Gallery" class="gallery-image" onerror="this.style.display='none'" />
      </div>
      {{/each}}
    </div>
  </div>
</section>`,
            },
            {
                id: "gallery-masonry",
                label: "Masonry strip",
                description: "Horizontal strip, useful for fewer photos.",
                html: `<section id="gallery">
  <div class="container">
    <span class="section-eyebrow">Gallery</span>
    <h2 class="mb-4">Snapshots</h2>
    <div class="d-flex flex-wrap gap-3 justify-content-center">
      {{#each locationdetail.images}}
      <img src="{{environment.baseurl}}/api/Files/Get?id={{this}}" alt="Gallery" style="width:220px;height:160px;object-fit:cover;border-radius:14px;" onerror="this.style.display='none'" />
      {{/each}}
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "amenities",
        title: "Amenities",
        description: "Quick list of facilities customers care about.",
        icon: "Wifi",
        blocks: [
            {
                id: "amenities-icons",
                label: "Icon grid",
                description: "Six common amenities with icons.",
                html: `<section id="amenities">
  <div class="container">
    <span class="section-eyebrow">Amenities</span>
    <h2 class="mb-4">What's available on site</h2>
    <div class="row g-3 text-center">
      <div class="col-md-2 col-4"><div class="feature-card"><i class="fa-solid fa-wifi fa-2x" style="color:var(--brand-primary)"></i><div class="mt-2 small">Free Wi-Fi</div></div></div>
      <div class="col-md-2 col-4"><div class="feature-card"><i class="fa-solid fa-square-parking fa-2x" style="color:var(--brand-primary)"></i><div class="mt-2 small">Parking</div></div></div>
      <div class="col-md-2 col-4"><div class="feature-card"><i class="fa-solid fa-wheelchair fa-2x" style="color:var(--brand-primary)"></i><div class="mt-2 small">Accessible</div></div></div>
      <div class="col-md-2 col-4"><div class="feature-card"><i class="fa-solid fa-mug-hot fa-2x" style="color:var(--brand-primary)"></i><div class="mt-2 small">Refreshments</div></div></div>
      <div class="col-md-2 col-4"><div class="feature-card"><i class="fa-solid fa-shower fa-2x" style="color:var(--brand-primary)"></i><div class="mt-2 small">Restrooms</div></div></div>
      <div class="col-md-2 col-4"><div class="feature-card"><i class="fa-solid fa-credit-card fa-2x" style="color:var(--brand-primary)"></i><div class="mt-2 small">Card payments</div></div></div>
    </div>
  </div>
</section>`,
            },
            {
                id: "amenities-list",
                label: "Two-column checklist",
                description: "Plain checklist style.",
                html: `<section id="amenities" style="background:#f8fafc;">
  <div class="container">
    <span class="section-eyebrow">Amenities</span>
    <h2 class="mb-4">What's included</h2>
    <div class="row">
      <div class="col-md-6">
        <ul class="list-unstyled">
          <li class="mb-2">✅ Free customer Wi-Fi</li>
          <li class="mb-2">✅ Comfortable seating area</li>
          <li class="mb-2">✅ Card &amp; UPI payments</li>
        </ul>
      </div>
      <div class="col-md-6">
        <ul class="list-unstyled">
          <li class="mb-2">✅ Air-conditioned interiors</li>
          <li class="mb-2">✅ On-site parking</li>
          <li class="mb-2">✅ Accessible entrance</li>
        </ul>
      </div>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "membership",
        title: "Membership Plans",
        description: "Promote recurring memberships.",
        icon: "BadgeCheck",
        blocks: [
            {
                id: "membership-3-tier",
                label: "Three-tier cards",
                description: "Bronze / Silver / Gold pattern.",
                html: `<section id="membership">
  <div class="container">
    <span class="section-eyebrow">Membership</span>
    <h2 class="mb-4">Save more with a membership</h2>
    <div class="row g-4">
      <div class="col-md-4"><div class="feature-card text-center h-100"><h4>Silver</h4><div class="price my-3">₹999/mo</div><p class="text-muted">4 visits / month at member rates.</p><a href="#booking" class="btn btn-brand">Join Silver</a></div></div>
      <div class="col-md-4"><div class="feature-card text-center h-100" style="border:2px solid var(--brand-primary);"><h4>Gold</h4><div class="price my-3">₹1,799/mo</div><p class="text-muted">8 visits + 10% off add-ons.</p><a href="#booking" class="btn btn-brand">Join Gold</a></div></div>
      <div class="col-md-4"><div class="feature-card text-center h-100"><h4>Platinum</h4><div class="price my-3">₹2,999/mo</div><p class="text-muted">Unlimited visits + priority booking.</p><a href="#booking" class="btn btn-brand">Join Platinum</a></div></div>
    </div>
  </div>
</section>`,
            },
            {
                id: "membership-single",
                label: "Single highlighted plan",
                description: "Just one plan, large CTA.",
                html: `<section id="membership" style="background:#f8fafc;">
  <div class="container text-center">
    <span class="section-eyebrow">Membership</span>
    <h2 class="mb-3">Monthly membership</h2>
    <p class="text-muted mx-auto mb-4" style="max-width:540px;">Unlock priority booking, member-only pricing, and bonus services every single month.</p>
    <div class="feature-card mx-auto" style="max-width:360px;">
      <div class="price mb-2">₹1,499/mo</div>
      <ul class="list-unstyled text-start text-muted">
        <li>✓ Priority appointments</li>
        <li>✓ 15% off every service</li>
        <li>✓ Free monthly add-on</li>
      </ul>
      <a href="#booking" class="btn btn-brand w-100">Become a member</a>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "offers",
        title: "Offers & Discounts",
        description: "Limited-time deals.",
        icon: "Percent",
        blocks: [
            {
                id: "offers-banner",
                label: "Promo banner",
                description: "Single dark banner with code.",
                html: `<section id="offers" style="background:#0f172a;color:#fff;">
  <div class="container text-center">
    <span class="section-eyebrow" style="color:#fbbf24;">Limited time</span>
    <h2 class="mb-3" style="color:#fff;">Save 20% on your first visit</h2>
    <p class="mb-4" style="opacity:0.85;">Use code <strong style="color:#fbbf24;">APPOINTZA20</strong> at checkout. Valid this month only.</p>
    <a href="#booking" class="btn btn-light" style="background:#fff;color:#0f172a;font-weight:600;border-radius:999px;padding:12px 32px;">Claim offer</a>
  </div>
</section>`,
            },
            {
                id: "offers-3-cards",
                label: "Offer cards",
                description: "Three concurrent offers side by side.",
                html: `<section id="offers">
  <div class="container">
    <span class="section-eyebrow">Offers</span>
    <h2 class="mb-4">What's on right now</h2>
    <div class="row g-4">
      <div class="col-md-4"><div class="feature-card h-100"><h5>First-time guest</h5><p class="text-muted mb-2">20% off your first appointment.</p><span class="badge-pill">NEW20</span></div></div>
      <div class="col-md-4"><div class="feature-card h-100"><h5>Refer a friend</h5><p class="text-muted mb-2">₹200 credit when they book.</p><span class="badge-pill">FRIEND200</span></div></div>
      <div class="col-md-4"><div class="feature-card h-100"><h5>Weekday saver</h5><p class="text-muted mb-2">10% off Mon-Wed slots.</p><span class="badge-pill">WEEK10</span></div></div>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "packages",
        title: "Packages",
        description: "Bundled services at a fixed price.",
        icon: "Boxes",
        blocks: [
            {
                id: "packages-cards",
                label: "Package cards",
                description: "Three flagship packages.",
                html: `<section id="packages" style="background:#f8fafc;">
  <div class="container">
    <span class="section-eyebrow">Packages</span>
    <h2 class="mb-4">Bundled value</h2>
    <div class="row g-4">
      <div class="col-md-4"><div class="feature-card h-100"><h5>Starter pack</h5><p class="text-muted">3 sessions, valid 30 days.</p><div class="price">₹1,499</div></div></div>
      <div class="col-md-4"><div class="feature-card h-100"><h5>Family pack</h5><p class="text-muted">5 sessions for 2 family members.</p><div class="price">₹3,499</div></div></div>
      <div class="col-md-4"><div class="feature-card h-100"><h5>Pro pack</h5><p class="text-muted">10 sessions + 1 free add-on.</p><div class="price">₹5,999</div></div></div>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "events",
        title: "Events / Tournaments",
        description: "Upcoming public events for this location.",
        icon: "Trophy",
        blocks: [
            {
                id: "events-list",
                label: "Event list",
                description: "Looped list of public events.",
                html: `<section id="events">
  <div class="container">
    <span class="section-eyebrow">Events</span>
    <h2 class="mb-4">What's coming up</h2>
    {{#events}}
    <div class="service-card">
      <div class="row align-items-center">
        <div class="col-md-9">
          <h4 class="fw-bold mb-1">{{name}}</h4>
          <p class="text-muted mb-0">{{description}}</p>
        </div>
        <div class="col-md-3 text-md-end mt-3 mt-md-0">
          <a href="/user/events/{{id}}/book" data-appointza-book class="btn btn-brand">Register</a>
        </div>
      </div>
    </div>
    {{/events}}
  </div>
</section>`,
            },
        ],
    },
    {
        id: "trainers",
        title: "Trainers / Staff",
        description: "Showcase your team.",
        icon: "Users",
        blocks: [
            {
                id: "staff-cards",
                label: "Avatar cards",
                description: "Generic 3-up staff cards (placeholder content).",
                html: `<section id="trainers" style="background:#f8fafc;">
  <div class="container">
    <span class="section-eyebrow">Our team</span>
    <h2 class="mb-4">Meet the experts</h2>
    <div class="row g-4">
      <div class="col-md-4 text-center"><div class="feature-card"><div class="rounded-circle mx-auto mb-3" style="width:96px;height:96px;background:${PRIMARY};display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;font-weight:700;">A</div><h5 class="mb-1">Lead specialist</h5><p class="text-muted small">10+ years experience</p></div></div>
      <div class="col-md-4 text-center"><div class="feature-card"><div class="rounded-circle mx-auto mb-3" style="width:96px;height:96px;background:${ACCENT};display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;font-weight:700;">B</div><h5 class="mb-1">Senior trainer</h5><p class="text-muted small">Certified expert</p></div></div>
      <div class="col-md-4 text-center"><div class="feature-card"><div class="rounded-circle mx-auto mb-3" style="width:96px;height:96px;background:${PRIMARY};display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;font-weight:700;">C</div><h5 class="mb-1">Client success</h5><p class="text-muted small">Bookings &amp; onboarding</p></div></div>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "reviews",
        title: "Customer Reviews",
        description: "Social proof.",
        icon: "Star",
        blocks: [
            {
                id: "reviews-3",
                label: "Three testimonials",
                description: "Quote cards with a 5-star line.",
                html: `<section id="reviews">
  <div class="container">
    <span class="section-eyebrow">Reviews</span>
    <h2 class="mb-4">What our customers say</h2>
    <div class="row g-4">
      <div class="col-md-4"><div class="feature-card h-100"><div class="mb-2" style="color:#f59e0b;">★★★★★</div><p class="text-muted">“Effortless booking and the experience was top-notch.”</p><strong>Aishwarya R.</strong></div></div>
      <div class="col-md-4"><div class="feature-card h-100"><div class="mb-2" style="color:#f59e0b;">★★★★★</div><p class="text-muted">“The team is super friendly and respects your time.”</p><strong>Karthik S.</strong></div></div>
      <div class="col-md-4"><div class="feature-card h-100"><div class="mb-2" style="color:#f59e0b;">★★★★★</div><p class="text-muted">“My new go-to. Highly recommend the membership.”</p><strong>Priya V.</strong></div></div>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "faq",
        title: "FAQ",
        description: "Answers to common questions.",
        icon: "HelpCircle",
        blocks: [
            {
                id: "faq-accordion",
                label: "Accordion",
                description: "Bootstrap accordion.",
                html: `<section id="faq" style="background:#f8fafc;">
  <div class="container">
    <span class="section-eyebrow">FAQ</span>
    <h2 class="mb-4">Frequently asked questions</h2>
    <div class="accordion" id="faqAccordion">
      <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button" data-bs-toggle="collapse" data-bs-target="#q1">How do I book an appointment?</button></h2><div id="q1" class="accordion-collapse collapse show" data-bs-parent="#faqAccordion"><div class="accordion-body text-muted">Pick a service from the menu, choose a time slot, and confirm. You'll receive an instant confirmation.</div></div></div>
      <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#q2">Can I reschedule or cancel?</button></h2><div id="q2" class="accordion-collapse collapse" data-bs-parent="#faqAccordion"><div class="accordion-body text-muted">Yes — see our cancellation policy below. Free reschedule up to 12 hours before the slot.</div></div></div>
      <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#q3">Do you accept walk-ins?</button></h2><div id="q3" class="accordion-collapse collapse" data-bs-parent="#faqAccordion"><div class="accordion-body text-muted">Booked slots are prioritised. Walk-ins are accepted subject to availability.</div></div></div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "contact",
        title: "Contact Us",
        description: "Phone, email, address.",
        icon: "Mail",
        defaultEnabled: true,
        blocks: [
            {
                id: "contact-grid",
                label: "Three-column contact",
                description: "Phone / Email / Address tiles.",
                html: `<section id="contact">
  <div class="container">
    <span class="section-eyebrow">Contact</span>
    <h2 class="mb-4">Get in touch</h2>
    <div class="row g-4">
      <div class="col-md-4"><div class="feature-card text-center h-100"><i class="fa-solid fa-phone fa-2x mb-2" style="color:var(--brand-primary)"></i><h5>Call us</h5><p class="text-muted">{{locationdetail.phone}}</p></div></div>
      <div class="col-md-4"><div class="feature-card text-center h-100"><i class="fa-solid fa-envelope fa-2x mb-2" style="color:var(--brand-primary)"></i><h5>Email</h5><p class="text-muted">{{locationdetail.email}}</p></div></div>
      <div class="col-md-4"><div class="feature-card text-center h-100"><i class="fa-solid fa-location-dot fa-2x mb-2" style="color:var(--brand-primary)"></i><h5>Visit</h5><p class="text-muted">{{locationdetail.addressline1}}<br/>{{locationdetail.city}}, {{locationdetail.state}}</p></div></div>
    </div>
  </div>
</section>`,
            },
            {
                id: "contact-form",
                label: "Inline contact form",
                description: "Static form (preview only).",
                html: `<section id="contact" style="background:#f8fafc;">
  <div class="container">
    <span class="section-eyebrow">Contact</span>
    <h2 class="mb-4">Send us a message</h2>
    <form class="row g-3" onsubmit="event.preventDefault(); alert('Thanks! We will get back to you.');">
      <div class="col-md-6"><input class="form-control" placeholder="Your name" required></div>
      <div class="col-md-6"><input class="form-control" type="email" placeholder="Email" required></div>
      <div class="col-12"><textarea class="form-control" rows="4" placeholder="Message" required></textarea></div>
      <div class="col-12"><button class="btn btn-brand" type="submit">Send message</button></div>
    </form>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "map",
        title: "Location / Google Map",
        description: "Embedded map of the business address.",
        icon: "MapPin",
        blocks: [
            {
                id: "map-embed",
                label: "Embedded map",
                description: "Standard Google Maps query embed.",
                html: `<section id="map">
  <div class="container">
    <span class="section-eyebrow">Find us</span>
    <h2 class="mb-4">{{locationdetail.addressline1}}, {{locationdetail.city}}</h2>
    <div style="border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
      <iframe width="100%" height="380" frameborder="0" style="border:0" loading="lazy"
        src="https://www.google.com/maps?q={{locationdetail.addressline1}},{{locationdetail.city}},{{locationdetail.state}}&output=embed"></iframe>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "hours",
        title: "Working Hours",
        description: "Day-by-day opening hours from your schedule.",
        icon: "Clock",
        blocks: [
            {
                id: "hours-grid",
                label: "Grid",
                description: "Tile per weekday.",
                html: `<section id="hours" style="background:#f8fafc;">
  <div class="container">
    <span class="section-eyebrow">Working hours</span>
    <h2 class="mb-4">When we're open</h2>
    <div class="row g-3">
      {{#OrganisationServiceTiming}}
      <div class="col-md-6 col-lg-4">
        <div class="feature-card d-flex justify-content-between align-items-center">
          <span class="fw-semibold">Day {{day_of_week}}</span>
          <span style="color:var(--brand-primary);font-weight:600;">{{start_time}} – {{end_time}}</span>
        </div>
      </div>
      {{/OrganisationServiceTiming}}
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "whatsapp",
        title: "WhatsApp Chat",
        description: "Floating WhatsApp button.",
        icon: "MessageCircle",
        blocks: [
            {
                id: "whatsapp-floating",
                label: "Floating button",
                description: "Fixed bottom-right WhatsApp action.",
                html: `<a href="https://wa.me/{{locationdetail.phone}}" target="_blank" class="float-cta" style="background:#25D366;bottom:88px;" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp" style="font-size:24px;"></i></a>`,
            },
        ],
    },
    {
        id: "call",
        title: "Call Button",
        description: "Floating phone button.",
        icon: "Phone",
        blocks: [
            {
                id: "call-floating",
                label: "Floating call",
                description: "Fixed bottom-right phone action.",
                html: `<a href="tel:{{locationdetail.phone}}" class="float-cta" style="background:var(--brand-primary);bottom:24px;" aria-label="Call"><i class="fa-solid fa-phone" style="font-size:22px;"></i></a>`,
            },
        ],
    },
    {
        id: "payment",
        title: "Online Payment",
        description: "Reassures customers about accepted payments.",
        icon: "CreditCard",
        blocks: [
            {
                id: "payment-info",
                label: "Payment methods badges",
                description: "Logos + short note.",
                html: `<section id="payment">
  <div class="container text-center">
    <span class="section-eyebrow">Online payment</span>
    <h2 class="mb-3">Pay securely online</h2>
    <p class="text-muted mb-4">We accept cards, UPI, net banking and major wallets. Your payment is processed over an encrypted Razorpay connection.</p>
    <div class="d-flex justify-content-center flex-wrap gap-3">
      <span class="badge-pill">UPI</span>
      <span class="badge-pill">Visa / Mastercard</span>
      <span class="badge-pill">RuPay</span>
      <span class="badge-pill">Net banking</span>
      <span class="badge-pill">Wallets</span>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "cancellation",
        title: "Cancellation Policy",
        description: "Set expectations for reschedules.",
        icon: "Ban",
        blocks: [
            {
                id: "cancel-text",
                label: "Inline policy",
                description: "Two short paragraphs.",
                html: `<section id="cancellation" style="background:#f8fafc;">
  <div class="container">
    <span class="section-eyebrow">Cancellation</span>
    <h2 class="mb-3">Reschedule &amp; cancellation policy</h2>
    <p class="text-muted">Free reschedule or cancellation up to <strong>12 hours</strong> before the slot. After that, the booking is non-refundable but can still be moved to another time within 7 days.</p>
    <p class="text-muted mb-0">No-shows are charged the booking fee in full to free up the slot for other customers.</p>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "terms",
        title: "Terms & Conditions",
        description: "Short summary with a link to the full T&C.",
        icon: "FileText",
        blocks: [
            {
                id: "terms-summary",
                label: "Inline summary",
                description: "One paragraph + link.",
                html: `<section id="terms">
  <div class="container">
    <span class="section-eyebrow">Terms</span>
    <h2 class="mb-3">Terms &amp; conditions</h2>
    <p class="text-muted mb-2">By booking with {{organisationdetail.name}} you agree to our service terms, payment terms and reschedule policy.</p>
    <a href="/terms" target="_blank" class="btn btn-brand">Read full terms</a>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "privacy",
        title: "Privacy Policy",
        description: "Reassurance about data handling.",
        icon: "Shield",
        blocks: [
            {
                id: "privacy-summary",
                label: "Inline summary",
                description: "Short blurb + link.",
                html: `<section id="privacy" style="background:#f8fafc;">
  <div class="container">
    <span class="section-eyebrow">Privacy</span>
    <h2 class="mb-3">Your data is safe with us</h2>
    <p class="text-muted mb-2">We store only what's needed to confirm and deliver your appointments. Payments are processed via Razorpay; we never see card details.</p>
    <a href="/privacy" target="_blank" class="btn btn-brand">Read privacy policy</a>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "social",
        title: "Social Media Links",
        description: "Follow buttons for your channels.",
        icon: "Share2",
        blocks: [
            {
                id: "social-row",
                label: "Inline row",
                description: "Five common networks.",
                html: `<section id="social">
  <div class="container text-center">
    <span class="section-eyebrow">Follow us</span>
    <h2 class="mb-4">Connect with us</h2>
    <div class="d-flex justify-content-center gap-3 fs-3">
      <a href="#" class="text-decoration-none" style="color:var(--brand-primary)"><i class="fa-brands fa-instagram"></i></a>
      <a href="#" class="text-decoration-none" style="color:var(--brand-primary)"><i class="fa-brands fa-facebook"></i></a>
      <a href="#" class="text-decoration-none" style="color:var(--brand-primary)"><i class="fa-brands fa-x-twitter"></i></a>
      <a href="#" class="text-decoration-none" style="color:var(--brand-primary)"><i class="fa-brands fa-youtube"></i></a>
      <a href="#" class="text-decoration-none" style="color:var(--brand-primary)"><i class="fa-brands fa-linkedin"></i></a>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        id: "footer",
        title: "Footer",
        description: "Closing bar with copyright and quick links.",
        icon: "Anchor",
        defaultEnabled: true,
        blocks: [
            {
                id: "footer-simple",
                label: "Simple footer",
                description: "One line with copyright and address.",
                html: `<footer class="footer-bar">
  <div class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
    <span>© {{organisationdetail.name}} · {{locationdetail.city}}, {{locationdetail.state}}</span>
    <span><a href="#about">About</a><a href="#services">Services</a><a href="#contact">Contact</a><a href="#privacy">Privacy</a></span>
  </div>
</footer>`,
            },
            {
                id: "footer-rich",
                label: "Rich footer",
                description: "Three columns: business / links / contact.",
                html: `<footer class="footer-bar">
  <div class="container">
    <div class="row g-4">
      <div class="col-md-5">
        <h5 style="color:#fff;">{{organisationdetail.name}}</h5>
        <p class="mb-0">{{organisationdetail.tagline}}</p>
      </div>
      <div class="col-md-3">
        <h6 style="color:#fff;">Explore</h6>
        <a href="#services" class="d-block">Services</a>
        <a href="#pricing" class="d-block">Pricing</a>
        <a href="#contact" class="d-block">Contact</a>
      </div>
      <div class="col-md-4">
        <h6 style="color:#fff;">Reach us</h6>
        <div>{{locationdetail.addressline1}}</div>
        <div>{{locationdetail.city}}, {{locationdetail.state}} {{locationdetail.pincode}}</div>
        <div>{{locationdetail.phone}} · {{locationdetail.email}}</div>
      </div>
    </div>
    <hr style="border-color:#1f2937;" />
    <div class="text-center small">© {{organisationdetail.name}}. All rights reserved.</div>
  </div>
</footer>`,
            },
        ],
    },
];

/** Pre-build a quick lookup by section id for the builder. */
export const SECTION_BY_ID = SECTION_CATALOG.reduce<Record<string, TemplateSection>>(
    (acc, section) => {
        acc[section.id] = section;
        return acc;
    },
    {},
);
