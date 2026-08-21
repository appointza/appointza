import type { TemplateBuilderBlock, TemplateBuilderPage } from "@/types/templateBuilder.types";
import {
  resolveBlockImageSrc,
  resolveGalleryImageSrcs,
  resolveMemberImageSrc,
  resolveSplitHeroImage,
} from "./imageRefs";
import { injectBlockBackground } from "./blockBackground";

function esc(text: unknown): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** All hero/banner blocks always fill full viewport width + height. */
function heroSectionClass(base: string): string {
  return `${base} az-hero-fullscreen`;
}

const HERO_BLOCK_TYPES = new Set([
  "hero",
  "hero-2",
  "hero-3",
  "hero-4",
  "hero-5",
  "hero-6",
]);

function generatePageBodyHtml(blocks: TemplateBuilderBlock[]): string {
  const parts: string[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];
    const next = blocks[i + 1];

    if (block.type === "header" && next && HERO_BLOCK_TYPES.has(next.type)) {
      const headerHtml = generateBlockHtml(block).replace(
        'class="az-header',
        'class="az-header az-header-on-hero',
      );
      const heroHtml = generateBlockHtml(next);
      parts.push(`<div class="az-hero-stack">\n${headerHtml}\n${heroHtml}\n</div>`);
      i += 2;
      continue;
    }

    parts.push(generateBlockHtml(block));
    i += 1;
  }

  return parts.filter(Boolean).join("\n");
}

/** Appointza dynamic blocks — Mustache placeholders filled by renderSiteTemplateHtml at runtime. */
function generateAppointzaBlockHtml(block: TemplateBuilderBlock): string {
  const d = block.data;
  const v = typeof (d as any).variant === "number" ? ((d as any).variant as number) : 1;
  switch (block.type) {
    case "appointza-organization": {
      const showLogo = d.showLogo !== false;
      const showGst = d.showGst === true;
      const layoutClass =
        v === 2 ? "az-a-org az-a-org-split" : v === 3 ? "az-a-org az-a-org-min" : v === 4 ? "az-a-org az-a-org-card" : "az-a-org";
      return `
<section id="home" class="appointza-org-section ${layoutClass}">
  <div class="appointza-org-container">
    <div class="appointza-org-inner">
      <div class="appointza-org-left">
        ${
          showLogo
            ? `{{#organizationlogo}}<img src="{{ORGANISATION_LOGO_URL}}" alt="{{organisationdetail.name}}" class="appointza-org-logo" />{{/organizationlogo}}`
            : ""
        }
      </div>
      <div class="appointza-org-right">
        <h1>{{organisationdetail.name}}</h1>
        {{#organisationtagline}}<p class="appointza-org-tagline">{{organisationdetail.tagline}}</p>{{/organisationtagline}}
        {{#organisationnotes}}<p class="appointza-org-notes">{{organisationdetail.notes}}</p>{{/organisationnotes}}
        {{#organisationemail}}<p class="appointza-org-email">Email: {{organisationemail}}</p>{{/organisationemail}}
        ${showGst ? `{{#gstnumber}}<p class="appointza-org-gst">GST: {{organisationdetail.gstnumber}}</p>{{/gstnumber}}` : ""}
        <a href="{{BOOKNOWURL}}" data-appointza-book class="appointza-book-button">Book appointment</a>
      </div>
    </div>
  </div>
</section>`;
    }
    case "appointza-location":
      return `
<section id="location" class="appointza-location-section az-a-loc az-a-loc-${v}">
  <div class="appointza-location-bg"></div>
  <div class="appointza-location-container">
    <h2>Location</h2>
    <div class="appointza-location-grid">
      <div class="appointza-location-col">
        <div class="appointza-location-item">
          <div class="appointza-location-content">
            <h3>Address</h3>
            <div class="appointza-location-text">
              <p>{{locationdetail.addressline1}}</p>
              {{#addressline2}}<p>{{locationdetail.addressline2}}</p>{{/addressline2}}
              <p>{{locationdetail.city}}, {{locationdetail.state}} - {{locationdetail.pincode}}</p>
            </div>
          </div>
        </div>
        <div class="appointza-location-item">
          <div class="appointza-location-content">
            <p class="appointza-location-label">Phone</p>
            <p class="appointza-location-value">{{locationdetail.mobile}}</p>
          </div>
        </div>
      </div>
      <div class="appointza-location-col">
        {{#googlemaps}}
        <a href="{{locationdetail.googlelocation}}" target="_blank" rel="noopener" class="appointza-location-link">View on Google Maps</a>
        {{/googlemaps}}
      </div>
    </div>
    <div class="appointza-map-embed">
      <iframe loading="lazy" title="Map" src="https://www.google.com/maps?q={{locationdetail.addressline1}},{{locationdetail.city}},{{locationdetail.state}}&output=embed"></iframe>
    </div>
  </div>
</section>`;
    case "appointza-services":
      return `
{{#hasservices}}
<section id="services" class="appointza-services-section az-a-svc az-a-svc-${v}">
  <div class="appointza-services-bg"></div>
  <div class="appointza-services-container">
    <h2>Our services</h2>
    <div class="appointza-services-list">
      {{#orgnaisatinservice}}
      <div class="appointza-service-card">
        {{#service_image_id}}
        <div class="appointza-service-media">
          <img src="{{SERVICE_IMAGE_URL}}" alt="{{Servicename}}" />
        </div>
        {{/service_image_id}}
        <div class="appointza-service-content">
          <div class="appointza-service-head">
            <h3 class="appointza-service-title">{{Servicename}}</h3>
            <p class="appointza-service-price">₹{{prize}} · {{timetaken}} min</p>
          </div>
          <p>{{notes}}</p>
          <a href="{{SERVICE_BOOK_URL}}" data-appointza-book class="appointza-service-button">Book</a>
        </div>
      </div>
      {{/orgnaisatinservice}}
    </div>
  </div>
</section>
{{/hasservices}}`;
    case "appointza-timings":
      return `
{{#hastimings}}
<section id="hours" class="appointza-timings-section az-a-time az-a-time-${v}">
  <div class="appointza-timings-container">
    <h2>Working hours</h2>
    <div class="appointza-timings-list">
      {{#OrganisationServiceTiming}}
      <div class="appointza-timing-item">
        <span>{{day_name}}</span>
        <span>{{start_time}} – {{end_time}}</span>
      </div>
      {{/OrganisationServiceTiming}}
    </div>
  </div>
</section>
{{/hastimings}}`;
    case "appointza-events":
      return `
{{#hasevents}}
<section id="events" class="appointza-events-section az-a-evt az-a-evt-${v}">
  <div class="appointza-events-bg"></div>
  <div class="appointza-events-container">
    <h2>Events &amp; tournaments</h2>
    <div class="appointza-events-list">
      {{#events}}
      <div class="appointza-event-card">
        {{#event_image_id}}
        <div class="appointza-event-media">
          <img src="{{environment.baseurl}}/api/Files/Get?id={{event_image_id}}" alt="{{event_name}}" />
        </div>
        {{/event_image_id}}
        <div class="appointza-event-content">
          <div class="appointza-event-head">
            <h3 class="appointza-event-title">{{event_name}}</h3>
            <p class="appointza-event-amount">₹{{entry_amount}}</p>
          </div>
          <p>{{description}}</p>
          <p class="appointza-event-meta">{{remainingslot}} slots</p>
          <a href="{{EVENTBOOKURL}}" data-appointza-book class="appointza-event-button">Register</a>
        </div>
      </div>
      {{/events}}
    </div>
  </div>
</section>
{{/hasevents}}`;
    case "appointza-reviews":
      return `
{{#hasreviews}}
<section id="reviews" class="appointza-reviews-section az-a-rev az-a-rev-${v}">
  <div class="appointza-reviews-container">
    <h2>Customer reviews</h2>
    <div class="appointza-reviews-list">
      {{#reviews}}
      <div class="appointza-review-item">
        <div class="appointza-review-stars">{{rating_stars}}</div>
        <blockquote>"{{comment}}"</blockquote>
      </div>
      {{/reviews}}
    </div>
  </div>
</section>
{{/hasreviews}}`;
    case "appointza-facilities":
      return `
{{#hasfacilities}}
<section id="amenities" class="appointza-facilities-section az-a-fac az-a-fac-${v}">
  <div class="appointza-facilities-container">
    <h2>Amenities</h2>
    <div class="appointza-facilities-list">
      {{#facilities}}
      <div class="appointza-facility-item"><p>{{facility_displaytext}}</p></div>
      {{/facilities}}
    </div>
  </div>
</section>
{{/hasfacilities}}`;
    case "appointza-location-images":
      return `
{{#haslocationimages}}
<section id="gallery" class="appointza-location-images-section az-a-gal az-a-gal-${v}">
  <div class="appointza-location-images-container">
    <h2>Gallery</h2>
    <div class="appointza-location-images-grid">
      {{#locationimages}}
      <div class="appointza-location-image-item">
        <img src="{{LOCATION_IMAGE_URL}}" alt="Gallery" />
      </div>
      {{/locationimages}}
    </div>
  </div>
</section>
{{/haslocationimages}}`;
    case "appointza-location-videos":
      return `
{{#haslocationvideos}}
<section id="videos" class="appointza-location-videos-section az-a-vid az-a-vid-${v}">
  <div class="appointza-location-videos-container">
    <h2>Videos</h2>
    <div class="appointza-location-videos-grid">
      {{#locationvideos}}
      <div class="appointza-location-video-item">
        <iframe src="{{LOCATION_VIDEO_EMBED_URL}}" title="Business video" loading="lazy" allowfullscreen></iframe>
        <a href="{{LOCATION_VIDEO_URL}}" target="_blank" rel="noopener noreferrer">Watch video</a>
      </div>
      {{/locationvideos}}
    </div>
  </div>
</section>
{{/haslocationvideos}}`;
    case "appointza-rooms":
      return `
{{#hasrooms}}
<section id="rooms" class="appointza-rooms-section az-a-rooms az-a-rooms-${v}">
  <div class="appointza-rooms-container">
    <h2>Our rooms</h2>
    <p class="appointza-section-sub">Choose from our carefully appointed accommodations</p>
    <div class="appointza-rooms-grid">
      {{#rooms}}
      <article class="appointza-room-card">
        <div class="appointza-room-media">
          <img src="{{room.main_photo}}" alt="{{room.name}}" loading="lazy" />
        </div>
        <div class="appointza-room-body">
          <h3>{{room.name}}</h3>
          <p class="appointza-room-meta">{{room.type}} · {{room.capacity}} guests</p>
          <p class="appointza-room-price">From ₹{{room.price}} <span>/ night</span></p>
          <div class="appointza-room-footer">
            <a href="{{ROOM_BOOK_URL}}" class="appointza-room-button">Book now</a>
          </div>
        </div>
      </article>
      {{/rooms}}
    </div>
  </div>
</section>
{{/hasrooms}}`;
    case "appointza-hospitality-policies":
      return `
{{#haspolicies}}
<section id="policies" class="appointza-policies-section az-a-policies az-a-policies-${v}">
  <div class="appointza-policies-container">
    <h2>Policies</h2>
    <div class="appointza-policies-grid">
      <div class="appointza-policy-box">
        <h3>Check-in &amp; check-out</h3>
        <p>Check-in from {{hospitality.check_in_time}} · Check-out by {{hospitality.check_out_time}}</p>
      </div>
      <div class="appointza-policy-box">
        <h3>Cancellation</h3>
        <p>{{hospitality.cancellation_policy}}</p>
      </div>
      <div class="appointza-policy-box">
        <h3>Payment</h3>
        <p>{{hospitality.payment_policy}}</p>
      </div>
    </div>
  </div>
</section>
{{/haspolicies}}`;
    case "appointza-hospitality-packages":
      return `
{{#haspackages}}
<section id="packages" class="appointza-packages-section az-a-pkg az-a-pkg-${v}">
  <div class="appointza-packages-container">
    <h2>Packages</h2>
    <p class="appointza-section-sub">Curated experiences for every occasion</p>
    <div class="appointza-packages-grid">
      {{#packages}}
      <article class="appointza-package-card">
        <div class="appointza-package-media">
          <img src="{{package.image_url}}" alt="{{package.name}}" loading="lazy" />
        </div>
        <div class="appointza-package-body">
          <span class="appointza-package-badge">{{package.badge}}</span>
          <h3>{{package.name}}</h3>
          <p class="appointza-package-price">{{package.price}}</p>
          <p class="appointza-package-desc">{{package.description}}</p>
          <p class="appointza-package-meta">{{package.minimum_nights}} nights min · Up to {{package.max_guests}} guests</p>
          <p class="appointza-package-includes">{{package.includes}}</p>
          <a href="{{PACKAGE_BOOK_URL}}" class="appointza-package-button">Book package</a>
        </div>
      </article>
      {{/packages}}
    </div>
  </div>
</section>
{{/haspackages}}`;
    case "appointza-food-menu":
      return `
{{#hasfoodmenu}}
<section id="food-menu" class="appointza-food-section az-a-food az-a-food-${v}">
  <div class="appointza-food-container">
    <h2>Food &amp; dining</h2>
    <div class="appointza-food-grid">
      {{#food_menu}}
      <article class="appointza-food-card">
        <span class="appointza-food-meal">{{food.meal}}</span>
        <h3>{{food.title}}</h3>
        <p>{{food.description}}</p>
        <p class="appointza-food-cuisines">{{food.cuisines}}</p>
      </article>
      {{/food_menu}}
    </div>
  </div>
</section>
{{/hasfoodmenu}}`;
    case "appointza-nearby-places":
      return `
{{#hasnearby}}
<section id="nearby" class="appointza-nearby-section az-a-nearby az-a-nearby-${v}">
  <div class="appointza-nearby-container">
    <h2>Nearby places</h2>
    <p class="appointza-section-sub">Explore the surroundings</p>
    <div class="appointza-nearby-grid">
      {{#nearby_places}}
      <article class="appointza-nearby-card">
        <div class="appointza-nearby-media">
          <img src="{{place.image_url}}" alt="{{place.name}}" loading="lazy" />
        </div>
        <div class="appointza-nearby-body">
          <span class="appointza-nearby-icon">{{place.icon}}</span>
          <h3>{{place.name}}</h3>
          <p class="appointza-nearby-meta">{{place.distance}} · {{place.travel_time}}</p>
          <a href="{{place.map_url}}" target="_blank" rel="noopener noreferrer">View on map</a>
        </div>
      </article>
      {{/nearby_places}}
    </div>
  </div>
</section>
{{/hasnearby}}`;
    case "appointza-guest-services":
      return `
{{#hasguestservices}}
<section id="guest-services" class="appointza-guest-services-section az-a-guest az-a-guest-${v}">
  <div class="appointza-guest-services-container">
    <h2>Guest services</h2>
    <p class="appointza-section-sub">Extras and add-ons for your stay</p>
    <div class="appointza-guest-services-grid">
      {{#guest_services}}
      <article class="appointza-guest-service-card">
        <span class="appointza-guest-service-icon">{{guest.icon}}</span>
        <h3>{{guest.name}}</h3>
        <p class="appointza-guest-service-price">{{guest.price}}</p>
        <p class="appointza-guest-service-category">{{guest.category}}</p>
        <p>{{guest.description}}</p>
      </article>
      {{/guest_services}}
    </div>
  </div>
</section>
{{/hasguestservices}}`;
    default:
      return "";
  }
}

function generateStaticBlockHtml(block: TemplateBuilderBlock): string {
  const d = block.data;
  const v = typeof (d as any).variant === "number" ? ((d as any).variant as number) : 1;
  switch (block.type) {
    case "header": {
      const links = Array.isArray((d as any).links) ? ((d as any).links as any[]) : [];
      const nav = links
        .map(
          (l) =>
            `<a href="${esc(l.href ?? "#")}" class="az-nav-link">${esc(l.label ?? "")}</a>`,
        )
        .join("");
      return `
<header class="az-header az-v${v}">
  <div class="az-header-inner">
    <div class="az-logo">${esc((d as any).logoText ?? "{{organisationdetail.name}}")}</div>
    <nav class="az-nav">${nav}</nav>
    <a href="{{BOOKNOWURL}}" data-appointza-book class="az-btn az-btn-small">${esc(
      (d as any).ctaText ?? "Book now",
    )}</a>
  </div>
</header>`;
    }
    case "about":
      return `
<section id="about" class="az-section az-v${v}">
  <p class="az-eyebrow">About us</p>
  <h2>${esc((d as any).title ?? "About us")}</h2>
  <p class="az-muted">${esc((d as any).content ?? "")}</p>
</section>`;
    case "features": {
      const items = Array.isArray((d as any).items) ? ((d as any).items as any[]) : [];
      return `
<section id="features" class="az-section az-v${v}">
  <div class="az-sec-glow az-sec-glow-1"></div>
  <div class="az-sec-glow az-sec-glow-2"></div>
  <div class="az-container">
  <h2 class="az-title">${esc((d as any).title ?? "Features / Benefits")}</h2>
  <div class="az-grid-3 az-grid-gap-lg">
    ${items
      .map(
        (it) =>
          `<div class="az-card az-card-hover">
            <div class="az-card-icon">⚡</div>
            <h3>${esc(it.title ?? "")}</h3><p class="az-muted">${esc(
            it.desc ?? "",
          )}</p></div>`,
      )
      .join("")}
  </div>
  </div>
</section>`;
    }
    case "gallery": {
      const images = resolveGalleryImageSrcs(d as Record<string, unknown>);
      return `
<section id="gallery" class="az-section az-v${v}">
  <h2>${esc((d as any).title ?? "Gallery / Portfolio")}</h2>
  <div class="az-gallery az-gallery-v${v}">
    ${images.map((src) => `<img src="${esc(src)}" alt="Gallery" />`).join("")}
  </div>
</section>`;
    }
    case "testimonials": {
      const items = Array.isArray((d as any).items) ? ((d as any).items as any[]) : [];
      return `
<section id="testimonials" class="az-section az-section-muted az-v${v}">
  <div class="az-quote az-quote-1">"</div>
  <div class="az-quote az-quote-2">"</div>
  <div class="az-container">
  <h2 class="az-title">${esc((d as any).title ?? "Testimonials / Reviews")}</h2>
  <div class="az-grid-3 az-grid-gap-lg">
    ${items
      .map(
        (t) =>
          `<div class="az-card az-card-hover">
            <p class="az-quote-text">“${esc(t.quote ?? "")}”</p><p class="az-muted">— ${esc(
            t.name ?? "",
          )}</p></div>`,
      )
      .join("")}
  </div>
  </div>
</section>`;
    }
    case "blog": {
      const posts = Array.isArray((d as any).posts) ? ((d as any).posts as any[]) : [];
      return `
<section id="blog" class="az-section az-section-muted az-v${v}">
  <h2>${esc((d as any).title ?? "Blog / News")}</h2>
  <div class="az-grid-3">
    ${posts
      .map(
        (p) =>
          `<div class="az-card"><h3>${esc(p.title ?? "")}</h3><p class="az-muted">${esc(
            p.date ?? "",
          )}</p><p>${esc(p.excerpt ?? "")}</p></div>`,
      )
      .join("")}
  </div>
</section>`;
    }
    case "announcements": {
      const items = Array.isArray((d as any).items) ? ((d as any).items as any[]) : [];
      return `
<section id="announcements" class="az-section az-section-muted az-v${v}">
  <h2>${esc((d as any).title ?? "Announcements")}</h2>
  <ul class="az-list">${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
</section>`;
    }
    case "search":
      return `
<section id="search" class="az-section az-v${v}">
  <h2>${esc((d as any).title ?? "Search")}</h2>
  <div class="az-search">
    <input placeholder="${esc((d as any).placeholder ?? "Search…")}" />
  </div>
</section>`;
    case "filters": {
      const items = Array.isArray((d as any).items) ? ((d as any).items as any[]) : [];
      return `
<section id="filters" class="az-section az-section-muted az-v${v}">
  <h2>${esc((d as any).title ?? "Filters / Categories")}</h2>
  <div class="az-pills">${items.map((x) => `<span class="az-pill">${esc(x)}</span>`).join("")}</div>
</section>`;
    }
    case "support": {
      const items = Array.isArray((d as any).items) ? ((d as any).items as any[]) : [];
      return `
<section id="support" class="az-section az-section-muted az-v${v}">
  <h2>${esc((d as any).title ?? "Support / Help Center")}</h2>
  <div class="az-grid-3">${items.map((x) => `<div class="az-card">${esc(x)}</div>`).join("")}</div>
</section>`;
    }
    case "privacy":
    case "terms":
      return `
<section id="${esc(block.type)}" class="az-section az-section-muted az-v${v}">
  <h2>${esc((d as any).title ?? "")}</h2>
  <p class="az-muted">${esc((d as any).content ?? "")}</p>
</section>`;
    case "map":
      return `
<section id="map" class="az-section az-section-muted az-v${v}">
  <h2>${esc((d as any).title ?? "Google Map / Location")}</h2>
  <div class="az-video-wrap">
    <iframe
      src="https://www.google.com/maps?q={{locationdetail.addressline1}},{{locationdetail.city}},{{locationdetail.state}}&output=embed"
      title="Map"
      loading="lazy"
    ></iframe>
  </div>
</section>`;
    case "live-status":
      return `
<section id="live-status" class="az-section az-section-muted az-v${v}">
  <div class="az-card az-card-center">
    <div class="az-eyebrow">${esc((d as any).title ?? "Live status")}</div>
    <div class="az-price">${esc((d as any).status ?? "Open")}</div>
    <div class="az-muted">${esc((d as any).note ?? "")}</div>
  </div>
</section>`;
    case "hero":
      return `
<section id="home-hero" class="${heroSectionClass("az-hero")}">
  <div class="az-hero-glow az-hero-glow-1"></div>
  <div class="az-hero-glow az-hero-glow-2"></div>
  <div class="az-hero-content">
    <h1>${esc(d.title)}</h1>
    <p>${esc(d.subtitle)}</p>
    <a href="{{BOOKNOWURL}}" data-appointza-book class="az-btn az-btn-solid">${esc(d.buttonText || "Book now")}</a>
  </div>
  <div class="az-hero-bottom"></div>
</section>`;
    case "hero-2": {
      const heroImg = resolveSplitHeroImage(d as Record<string, unknown>);
      return `
<section id="home-hero" class="${heroSectionClass("az-hero az-hero-split")}">
  <div class="az-split">
    <div class="az-split-text">
      <h1>${esc(d.title)}</h1>
      <p>${esc(d.subtitle)}</p>
      <div class="az-split-actions">
        <a href="{{BOOKNOWURL}}" data-appointza-book class="az-btn az-btn-solid">${esc(d.buttonText || "Book now")}</a>
        ${d.secondaryButtonText ? `<a href="#services" class="az-btn az-btn-light">${esc(d.secondaryButtonText)}</a>` : ""}
      </div>
    </div>
    <div class="az-split-media">
      <div class="az-split-media-frame">
        ${heroImg ? `<img src="${esc(heroImg)}" alt="Hero" />` : `<div class="az-media-placeholder">Upload or add an image</div>`}
      </div>
    </div>
  </div>
</section>`;
    }
    case "hero-3":
      return `
<section id="home-hero" class="${heroSectionClass("az-hero az-hero-minimal")}">
  <div class="az-hero-content">
    <h1>${esc(d.title)}</h1>
    <p>${esc(d.subtitle)}</p>
    <a href="{{BOOKNOWURL}}" data-appointza-book class="az-btn az-btn-outline">${esc(d.buttonText || "Book now")}</a>
  </div>
</section>`;
    case "hero-4": {
      const overlay = typeof d.overlayOpacity === "number" ? d.overlayOpacity : 0.45;
      const heroImg = resolveBlockImageSrc(d as Record<string, unknown>);
      return `
<section id="home-hero" class="${heroSectionClass("az-hero az-hero-bg")}">
  ${heroImg ? `<div class="az-bg" style="background-image:url('${esc(heroImg)}')"></div>` : `<div class="az-bg az-bg-fallback"></div>`}
  <div class="az-bg-overlay" style="opacity:${overlay}"></div>
  <div class="az-bg-content">
    <h1>${esc(d.title)}</h1>
    <p>${esc(d.subtitle)}</p>
    <a href="{{BOOKNOWURL}}" data-appointza-book class="az-btn az-btn-light">${esc(d.buttonText || "Book now")}</a>
  </div>
</section>`;
    }
    case "hero-5": {
      const heroImg = resolveBlockImageSrc(d as Record<string, unknown>);
      return `
<section id="home-hero" class="${heroSectionClass("az-hero az-hero-left")}">
  <div class="az-left">
    <div class="az-left-text">
      <h1>${esc(d.title)}</h1>
      <p>${esc(d.subtitle)}</p>
      <div class="az-split-actions">
        <a href="{{BOOKNOWURL}}" data-appointza-book class="az-btn">${esc(d.buttonText || "Book now")}</a>
        ${d.secondaryButtonText ? `<a href="#services" class="az-btn az-btn-light">${esc(d.secondaryButtonText)}</a>` : ""}
      </div>
    </div>
    <div class="az-split-media">
      <div class="az-split-media-frame">
        ${heroImg ? `<img src="${esc(heroImg)}" alt="Hero" />` : `<div class="az-media-placeholder az-media-placeholder-light">Upload or add an image</div>`}
      </div>
    </div>
  </div>
</section>`;
    }
    case "hero-6":
      return `
<section id="home-hero" class="${heroSectionClass("az-hero az-hero-video")}">
  ${d.videoUrl ? `<video class="az-video" autoplay muted loop playsinline><source src="${esc(d.videoUrl)}" type="video/mp4"></video>` : ""}
  <div class="az-video-overlay"></div>
  <div class="az-video-content">
    <h1>${esc(d.title)}</h1>
    <p>${esc(d.subtitle)}</p>
    <div class="az-split-actions">
      <a href="{{BOOKNOWURL}}" data-appointza-book class="az-btn az-btn-light">${esc(d.buttonText || "Book now")}</a>
      ${d.secondaryButtonText ? `<a href="#services" class="az-btn az-btn-light">${esc(d.secondaryButtonText)}</a>` : ""}
    </div>
  </div>
</section>`;
    case "section":
      return `
<section id="about" class="az-section">
  <p class="az-eyebrow">${esc(d.eyebrow || "About")}</p>
  <h2>${esc(d.title)}</h2>
  <div class="az-prose">${String(d.content ?? "").replace(/\n/g, "<br/>")}</div>
</section>`;
    case "cta-booking":
      return `
<section id="booking" class="az-cta">
  <div class="az-cta-glow"></div>
  <div class="az-container az-center">
    <h2 class="az-title">${esc(d.title)}</h2>
    <p class="az-subtitle">${esc(d.subtitle)}</p>
    <a href="{{BOOKNOWURL}}" data-appointza-book class="az-btn az-btn-invert">${esc(d.buttonText || "Book appointment")}</a>
  </div>
</section>`;
    case "time-slots":
      return `
<section id="time-slots" class="az-section az-section-muted">
  <h2>${esc(d.title)}</h2>
  <p>${esc(d.content)}</p>
  <a href="{{BOOKNOWURL}}" data-appointza-book class="az-btn">${esc(d.buttonText || "Check slots")}</a>
</section>`;
    case "pricing": {
      const plans =
        (Array.isArray((d as any).plans) ? ((d as any).plans as any[]) : []).filter(Boolean) as Array<{
          name?: string;
          price?: string;
          period?: string;
          bookings?: string;
          afterNote?: string;
          cta?: string;
          popular?: boolean;
        }>;
      const items = (d.items as Array<{ name: string; price: string; note: string }>) || [];

      if (plans.length) {
        const footnote = esc((d as any).footnote ?? "");
        return `
<section id="pricing" class="az-section az-section-muted">
  <div class="az-container">
    <h2 class="az-title">${esc(d.title || "Pricing")}</h2>
    <div class="az-pricing-grid">
      ${plans
        .map((p) => {
          const popular = !!p.popular;
          return `<article class="az-plan ${popular ? "az-plan-popular" : ""}">
            ${popular ? `<div class="az-plan-badge">Most popular</div>` : ""}
            <div class="az-plan-top">
              <p class="az-plan-name">${esc(p.name ?? "")}</p>
              <div class="az-plan-priceRow">
                <span class="az-plan-price">${esc(p.price ?? "")}</span>
                <span class="az-plan-period">${esc(p.period ?? "/mo")}</span>
              </div>
              <p class="az-plan-bookings">${esc(p.bookings ?? "")}</p>
              ${p.afterNote ? `<p class="az-plan-after">${esc(p.afterNote)}</p>` : ""}
            </div>
            <button type="button" class="az-plan-cta ${popular ? "az-plan-cta-light" : ""}">${esc(p.cta ?? "Choose")}</button>
          </article>`;
        })
        .join("")}
    </div>
    ${footnote ? `<p class="az-plan-footnote">${footnote}</p>` : ""}
  </div>
</section>`;
      }

      // Fallback: older simple pricing list
      return `
<section id="pricing" class="az-section">
  <div class="az-container">
    <h2 class="az-title">${esc(d.title || "Pricing")}</h2>
    <div class="az-grid-3">${items
      .map(
        (it) =>
          `<div class="az-card az-card-hover"><h3>${esc(it.name)}</h3><p class="az-price">${esc(it.price)}</p><p class="az-muted">${esc(it.note)}</p></div>`,
      )
      .join("")}</div>
  </div>
</section>`;
    }
    case "membership": {
      const tiers = (d.tiers as Array<{ name: string; price: string; perks: string[] }>) || [];
      return `
<section id="membership" class="az-section az-section-muted">
  <h2>${esc(d.title || "Membership")}</h2>
  <div class="az-grid-3">${tiers
    .map(
      (t) =>
        `<div class="az-card"><h3>${esc(t.name)}</h3><p class="az-price">${esc(t.price)}</p><ul>${(t.perks || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>`,
    )
    .join("")}</div>
</section>`;
    }
    case "offers":
      return `
<section id="offers" class="az-offers">
  <h2>${esc(d.title)}</h2>
  <p>${esc(d.description)}</p>
  <span class="az-code">${esc(d.code)}</span>
  <a href="#booking" class="az-btn az-btn-light">${esc(d.buttonText || "Claim")}</a>
</section>`;
    case "team": {
      const members = Array.isArray((d as { members?: unknown[] }).members)
        ? ((d as { members: Record<string, unknown>[] }).members as Record<string, unknown>[])
        : [];
      return `
<section id="team" class="az-section az-team az-team-v${v}">
  <h2 class="az-title">${esc((d as { title?: string }).title || "Our team")}</h2>
  <div class="az-team-grid">
    ${members
      .map((m) => {
        const img = resolveMemberImageSrc(m);
        const initial = String(m.name ?? "?").trim().charAt(0).toUpperCase() || "?";
        return `<article class="az-team-card">
      ${
        img
          ? `<div class="az-team-photo"><img src="${esc(img)}" alt="${esc(m.name)}" /></div>`
          : `<div class="az-team-photo az-team-photo-placeholder" aria-hidden="true">${esc(initial)}</div>`
      }
      <div class="az-team-body">
        <h3 class="az-team-name">${esc(m.name)}</h3>
        ${m.role ? `<p class="az-team-role">${esc(m.role)}</p>` : ""}
        ${m.experience ? `<p class="az-team-exp">${esc(m.experience)}</p>` : ""}
        ${m.description ? `<p class="az-team-desc">${esc(m.description)}</p>` : ""}
      </div>
    </article>`;
      })
      .join("")}
  </div>
</section>`;
    }
    case "faq": {
      const items = (d.items as Array<{ q: string; a: string }>) || [];
      return `
<section id="faq" class="az-section az-section-muted">
  <h2>${esc(d.title || "FAQ")}</h2>
  <div class="az-faq">${items.map((it, i) => `<details ${i === 0 ? "open" : ""}><summary>${esc(it.q)}</summary><p>${esc(it.a)}</p></details>`).join("")}</div>
</section>`;
    }
    case "form": {
      const formSubject = String((d as { subject?: string }).subject || d.title || "Contact enquiry");
      return `
<section id="contact" class="az-section">
  <h2>${esc(d.title || "Contact us")}</h2>
  <form class="az-form" data-appointza-contact data-organisation-id="{{organisationdetail.id}}" novalidate>
    <input name="name" type="text" placeholder="Your name" autocomplete="name" required />
    <input name="email" type="email" placeholder="Email" autocomplete="email" required />
    <input name="phone" type="tel" placeholder="Phone (optional)" autocomplete="tel" />
    <textarea name="message" rows="4" placeholder="Message" required></textarea>
    <input type="hidden" name="subject" value="${esc(formSubject)}" />
    <input type="hidden" name="organisation_id" value="{{organisationdetail.id}}" />
    <button type="submit" class="az-btn">${esc(d.submitLabel || "Send")}</button>
    <p class="az-form-status" role="status" aria-live="polite"></p>
  </form>
</section>`;
    }
    case "payment-info":
      return `
<section id="payment" class="az-section">
  <h2>${esc(d.title)}</h2>
  <p>${esc(d.content)}</p>
  <div class="az-badges"><span>UPI</span><span>Cards</span><span>Net banking</span><span>Wallets</span></div>
</section>`;
    case "policy": {
      const id = String(d.variant || "policy");
      return `
<section id="${esc(id)}" class="az-section az-section-muted">
  <h2>${esc(d.title)}</h2>
  <p>${esc(d.content)}</p>
</section>`;
    }
    case "social": {
      const links = (d.links as Array<{ label: string; url: string }>) || [];
      return `
<section id="social" class="az-section">
  <h2>${esc(d.title || "Follow us")}</h2>
  <div class="az-social">${links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div>
</section>`;
    }
    case "footer":
      return `
<footer id="footer" class="az-footer">
  <div class="az-footer-grid">
    <div><strong>{{organisationdetail.name}}</strong><p>${esc(d.tagline)}</p></div>
    <div><a href="#services">Services</a><a href="#booking">Book</a><a href="#contact">Contact</a></div>
    <div>{{locationdetail.city}}, {{locationdetail.state}}<br/>{{locationdetail.mobile}}</div>
  </div>
  <p class="az-copy">© {{organisationdetail.name}}</p>
</footer>`;
    case "float-whatsapp":
      if (d.enabled === false) return "";
      return `<a href="https://wa.me/{{locationdetail.mobile}}" class="az-float az-float-wa" target="_blank" rel="noopener" aria-label="WhatsApp">WA</a>`;
    case "float-call":
      if (d.enabled === false) return "";
      return `<a href="tel:{{locationdetail.mobile}}" class="az-float az-float-call" aria-label="Call">📞</a>`;
    default:
      return `
<section id="${esc(block.type)}" class="az-section az-section-muted az-v${v}">
  <h2>${esc((d as any).title ?? block.type)}</h2>
  ${
    (d as any).content
      ? `<p class="az-muted">${esc((d as any).content)}</p>`
      : (d as any).description
        ? `<p class="az-muted">${esc((d as any).description)}</p>`
        : ""
  }
  <pre style="white-space:pre-wrap;word-break:break-word;background:#0b1220;color:#cbd5e1;border:1px solid #1f2937;border-radius:12px;padding:12px;margin-top:14px;max-height:220px;overflow:auto;font-size:12px;line-height:1.45;">${esc(
    JSON.stringify(d ?? {}, null, 2),
  )}</pre>
</section>`;
  }
}

function generateBlockHtml(block: TemplateBuilderBlock): string {
  const data = block.data as Record<string, unknown>;
  const raw = block.type.startsWith("appointza-")
    ? generateAppointzaBlockHtml(block)
    : generateStaticBlockHtml(block);

  // Split heroes never use a full-section background image — image belongs in the right column.
  const splitHeroTypes = new Set(["hero-2", "hero-5"]);
  if (splitHeroTypes.has(block.type)) {
    return injectBlockBackground(raw, {
      ...data,
      backgroundImageId: 0,
      backgroundImage: "",
      backgroundOverlay: false,
    });
  }

  return injectBlockBackground(raw, data);
}

const BASE_STYLES = `
:root {
  --az-primary: hsl(217, 91%, 60%);
  --az-primary-foreground: hsl(0, 0%, 100%);
  --az-accent: hsl(240, 91%, 65%);
  --az-background: hsl(0, 0%, 100%);
  --az-foreground: hsl(222, 47%, 11%);
  --az-card: hsl(0, 0%, 100%);
  --az-muted: hsl(220, 9%, 46%);
  --az-border: hsl(220, 13%, 91%);
  --az-shadow-lg: 0 10px 15px -3px rgba(0,0,0,.08), 0 4px 6px -4px rgba(0,0,0,.05);
  --az-shadow-xl: 0 20px 25px -5px rgba(0,0,0,.10), 0 8px 10px -6px rgba(0,0,0,.05);
  --az-gradient-primary: linear-gradient(135deg, var(--az-primary) 0%, var(--az-accent) 100%);
}
* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, system-ui, sans-serif; color: var(--az-foreground); line-height: 1.6; background: var(--az-background); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

/* Global page rhythm: consistent alignment after adding all blocks */
.az-page { background:#fff; }
.az-page > section { border-top: 1px solid #eef2f7; }
.az-page > section:first-child { border-top: 0; }
.az-page > section:nth-child(even):not(.az-hero):not(.az-hero-fullscreen):not(.az-has-block-bg) { background: #f8fafc; }

section { padding: 4rem 1.5rem; }
section.az-hero,
section.az-hero-fullscreen { padding: 0 !important; border-top: 0; }
.az-has-block-bg { position: relative; overflow: hidden; }
.az-block-bg-overlay { position: absolute; inset: 0; background: #000; pointer-events: none; z-index: 0; }
.az-has-block-bg > :not(.az-block-bg-overlay) { position: relative; z-index: 1; }
header.az-has-block-bg > :not(.az-block-bg-overlay),
footer.az-has-block-bg > :not(.az-block-bg-overlay) { position: relative; z-index: 1; }
.az-container { max-width: 72rem; margin: 0 auto; position: relative; z-index: 2; }
.az-title { font-size: clamp(1.875rem, 4vw, 2.25rem); font-weight: 800; margin: 0 0 1.25rem; text-align: center; color: var(--az-foreground); }
.az-subtitle { text-align: center; color: var(--az-muted); margin: 0 auto 1.5rem; max-width: 42rem; }
.az-center { text-align: center; }
.appointza-org-section h1,
.appointza-location-section h2,
.appointza-services-section h2,
.appointza-timings-section h2,
.appointza-events-section h2,
.appointza-reviews-section h2,
.appointza-facilities-section h2,
.appointza-location-images-section h2,
.appointza-rooms-section h2,
.appointza-policies-section h2,
.appointza-packages-section h2,
.appointza-food-section h2,
.appointza-nearby-section h2 { text-align: center; margin: 0 0 1.25rem; }
.appointza-org-section h1 { font-size: clamp(2rem, 4.5vw, 3rem); }
.appointza-location-section h2,
.appointza-services-section h2,
.appointza-timings-section h2,
.appointza-events-section h2,
.appointza-reviews-section h2,
.appointza-facilities-section h2,
.appointza-location-images-section h2,
.appointza-rooms-section h2,
.appointza-policies-section h2,
.appointza-packages-section h2,
.appointza-food-section h2,
.appointza-nearby-section h2 { font-size: clamp(1.5rem, 2.6vw, 2rem); }

.appointza-section-sub { text-align: center; color: var(--az-muted); margin: -0.5rem auto 1.5rem; max-width: 40rem; }
.appointza-rooms-grid,
.appointza-packages-grid,
.appointza-food-grid,
.appointza-nearby-grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
.appointza-room-card,
.appointza-package-card,
.appointza-food-card,
.appointza-nearby-card,
.appointza-policy-box { border: 1px solid rgba(0,0,0,0.08); border-radius: 1rem; overflow: hidden; background: #fff; }
.appointza-room-media img,
.appointza-package-media img,
.appointza-nearby-media img { width: 100%; height: 180px; object-fit: cover; display: block; background: #f1f5f9; }
.appointza-room-body,
.appointza-package-body,
.appointza-food-card,
.appointza-nearby-body { padding: 1rem 1.1rem 1.15rem; }
.appointza-room-meta,
.appointza-package-meta,
.appointza-nearby-meta,
.appointza-food-cuisines { color: var(--az-muted); font-size: 0.9rem; }
.appointza-room-price,
.appointza-package-price { font-weight: 700; margin: 0.35rem 0; }
.appointza-room-button,
.appointza-package-button { display: inline-block; margin-top: 0.75rem; padding: 0.55rem 1rem; border-radius: 999px; background: var(--az-primary); color: #fff; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
.appointza-room-status { display: inline-block; margin-top: 0.75rem; padding: 0.35rem 0.75rem; border-radius: 999px; background: #fef3c7; color: #92400e; font-size: 0.85rem; }
.appointza-policies-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.appointza-policy-box { padding: 1.1rem 1.25rem; }
.appointza-policy-box h3 { margin: 0 0 0.5rem; font-size: 1.05rem; }
.appointza-food-meal,
.appointza-package-badge,
.appointza-nearby-icon { display: inline-block; font-size: 0.8rem; font-weight: 600; color: var(--az-primary); margin-bottom: 0.35rem; }

.az-section-muted { background: linear-gradient(to bottom, rgba(220, 14%, 96%, 0.35), rgba(220, 14%, 96%, 0.15), rgba(220, 14%, 96%, 0.35)); }
.az-v2 { background: #f8fafc; }
.az-v3 { background: #ffffff; }
.az-v4 { background: #0f172a; color: #fff; }
.az-v4 .az-muted { color: rgba(255,255,255,0.8); }
.az-hero {
  position: relative;
  text-align: center;
  background: var(--az-gradient-primary);
  color: #fff;
  overflow: hidden;
  min-height: 100vh;
  min-height: 100dvh;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  max-width: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}
.az-hero-fullscreen {
  min-height: 100vh;
  min-height: 100dvh;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  max-width: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  padding: 0 !important;
  margin: 0;
  box-sizing: border-box;
}
.az-page > section.az-hero:first-child,
.az-page > section.az-hero-fullscreen:first-child { border-top: 0; }
.az-page > section.az-hero:nth-child(even),
.az-page > section.az-hero-fullscreen:nth-child(even) { background: unset; }
.az-hero .az-hero-content,
.az-hero .az-bg-content,
.az-hero .az-video-content,
.az-hero-fullscreen .az-hero-content,
.az-hero-fullscreen .az-bg-content,
.az-hero-fullscreen .az-video-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: none;
  margin: 0;
  min-height: 100%;
  padding: clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 3rem);
  box-sizing: border-box;
  position: relative;
  z-index: 2;
}
.az-hero .az-split,
.az-hero .az-left,
.az-hero-fullscreen .az-split,
.az-hero-fullscreen .az-left {
  flex: 1 1 auto;
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 3rem);
  align-content: center;
  align-items: center;
  min-height: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(1.25rem, 3vw, 2.5rem);
}
.az-hero-split .az-split,
.az-hero-left .az-left {
  align-items: stretch;
}
.az-hero .az-split-media img,
.az-hero .az-media-placeholder,
.az-hero .az-left-img,
.az-hero-fullscreen .az-split-media img,
.az-hero-fullscreen .az-media-placeholder,
.az-hero-fullscreen .az-left-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.az-hero.az-hero-bg,
.az-hero.az-hero-video,
.az-hero-fullscreen.az-hero-bg,
.az-hero-fullscreen.az-hero-video {
  position: relative;
  overflow: hidden;
}
.az-hero.az-hero-bg .az-bg,
.az-hero.az-hero-video .az-video,
.az-hero-fullscreen.az-hero-bg .az-bg,
.az-hero-fullscreen.az-hero-video .az-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
  z-index: 0;
}
.az-hero.az-hero-bg .az-bg-overlay,
.az-hero.az-hero-video .az-video-overlay,
.az-hero-fullscreen.az-hero-bg .az-bg-overlay,
.az-hero-fullscreen.az-hero-video .az-video-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
}
.az-hero.az-hero-minimal,
.az-hero.az-hero-left,
.az-hero-fullscreen.az-hero-minimal,
.az-hero-fullscreen.az-hero-left {
  justify-content: center;
}
.az-hero-content { position: relative; z-index: 2; max-width: 56rem; margin: 0 auto; }
.az-hero-stack { position: relative; display: flex; flex-direction: column; width: 100%; }
.az-hero-stack > .az-header-on-hero {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  background: rgba(15, 23, 42, 0.18);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.az-hero-stack > .az-header-on-hero .az-logo { color: #fff; }
.az-hero-stack > .az-header-on-hero .az-nav-link { color: rgba(255, 255, 255, 0.88); }
.az-hero-stack > .az-header-on-hero .az-nav-link:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
.az-hero-stack > .az-header-on-hero .az-btn-small {
  background: rgba(255, 255, 255, 0.96);
  color: var(--az-foreground);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}
.az-hero-stack:has(.az-hero-left) > .az-header-on-hero,
.az-hero-stack:has(.az-hero-split) > .az-header-on-hero {
  background: rgba(255, 255, 255, 0.82);
  border-bottom-color: rgba(15, 23, 42, 0.08);
}
.az-hero-stack:has(.az-hero-left) > .az-header-on-hero .az-logo,
.az-hero-stack:has(.az-hero-left) > .az-header-on-hero .az-nav-link,
.az-hero-stack:has(.az-hero-split) > .az-header-on-hero .az-logo,
.az-hero-stack:has(.az-hero-split) > .az-header-on-hero .az-nav-link { color: var(--az-foreground); }
.az-hero-stack:has(.az-hero-left) > .az-header-on-hero .az-nav-link:hover,
.az-hero-stack:has(.az-hero-split) > .az-header-on-hero .az-nav-link:hover {
  color: var(--az-foreground);
  background: rgba(15, 23, 42, 0.05);
}
.az-hero-glow { position: absolute; width: 24rem; height: 24rem; border-radius: 999px; background: rgba(255,255,255,0.12); filter: blur(3rem); animation: azPulse 3s ease-in-out infinite; pointer-events: none; }
.az-hero-glow-1 { top: 20%; left: 18%; }
.az-hero-glow-2 { bottom: 18%; right: 18%; animation-delay: 1s; }
.az-hero-bottom { position:absolute; left:0; right:0; bottom:0; height: 8rem; background: linear-gradient(to top, rgba(255,255,255,0.12), transparent); pointer-events: none; }
.az-hero h1 {
  font-size: clamp(2.25rem, 5.5vw, 3.75rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.08;
  margin: 0 0 1rem;
}
.az-hero p,
.az-bg-content p,
.az-video-content p {
  font-size: clamp(1rem, 2vw, 1.2rem);
  line-height: 1.65;
  opacity: 0.92;
  max-width: 42rem;
  margin: 0 auto 1.75rem;
}
.az-split-text p,
.az-left-text p {
  margin-left: 0;
  margin-right: 0;
}
.az-split-text h1,
.az-left-text h1 {
  text-align: left;
}
.az-split-text,
.az-left-text {
  max-width: 36rem;
}
.az-btn { display: inline-flex; align-items: center; justify-content:center; gap: .5rem; padding: 0.95rem 1.75rem; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 0.95rem; border: none; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease; }
.az-btn:hover { transform: translateY(-1px) scale(1.02); box-shadow: var(--az-shadow-xl); }
.az-btn-solid { background: rgba(255,255,255,0.98); color: var(--az-foreground); box-shadow: var(--az-shadow-xl); }
.az-btn-outline { background: rgba(255,255,255,0.08); color: #fff; border: 2px solid rgba(255,255,255,0.35); backdrop-filter: blur(8px); }
.az-btn-invert { background: rgba(255,255,255,0.98); color: var(--az-foreground); box-shadow: var(--az-shadow-xl); }
.az-btn-light { background: #fff; color: var(--az-primary); }
.az-hero.az-hero-split,
.az-hero.az-hero-left {
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%) !important;
  background-image: none !important;
  color: var(--az-foreground);
}
.az-hero-split .az-split-text {
  background: var(--az-gradient-primary);
  color: #fff;
  border-radius: 1.5rem;
  padding: clamp(2rem, 4vw, 3rem);
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  box-shadow: var(--az-shadow-xl);
}
.az-hero-split .az-split-text p {
  color: rgba(255, 255, 255, 0.92);
  margin-left: 0;
  margin-right: 0;
}
.az-hero-split .az-split-media,
.az-hero-left .az-split-media {
  display: flex;
  align-items: stretch;
  justify-content: center;
  min-width: 0;
  max-width: 100%;
  align-self: stretch;
  overflow: hidden;
}
.az-hero-split .az-split-media-frame,
.az-hero-left .az-split-media-frame {
  width: 100%;
  max-width: 100%;
  min-height: 280px;
  height: 100%;
  max-height: min(520px, calc(100vh - 7rem));
  border-radius: 1.5rem;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: var(--az-shadow-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.az-hero-split .az-split-media-frame img,
.az-hero-left .az-split-media-frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  background: #fff;
}
.az-split-text { text-align: left; }
.az-split-actions { display:flex; gap: .75rem; flex-wrap: wrap; margin-top: 1.25rem; }
.az-media-placeholder {
  width: 100%;
  height: 100%;
  min-height: 280px;
  border-radius: 0;
  background: rgba(15, 23, 42, 0.04);
  border: 0;
  display:flex;
  align-items:center;
  justify-content:center;
  color: var(--az-muted);
  font-weight:600;
  font-size: 0.9rem;
}
.az-media-placeholder-light { color: var(--az-muted); background: #f8fafc; }
.az-hero-minimal { background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); }
.az-hero-bg { position: relative; overflow: hidden; color: #fff; }
.az-bg { position:absolute; inset:0; background-size:cover; background-position:center; }
.az-bg-fallback { background: linear-gradient(135deg, var(--az-primary), var(--az-accent)); }
.az-bg-overlay { position:absolute; inset:0; background:#000; }
.az-bg-content { position: relative; z-index: 2; text-align:center; color: #fff; }
.az-hero-left { background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); color: var(--az-foreground); }
.az-hero-left h1, .az-hero-left p { color: var(--az-foreground); }
.az-hero-left .az-left-text {
  align-self: center;
  padding-right: clamp(0.5rem, 2vw, 1.5rem);
}
.az-hero-video { position: relative; overflow:hidden; background: #0f172a; color: #fff; }
.az-video { position:absolute; inset:0; width:100%; height:100%; object-fit: cover; }
.az-video-overlay { position:absolute; inset:0; background: rgba(0,0,0,0.55); }
.az-video-content { position: relative; z-index:2; text-align:center; color: #fff; }
@media (max-width: 900px) {
  .az-split, .az-left { grid-template-columns: 1fr; }
  .az-split-text, .az-left-text { text-align:center; max-width: none; }
  .az-split-text h1, .az-left-text h1 { text-align: center; }
  .az-split-actions { justify-content: center; }
  .az-hero-split .az-split-media-frame,
  .az-hero-left .az-split-media-frame {
    height: min(360px, 55vh);
  }
  .az-hero-stack > .az-header-on-hero .az-header-inner { flex-wrap: wrap; gap: 0.65rem; }
  .az-nav { width: 100%; justify-content: center; }
}
.az-cta { position: relative; text-align: center; background: var(--az-gradient-primary); color: #fff; overflow: hidden; }
.az-cta-glow { position:absolute; top: 0; left: 50%; transform: translateX(-50%); width: 24rem; height: 24rem; border-radius: 999px; background: rgba(255,255,255,0.14); filter: blur(3rem); animation: azPulse 3s ease-in-out infinite; }
.az-cta h2 { color: #fff; }
.az-grid-3 { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); max-width: 72rem; margin: 1.5rem auto 0; }
.az-team-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; max-width: 72rem; margin: 1.5rem auto 0; }
@media (min-width: 640px) { .az-team-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .az-team-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.az-team-card { background: var(--az-card); border: 1px solid var(--az-border); border-radius: 1rem; overflow: hidden; box-shadow: var(--az-shadow-lg); text-align: left; display: flex; flex-direction: column; height: 100%; }
.az-team-photo { width: 100%; aspect-ratio: 1 / 1; background: #f1f5f9; overflow: hidden; }
.az-team-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.az-team-photo-placeholder { display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; color: var(--az-primary); background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12)); }
.az-team-body { padding: 1rem 1rem 1.15rem; display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
.az-team-name { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--az-foreground); }
.az-team-role { margin: 0; font-weight: 600; color: var(--az-primary); font-size: 0.92rem; }
.az-team-exp { margin: 0; font-size: 0.85rem; color: var(--az-muted); font-weight: 600; }
.az-team-desc { margin: 0.35rem 0 0; font-size: 0.9rem; color: var(--az-muted); line-height: 1.55; }
.az-team-v2 .az-team-grid { grid-template-columns: 1fr; }
@media (min-width: 768px) { .az-team-v2 .az-team-card { flex-direction: row; align-items: stretch; } .az-team-v2 .az-team-photo { width: 140px; max-width: 38%; aspect-ratio: auto; min-height: 160px; } }
.az-team-v3 .az-team-card { border-left: 6px solid var(--az-primary); }
.az-team-v4 { background: #0f172a; color: #fff; }
.az-team-v4 .az-team-card { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); }
.az-team-v4 .az-team-name { color: #fff; }
.az-team-v4 .az-team-desc, .az-team-v4 .az-team-exp { color: rgba(255,255,255,0.78); }
.az-grid-gap-lg { gap: 2rem; }
.az-card { background: var(--az-card); border: 1px solid var(--az-border); border-radius: 1rem; padding: 2rem; box-shadow: var(--az-shadow-lg); transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
.az-card-hover:hover { border-color: rgba(59,130,246,.5); box-shadow: var(--az-shadow-xl); transform: translateY(-2px); }
.az-card-icon { width: 3.5rem; height: 3.5rem; border-radius: .75rem; display:flex; align-items:center; justify-content:center; background: rgba(59,130,246,.12); margin-bottom: 1.25rem; font-size: 1.5rem; color: var(--az-primary); }
.az-card-center { text-align: center; }
.az-price { font-size: 1.25rem; font-weight: 800; color: var(--az-primary); }
.az-muted { color: var(--az-muted); font-size: 0.9rem; }
.az-eyebrow { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; color: var(--az-primary); font-weight: 800; }
.az-prose { max-width: 42rem; color: var(--az-muted); }
.az-offers { text-align: center; background: #0f172a; color: #fff; }
.az-code { display: inline-block; background: #fbbf24; color: #0f172a; padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-weight: 700; margin: 1rem 0; }
.az-faq { max-width: 42rem; margin: 0 auto; }
.az-faq details { border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem 1rem; margin-bottom: 0.5rem; background: #fff; }
.az-form { max-width: 32rem; margin: 0 auto; display: grid; gap: 0.75rem; }
.az-form input, .az-form textarea { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; font: inherit; }
.az-form-status { min-height: 1.25rem; font-size: 0.875rem; margin: 0; text-align: center; }
.az-form button[type="submit"]:disabled { opacity: 0.65; cursor: not-allowed; }
.az-badges span { display: inline-block; margin: 0.25rem; padding: 0.35rem 0.75rem; background: #e0f2fe; color: #0369a1; border-radius: 999px; font-size: 0.8rem; }
.az-social a { margin: 0 0.5rem; color: var(--az-primary); font-weight: 600; text-decoration: none; }
.az-footer { background: #0f172a; color: #cbd5e1; padding: 2.5rem 1.5rem; }
.az-footer a { color: #cbd5e1; margin-right: 1rem; text-decoration: none; display: block; }
.az-footer-grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); max-width: 72rem; margin: 0 auto; }
.az-copy { text-align: center; margin-top: 1.5rem; font-size: 0.85rem; opacity: 0.8; }
.az-float { position: fixed; right: 18px; z-index: 999; width: 52px; height: 52px; border-radius: 999px; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; font-weight: 700; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.az-float-wa { bottom: 88px; background: #25D366; }
.az-float-call { bottom: 24px; background: var(--az-primary); }
.az-btn-small { padding: .55rem 1rem; font-size: .9rem; }
.az-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}
.az-header-inner {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0.75rem 1.25rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}
.az-logo { font-weight: 800; font-size: 1.05rem; letter-spacing: -0.02em; color: var(--az-foreground); white-space: nowrap; }
.az-nav { display: flex; gap: 0.2rem; flex-wrap: wrap; align-items: center; justify-content: center; }
.az-nav-link {
  text-decoration: none;
  color: var(--az-muted);
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.42rem 0.7rem;
  border-radius: 999px;
  transition: color 0.15s ease, background 0.15s ease;
}
.az-nav-link:hover { color: var(--az-foreground); background: rgba(15, 23, 42, 0.05); }
.az-gallery { display:grid; gap: .75rem; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); max-width:72rem; margin: 1.5rem auto 0; }
.az-gallery img { width:100%; height:180px; object-fit: cover; border-radius: 1rem; border:1px solid #e2e8f0; }
.az-gallery-v2 img { height:220px; }
.az-search { max-width: 42rem; margin: 0 auto; }
.az-search input { width: 100%; padding: .9rem 1.1rem; border-radius: 999px; border:1px solid #e2e8f0; font: inherit; }
.az-pills { display:flex; gap:.5rem; flex-wrap: wrap; max-width:72rem; margin: 1rem auto 0; justify-content:center; }
.az-pill { border:1px solid #e2e8f0; background:#fff; border-radius:999px; padding:.45rem .85rem; font-weight:600; color: var(--az-muted); }
.az-list { max-width: 52rem; margin: 1rem auto 0; padding-left: 1.25rem; }
.az-video-wrap { max-width: 72rem; margin: 1.25rem auto 0; border-radius: 1rem; overflow: hidden; border: 1px solid #e2e8f0; background:#fff; }
.az-video-wrap iframe { width:100%; height: 360px; border:0; }
.az-sec-glow { position: absolute; width: 24rem; height: 24rem; border-radius: 999px; background: rgba(59,130,246,0.08); filter: blur(3rem); pointer-events:none; }
.az-sec-glow-1 { top: 0; left: 25%; }
.az-sec-glow-2 { bottom: 0; right: 25%; }
.az-quote { position:absolute; font-size: 9rem; font-family: serif; line-height: 1; color: rgba(59,130,246,0.06); z-index: 1; pointer-events:none; }
.az-quote-1 { top: 2.5rem; left: 2.5rem; }
.az-quote-2 { bottom: 2.5rem; right: 2.5rem; transform: rotate(180deg); }
.az-quote-text { font-size: 1.05rem; line-height: 1.75; }
@keyframes azPulse { 0%,100% { opacity:.25; } 50% { opacity:.6; } }

/* Pricing cards (Webzys-style) */
.az-pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; align-items: stretch; margin-top: 2.5rem; }
.az-plan { position: relative; background: rgba(255,255,255,0.92); border: 1px solid var(--az-border); border-radius: 1.25rem; padding: 1.75rem 1.5rem; box-shadow: var(--az-shadow-lg); display: flex; flex-direction: column; text-align: left; }
.az-plan-top { flex: 1; }
.az-plan-name { text-transform: uppercase; letter-spacing: .12em; font-size: .75rem; font-weight: 800; color: rgba(0,0,0,0.55); margin: 0 0 .75rem; }
.az-plan-priceRow { display: flex; align-items: baseline; gap: .4rem; margin: 0 0 .75rem; }
.az-plan-price { font-size: 2.25rem; font-weight: 900; color: #0b1220; }
.az-plan-period { font-size: .9rem; color: rgba(0,0,0,0.55); }
.az-plan-bookings { font-size: .95rem; font-weight: 800; color: #0b1220; margin: 0 0 .6rem; }
.az-plan-after { font-size: .82rem; color: rgba(0,0,0,0.55); margin: 0; }
.az-plan-cta { margin-top: 1.25rem; border: 0; border-radius: 999px; padding: .9rem 1rem; font-weight: 800; background: #0b1220; color: #fff; cursor: pointer; }
.az-plan-cta:hover { opacity: .92; }
.az-plan-popular { background: var(--az-gradient-primary); color: #fff; border-color: transparent; transform: translateY(-6px); }
.az-plan-popular .az-plan-name,
.az-plan-popular .az-plan-period,
.az-plan-popular .az-plan-after { color: rgba(255,255,255,0.85); }
.az-plan-popular .az-plan-price,
.az-plan-popular .az-plan-bookings { color: #fff; }
.az-plan-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: #0b1220; color: #fff; border-radius: 999px; padding: .35rem .75rem; font-size: .65rem; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; box-shadow: var(--az-shadow-lg); }
.az-plan-cta-light { background: rgba(255,255,255,0.96); color: #0b1220; }
.az-plan-footnote { text-align: center; color: rgba(0,0,0,0.55); font-size: .82rem; margin: 1.25rem 0 0; }
.appointza-org-section, .appointza-location-section, .appointza-services-section, .appointza-timings-section,
.appointza-events-section, .appointza-reviews-section, .appointza-facilities-section, .appointza-location-images-section { padding: 4rem 1.5rem; }
.appointza-org-container, .appointza-location-container, .appointza-services-container, .appointza-timings-container,
.appointza-events-container, .appointza-reviews-container, .appointza-facilities-container, .appointza-location-images-container { max-width: 72rem; margin: 0 auto; }
.appointza-org-inner { display: grid; grid-template-columns: 1fr; gap: 1.25rem; align-items: start; }
.appointza-org-left { display:flex; justify-content: center; }
.appointza-org-right { text-align: center; }
.appointza-org-logo { display:block; margin: 0 auto 1rem; width: 84px; height: 84px; object-fit: cover; border-radius: 999px; border: 1px solid #e2e8f0; background:#fff; }
.appointza-org-tagline { margin: .25rem 0 0; color: var(--az-muted); font-weight: 600; }
.appointza-org-notes { max-width: 52rem; margin: .85rem auto 0; color: var(--az-muted); }
.appointza-org-email, .appointza-org-gst { margin: .4rem 0 0; color: var(--az-muted); font-size: .95rem; }
.appointza-book-button, .appointza-service-button, .appointza-event-button { display: inline-block; background: var(--az-primary); color: #fff; padding: 0.65rem 1.25rem; border-radius: 999px; text-decoration: none; font-weight: 600; margin-top: 0.75rem; }
.appointza-service-card, .appointza-event-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 0; margin-bottom: 0; overflow: hidden; }
.appointza-timing-item, .appointza-review-item, .appointza-facility-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1rem; margin-bottom: 0; }
.appointza-services-list, .appointza-events-list, .appointza-reviews-list, .appointza-facilities-list { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.appointza-service-card, .appointza-event-card {
  display: flex;
  flex-direction: column;
  text-align: left;
}
.appointza-service-content, .appointza-event-content { padding: 1rem 1rem 1.1rem; flex: 1; min-width: 0; }
.appointza-service-media, .appointza-event-media {
  width: 100%;
  height: 180px;
  flex-shrink: 0;
  overflow: hidden;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.appointza-service-media img, .appointza-event-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.appointza-service-head, .appointza-event-head { display:flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.appointza-service-title, .appointza-event-title { margin: 0; }
.appointza-event-amount { margin: 0; font-weight: 800; color: var(--az-primary); }
.appointza-event-meta { margin: .25rem 0 0; color: var(--az-muted); font-size: .9rem; }
.appointza-service-price { margin: 0; color: var(--az-muted); font-size: .9rem; white-space: nowrap; }
.appointza-location-grid { display:grid; grid-template-columns: 1.1fr .9fr; gap: 1.25rem; align-items: start; }
.appointza-location-col { display:flex; flex-direction: column; gap: .75rem; }
.appointaza-location-images-grid, .appointza-location-images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
.appointza-location-images-grid img { width: 100%; height: 160px; object-fit: cover; border-radius: 0.75rem; }
.appointza-map-embed iframe { width: 100%; height: 320px; border: 0; border-radius: 1rem; margin-top: 1.5rem; }
.appointza-timing-item { display: flex; justify-content: space-between; }

@media (min-width: 640px) {
  .appointza-services-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .appointza-events-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .appointza-services-list { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (min-width: 640px) {
  .az-a-svc-1 .appointza-service-card,
  .az-a-svc-3 .appointza-service-card,
  .az-a-evt-1 .appointza-event-card,
  .az-a-evt-3 .appointza-event-card {
    flex-direction: row;
    align-items: stretch;
  }
  .az-a-svc-1 .appointza-service-media,
  .az-a-svc-3 .appointza-service-media,
  .az-a-evt-1 .appointza-event-media,
  .az-a-evt-3 .appointza-event-media {
    width: 38%;
    max-width: 220px;
    height: auto;
    min-height: 160px;
    border-bottom: 0;
    border-right: 1px solid #e2e8f0;
  }
}
@media (max-width: 900px) {
  .appointza-location-grid { grid-template-columns: 1fr; }
  .appointza-service-head, .appointza-event-head { flex-direction: column; align-items: flex-start; }
  .appointza-service-price { white-space: normal; }
}
@media (max-width: 639px) {
  .appointza-services-list,
  .appointza-events-list { grid-template-columns: 1fr !important; }
  .appointza-service-card, .appointza-event-card { flex-direction: column !important; }
  .appointza-service-media, .appointza-event-media {
    width: 100% !important;
    max-width: none !important;
    height: 180px !important;
    border-right: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }
}

/* Variant styling helpers (4 variants per appointza section) */
.az-a-org-card .appointza-org-container { background:#fff; border:1px solid #e2e8f0; border-radius:1.5rem; padding:2rem; box-shadow:0 16px 50px rgba(15,23,42,0.12); }
.az-a-org-min { background:#0f172a; color:#fff; }
.az-a-org-min h1, .az-a-org-min p { color:#fff; text-align:center; }
.az-a-org-split .appointza-org-inner { grid-template-columns: 120px 1fr; gap: 1.5rem; }
.az-a-org-split .appointza-org-left { justify-content: flex-start; }
.az-a-org-split .appointza-org-logo { margin: 0; width: 96px; height: 96px; }
.az-a-org-split .appointza-org-right { text-align: left; }
.az-a-org-split .appointza-org-notes { margin-left: 0; margin-right: 0; max-width: 56rem; }

.az-a-loc-1 .appointza-location-grid { grid-template-columns: 1.1fr .9fr; }
.az-a-loc-2 .appointza-location-grid { grid-template-columns: 1fr; }
.az-a-loc-2 .appointza-map-embed iframe { height: 380px; }
.az-a-loc-3 .appointza-location-container { background:#fff; border:1px solid #e2e8f0; border-radius:1.25rem; padding:1.5rem; box-shadow: 0 16px 45px rgba(15,23,42,0.08); }
.az-a-loc-3 .appointza-location-item { border-left: 6px solid var(--az-primary); }
.az-a-loc-4 { background:#0f172a; color:#fff; }
.az-a-loc-4 .appointza-location-container h2 { color:#fff; }
.az-a-loc-4 .appointza-location-link { color:#fff; text-decoration: underline; }
.az-a-loc-4 .appointza-location-item { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); }

.az-a-svc-1 .appointza-services-list { grid-template-columns: 1fr; }
.az-a-svc-2 .appointza-services-list { grid-template-columns: 1fr; }
@media (min-width: 640px) {
  .az-a-svc-2 .appointza-services-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .az-a-svc-2 .appointza-services-list { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
.az-a-svc-3 .appointza-services-list { grid-template-columns: 1fr; }
.az-a-svc-3 .appointza-service-card { border-left: 6px solid var(--az-primary); }
.az-a-svc-3 .appointza-service-content { display: grid; gap: .5rem; }
.az-a-svc-4 { background:#0f172a; color:#fff; }
.az-a-svc-4 .appointza-service-card { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); }
.az-a-svc-4 .appointza-service-price { color: rgba(255,255,255,0.8); }
.az-a-svc-4 .appointza-service-media, .az-a-svc-4 .appointza-event-media { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); }

.az-a-time-2 .appointza-timing-item { background:#fff; border:1px solid #e2e8f0; padding:.85rem 1rem; border-radius:1rem; }
.az-a-time-3 .appointza-timing-item { border:0; border-bottom:1px solid #e2e8f0; border-radius:0; }
.az-a-time-4 .appointza-timing-item { background:#0f172a; color:#fff; border:0; }

.az-a-evt-1 .appointza-events-list { grid-template-columns: 1fr; }
.az-a-evt-2 .appointza-events-list { grid-template-columns: 1fr; }
@media (min-width: 640px) {
  .az-a-evt-2 .appointza-events-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.az-a-evt-3 .appointza-events-list { grid-template-columns: 1fr; }
.az-a-evt-3 .appointza-event-card { border-left: 6px solid var(--az-accent); }
.az-a-evt-3 .appointza-event-head { align-items: center; }
.az-a-evt-4 { background:#0f172a; color:#fff; }
.az-a-evt-4 .appointza-event-card { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); }
.az-a-evt-4 .appointza-event-meta { color: rgba(255,255,255,0.75); }
.az-a-evt-4 .appointza-event-media { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); }

.az-a-rev-1 .appointza-reviews-list { display:flex; flex-direction: column; gap: .75rem; }
.az-a-rev-2 .appointza-reviews-list { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:1rem; }
.az-a-rev-3 .appointza-review-item { border-left: 6px solid var(--az-primary); }
.az-a-rev-3 blockquote { font-size: 1.05rem; }
.az-a-rev-4 { background:#0f172a; color:#fff; }
.az-a-rev-4 .appointza-review-item { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); }

.az-a-fac-1 .appointza-facilities-list { display:flex; flex-direction: column; gap: .6rem; }
.az-a-fac-2 .appointza-facilities-list { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: .75rem; }
.az-a-fac-3 .appointza-facility-item { border-left: 6px solid var(--az-primary); }
.az-a-fac-4 { background:#0f172a; color:#fff; }
.az-a-fac-4 .appointza-facility-item { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); }

.az-a-gal-2 .appointza-location-images-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.az-a-gal-3 .appointza-location-images-grid img { height: 220px; }
.az-a-gal-4 .appointza-location-images-grid { gap: 1.25rem; }
`;

/** Webzys-style export: visible blocks → single HTML document for referencevalues.description */
export function generateTemplateHtml(page: TemplateBuilderPage, documentTitle: string): string {
  const visibleBlocks = page.blocks.filter((b) => b.visible);
  const body = generatePageBodyHtml(visibleBlocks);

  const title = esc(documentTitle || page.name || "Booking page");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>${BASE_STYLES}</style>
</head>
<body>
<div class="az-page">
${body}
</div>
<script>
(function(){
  document.addEventListener('click', function(ev){
    var a = ev.target && ev.target.closest && ev.target.closest('a[data-appointza-book]');
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
