# Appointza — Business overview & pitch guide

Use this **README-style document** to draft one-pagers, investor notes, partner briefs, or internal strategy. It maps the product to four pillars, then gives **per-screen talking points**.

---

## How to read the pillars

| Pillar | Meaning |
| --- | --- |
| **§1** | Business overview — what Appointza is and what you deliver |
| **§2** | Problem & solution |
| **§3** | Business model — subscriptions, charges, add-ons |
| **§4** | Market opportunity — who buys and which verticals repeat |

Replace generic claims with **your** real pricing, geography, and ICP.

---

## 1. Business overview

**What Appointza is:** A booking and operations platform (**SaaS**) for **service businesses** and **event organizers**. Merchants configure services, locations, staff, hours, and payments; customers discover businesses, book **appointments or events**, and pay online where enabled.

**Emphasize:** Hosted booking journeys, organization dashboards, reminders, integrations, and payments—whether you monetize **B2B** (merchant subscriptions), **B2C** (end-users), or both.

---

## 2. Problem & solution

**Problem:** Many salons, clinics, studios, tutors, and event teams still use phones, spreadsheets, chat threads, manual follow-ups, and ad hoc payments—leading to double bookings, leakage, no-shows, and poor visibility.

**Solution:** A single place for **live availability**, **rules** (hours, staff, capacity), **confirmations**, **payments**, and **history**—reducing friction for businesses and customers.

**Tip:** Tie each product area to a pain (manual scheduling → calendar + rules; payment chase → online pay; events → registrations and check-in).

---

## 3. Business model

- **Subscription (monthly / yearly)** — per seat, per location, or per organization tier, depending on plan design.  
- **Take rate / transaction fees** — optional on prepaid bookings when payment flows through the platform.  
- **Add-ons** — setup, onboarding, customization, integrations, messaging packs, featured listings (if offered).

**In the product:** Use the public **Pricing / plans** page and org **Payment settings** to anchor how **merchants pay you** versus how **consumers pay merchants**.

---

## 4. Market opportunity

**Example segments:**

- Beauty & wellness — salons, spas, barbers  
- Health — clinics, diagnostics, therapists (where regulations allow scheduling)  
- Fitness & studios — gyms, trainers, classes  
- Professional services — consulting, tutors, photographers  
- Events — workshops, campuses, fairs, capacity-limited registrations  

**In the product:** Explore / browse flows, catalogs, and **per-organization booking links** illustrate repeatable verticals.

---

## Product notes (cross-cutting)

**Multi-brand routes (e.g. Momantza / Campusza-style):** Describe as **sibling brands or vertical wedges** on **shared booking infrastructure**, unless stacks are genuinely separate.

**Custom domains / templates (`/template/…`, `/public/org/…`, similar):** Position as **hosted commerce frontends** so merchants publish without rebuilding core booking logic.

**Login / register / OTP:** Frame as **trust, compliance, and reliable contact**—not pointless friction. Supports §2 (fewer bad bookings / clearer intent) and §4 (mobile-first locales).

---

## Organization workspace — what each screen proves

| Typical route | Name | What it is | §1 | §2 | §3 | §4 |
| --- | --- | --- | --- | --- | --- | --- |
| `/organization/dashboard` | Dashboard | KPIs, trends, location search | Operator value at a glance | “Unknown performance” → unified metrics | Sticky SaaS / ROI | Per-vertical examples |
| `/organization/appointments` | Appointments | Bookings workload & statuses | Daily digital ops | Phone tag/errors → single queue | Prepay vs venue; volume narrative | Staff, multi-service |
| `/organization/event-bookings` | Event bookings | Registrations, capacity | Beyond 1:1 appointments | Spreadsheet chaos → one flow | Event / seat revenue | Workshops, campuses |
| `/organization/services` | Services | Catalog & pricing rules | SaaS-visible commercial menu | Wrong quotes → enforced catalog | Upsell tiers / usage | SKU-style verticals |
| `/organization/clients` | Clients | CRM-lite roster & actions | Relationships retained | Fragmented notes → profiles | Campaign / retention add-ons later | Repeat-visit sectors |
| `/organization/clients/on-spot-registration` | On-spot registration | Walk-in capture | Offline → ledger | Guest lists → digital | Efficiency story | Front-desk venues |
| `/organization/locations` | Locations | Branches | Multi-site story | Branch sprawl → one model | Per-location pricing | Chains / franchise |
| `/organization/staff` | Staff | Staff & capacity | Workforce-aware SaaS | Double-booking people | Seat-based SaaS | Provider-named services |
| `/organization/timing` | Hours | Opening rules | Reliability | Wrong published hours → single source | Config depth | Universal |
| `/organization/templates` | Templates | Branded landing | Premium positioning | Weak booking links → branded UX | Template / services revenue | Brand-led SMBs |
| `/organization/booking-page` | Booking page | Shareable links | Merchant GTM on your stack | Low conversion → self-serve URL | Scalable distribution | SEO / social |
| `/organization/payment-settings` | Payment settings | PSP & rules | Financial layer | Payment chase → rails | Transaction economics | Deposits / courses |
| `/organization/reference-values` | Reference values | Custom fields | Vertical flexibility | Rigid CRM → configurability | Enterprise-style wedge | Heavy forms |
| `/organization/profile` | Profile hub | Admin settings tabs | Easy rollout | Too many tools → one cockpit | Lower onboarding CAC | Owner-operators |
| `/organization/settings` | Settings | Org policy toggles | Enterprise readiness | “Can’t configure” → knobs | Upsell gated features | Multi-user admins |

---

## Public & acquisition

| Typical route(s) | Name | What it is | §1 | §2 | §3 | §4 |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Home | Marketing entry | Appointment + SaaS story | Problem/outcomes | Pricing CTA | Segment hints |
| `/plans` | Plans | Packaging | SKU clarity | Value vs price | ARR mechanics | Tier → persona |
| `/explore`, `/explore-services` | Explore | Discovery | Aggregation story | Awareness → trust gap | Monetized discovery later | Geo/category |
| `/organization/:id`, `/public/org/:id`, … | Public org | Tenant site | Tenant on infra | Avoid custom dev | Merchant expansion | Playbook repetition |
| `/services`, `/events` | Browse | Intent feeds | Dual product (svc + evt) | Catalog sprawl narrative | Booking / event throughput | Multi-vertical |

---

## End-customer journeys

| Typical route(s) | Name | What it is | §1 | §2 | §3 | §4 |
| --- | --- | --- | --- | --- | --- | --- |
| `/book-appointment/…` | Book flow | Core conversion UX | Investor walkthrough artifact | Friction kills revenue | Payment conversion KPIs | Mobile-first storefront |
| `/user/dashboard` | User dashboard | Summary home | Engagement surface | Chaos after booking → clarity | Helps merchant retention | Loyalty-heavy categories |
| `/user/appointments` | My appointments | Manage bookings | Transparency | Single source of truth | Less support overhead | Repeat buyers |
| `/user/events`, `/user/my-event-bookings` | Events | Registrations | Events wedge | Ticketing chaos | Higher ARPU stories | Institutions / hobbies |
| `/user/profile` | Profile | Contact & prefs | Reliable ops | Wrong details → no-shows | Messaging / compliance | All B2C services |

---

## Next steps for your README or deck

1. Paste §1–§4 into a slide outline.  
2. Pick 5–10 rows from the tables that match **your** ICP screenshots.  
3. Add **numbers**: MRR tiers, GMV or booking count, churn, geography.  

For day-to-day end-user instructions, keep using **[USER_MANUAL.md](./USER_MANUAL.md)**.
