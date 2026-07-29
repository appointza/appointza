# Appointza · Live data — model & loops

Short reference for `/organization/template-builder` and public template URLs.

---

## 1. Two models (don’t mix them)

### A) Builder project (saved in DB)

Stored in **Reference Value** `notes` as JSON (`referencetypeid = 5`).

```ts
// src/types/templateBuilder.types.ts

interface TemplateBuilderProject {
  builderVersion: 2;
  pages: {
    home: {
      id: "home";
      name: string;
      blocks: TemplateBuilderBlock[];
    };
  };
}

interface TemplateBuilderBlock {
  id: string;           // unique, e.g. "appointza-services-1712345678"
  type: string;         // e.g. "appointza-services"
  data: Record<string, unknown>;  // layout only for live blocks (see below)
  visible: boolean;     // false = omitted from exported HTML
}
```

**Live block `data` (examples):**

| `type` | `data` fields |
| --- | --- |
| All `appointza-*` | `variant`: `1` \| `2` \| `3` \| `4` |
| `appointza-organization` | `showLogo` (default `true`), `showGst` (default `false`) |

No service names, hours, or reviews live in `block.data` — only layout flags.

---

### B) Runtime payload (`SiteDetailsItem`)

Loaded from API when a customer opens the **public** page.  
Type: `src/models/sitedetail.model.ts` → class `SiteDetailsItem`.

```ts
class SiteDetailsItem {
  locationdetail: LocationDetail;      // address, map, images[], templateid, …
  organisationdetail: OrganisationDetail;  // name, tagline, logo id, gst, …
  orgnaisatinservice: OrganisationService[];   // services list
  OrganisationServiceTiming: OrganisationServiceTiming[];  // hours
  template_html: string;               // optional full HTML on location
}
```

**Extra at render time** (not on the class, added in `DynamicTemplatePage.tsx`):

```ts
{ ...siteData, events: publicEvents[] }  // public events for this org + location
```

| Field | Used for block |
| --- | --- |
| `organisationdetail` | `appointza-organization` |
| `locationdetail` | `appointza-location`, `appointza-location-images` |
| `orgnaisatinservice[]` | `appointza-services` |
| `OrganisationServiceTiming[]` | `appointza-timings` |
| `events[]` (injected) | `appointza-events` |
| `locationdetail.images[]` | gallery loop |

**Note:** HTML templates also define `{{#reviews}}` and `{{#facilities}}`, but `renderSiteTemplateHtml()` does **not** fill those yet — empty lists remove those sections. Backend must add merge logic if you need them live.

---

## 2. How loops work

Engine: **custom** in `renderSiteTemplateHtml()` (`src/utils/templateRenderer.util.ts`) — not full Handlebars.

### Loop pattern

```html
{{#LOOP_NAME}}
  ... HTML with {{field}} per row ...
{{/LOOP_NAME}}
```

**Algorithm (`applyLoopSection`):**

1. Find first `{{#LOOP_NAME}}` … `{{/LOOP_NAME}}` in the template.
2. If **no markers** → remove stray markers.
3. If **array is empty** → delete the whole block (nothing shown).
4. If **array has items** → take HTML *between* markers (one row template), run it once per item, **concatenate**, replace the whole section.

```text
Template:  [before] {{#orgnaisatinservice}} <div>{{Servicename}}</div> {{/orgnaisatinservice}} [after]
Items:     [ serviceA, serviceB ]

Result:    [before] <div>A</div> <div>B</div> [after]
```

### Condition pattern (show / hide, no repeat)

```html
{{#organizationlogo}}
  <img src="...{{organisationdetail.organisationlogo}}..." />
{{/organizationlogo}}
```

Shown only if condition is true (e.g. logo id > 0). Same `{{#name}}` … `{{/name}}` syntax, but **no array** — inner HTML kept once or removed.

---

## 3. Loop & token map (production)

| Markers | Array / condition | Fields replaced inside loop |
| --- | --- | --- |
| `{{#orgnaisatinservice}}` | `siteData.orgnaisatinservice` | `{{Servicename}}`, `{{prize}}`, `{{timetaken}}`, `{{notes}}`, optional `{{#service_image_id}}` |
| `{{#OrganisationServiceTiming}}` | `siteData.OrganisationServiceTiming` | `{{day_name}}`, `{{day_of_week}}`, `{{start_time}}`, `{{end_time}}` |
| `{{#hasevents}}` | if `events.length > 0` | wraps events section |
| `{{#events}}` | `siteData.events` (injected) | `{{event_name}}`, `{{event_date}}`, `{{from_date}}`, `{{to_date}}`, `{{entry_amount}}`, `{{remainingslot}}`, `{{EVENTBOOKURL}}`, … |
| `{{#locationimages}}` | `locationdetail.images` (number[]) | `{{location_image_id}}` per image |
| `{{#reviews}}` | *not merged in code yet* | `{{rating_stars}}`, `{{comment}}` |
| `{{#facilities}}` | *not merged in code yet* | `{{facility_displaytext}}` |

**Single tokens** (no loop): `{{organisationdetail.name}}`, `{{locationdetail.city}}`, `{{BOOKNOWURL}}`, `{{environment.baseurl}}`, etc. — replaced once globally via `replaceToken()`.

**After all merges:** any remaining `{{…}}` is **stripped** so users never see raw placeholders.

---

## 4. Service & timing row shapes

**OrganisationService** (one loop row):

```ts
{
  Servicename: string;
  prize: number;        // → {{prize}} (via getServiceStartingPrice)
  timetaken: number;    // minutes → {{timetaken}}
  notes: string;
  attributes?: { ImageIds?: number[] };  // first id → service image
}
```

**OrganisationServiceTiming** (one loop row):

```ts
{
  day_of_week: number;  // 1=Mon … 7=Sun → {{day_name}}
  start_time: string;
  end_time: string;
}
```

**Event** (one loop row, from API `Event`):

```ts
{
  id, event_name, event_date, from_date, to_date,
  entry_amount, remainingslot, description, status,
  // image: event_image_id | imageid | images.ImageIds[0]
}
```

---

## 5. End-to-end flow

```text
Builder JSON (blocks)  →  generateTemplateHtml()  →  HTML + placeholders
                                                      ↓
API SiteDetailsItem + events  →  renderSiteTemplateHtml()  →  final HTML
```

| Step | Where |
| --- | --- |
| Save blocks | `referencevalues.notes` = `TemplateBuilderProject` JSON |
| Export HTML | `src/utils/templateBuilder/html.ts` |
| Public page | `DynamicTemplatePage.tsx` loads `SiteDetailsService.select(locationId)` |
| Merge | `renderSiteTemplateHtml(templateHtml, { ...siteData, events })` |

---

## 6. Builder preview (fake data)

`TemplateBuilder.tsx` → `previewMergeHtml()` only substitutes a few tokens and **one fake** service/timing row. It does **not** call the API or run full loops.

---

---

## 7. Per-block truth table (builder v2 → production)

Use this to verify “is it correct for every Appointza block?”

| Block `type` | Builder `data` | Runtime data | Loops / merge in `renderSiteTemplateHtml` | Works on public URL? |
| --- | --- | --- | --- | --- |
| `appointza-organization` | `variant`, `showLogo`, `showGst` | `organisationdetail.*`, tokens | `{{#organizationlogo}}` if logo id > 0; GST markers stripped in renderer (see gaps) | **Yes** (name, tagline, logo, book link) |
| `appointza-location` | `variant` | `locationdetail.*` | `{{#googlemaps}}`, `{{#addressline2}}` conditionals | **Yes** |
| `appointza-services` | `variant` | `orgnaisatinservice[]` | `{{#orgnaisatinservice}}` loop | **Yes** |
| `appointza-timings` | `variant` | `OrganisationServiceTiming[]` | `{{#OrganisationServiceTiming}}` loop | **Yes** |
| `appointza-events` | `variant` | `events[]` (injected, public only) | `{{#hasevents}}` + `{{#events}}` loop | **Yes** if public events exist |
| `appointza-reviews` | `variant` only | *no API field wired* | `{{#reviews}}` **not implemented** | **No** — empty review shell may show |
| `appointza-facilities` | `variant` only | *no API field wired* | `{{#facilities}}` **not implemented** | **No** — empty amenities shell may show |
| `appointza-location-images` | `variant` | `locationdetail.images[]` | `{{#locationimages}}` loop | **Yes** if images exist |

---

## 8. Is the doc correct for *every* Appointza template?

**For Template Builder exports (8 `appointza-*` blocks):** the models and loop rules above are **correct** for the six blocks marked “Yes”. Reviews and amenities are **exported in HTML but not filled at runtime** yet.

**Not covered by this doc (different system):**

| Source | What it is |
| --- | --- |
| **Preset templates** | `src/utils/templateBlocks.ts` — older section-based HTML, same *some* placeholders (`{{organisationdetail.name}}`, `{{#orgnaisatinservice}}`) but **not** the 8 block types or `TemplateBuilderProject` JSON |
| **Custom HTML** | Org can paste any HTML; only tokens that `renderSiteTemplateHtml` knows will merge |
| **`template_html` on location** | May be full HTML from builder export **or** legacy template — same merge function applies |

**Known gaps (code today):**

- `{{organizationemail}}` → always replaced with `""`
- `{{organisationdetail.organisationgstnumber}}` → **not** in `replaceToken()` (HTML uses this; model field is `gstnumber`)
- `{{#gstnumber}}` → markers removed without conditional merge
- `{{#reviews}}` / `{{#facilities}}` → no `applyLoopSection` call
- Builder UI does not expose `showLogo` / `showGst` toggles (only in default JSON / advanced JSON edit)

---

*Files: `sitedetail.model.ts`, `templateBuilder.types.ts`, `templateRenderer.util.ts`, `html.ts`, `catalog.ts`*
