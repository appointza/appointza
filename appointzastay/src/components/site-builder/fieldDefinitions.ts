import type { BlockKind } from "./blocks";

export type FieldType = "text" | "textarea" | "color" | "boolean" | "select";

export interface BlockFieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { label: string; value: string }[];
}

const HERO_FIELDS: BlockFieldDef[] = [
  { key: "eyebrow", label: "Eyebrow", type: "text" },
  { key: "title", label: "Title", type: "text" },
  { key: "subtitle", label: "Subtitle", type: "textarea" },
  { key: "primaryCta", label: "Primary CTA", type: "text" },
  { key: "secondaryCta", label: "Secondary CTA", type: "text" },
];

const SECTION_FIELDS: BlockFieldDef[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "subtitle", label: "Subtitle", type: "textarea" },
];

export const CONTENT_FIELDS_BY_KIND: Record<BlockKind, BlockFieldDef[]> = {
  nav: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "logo", label: "Logo (API)", type: "text" },
  ],
  hero: HERO_FIELDS,
  heroSplit: [...HERO_FIELDS, { key: "imageLabel", label: "Image label", type: "text" }],
  heroShowcase: HERO_FIELDS,
  heroBackground: HERO_FIELDS.filter((f) => f.key !== "secondaryCta"),
  heroVideo: HERO_FIELDS.filter((f) => f.key !== "secondaryCta"),
  heroAnimated: HERO_FIELDS,
  heroMinimal: HERO_FIELDS.filter((f) => f.key !== "secondaryCta" && f.key !== "eyebrow"),
  heroCards: [
    { key: "title", label: "Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
  ],
  heroSaas: [
    { key: "badge", label: "Badge", type: "text" },
    ...HERO_FIELDS,
  ],
  hero3d: HERO_FIELDS,
  features: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "title", label: "Title", type: "text" },
  ],
  services: [{ key: "title", label: "Title", type: "text" }],
  stats: [],
  pricing: [{ key: "title", label: "Title", type: "text" }],
  testimonials: [],
  faq: [{ key: "title", label: "Title", type: "text" }],
  contact: SECTION_FIELDS,
  cta: [
    { key: "title", label: "Headline", type: "text" },
    { key: "cta", label: "Button label", type: "text" },
    { key: "buttonLabel", label: "Button label (API)", type: "text" },
  ],
  footer: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "logo", label: "Logo (API)", type: "text" },
    { key: "tagline", label: "Tagline", type: "text" },
    { key: "copyright", label: "Copyright", type: "text" },
  ],
  hotelHero: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "hotelName", label: "Property name (API)", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
    { key: "tagline", label: "Tagline (API)", type: "textarea" },
    { key: "primaryCta", label: "CTA", type: "text" },
    { key: "ctaLabel", label: "CTA (API)", type: "text" },
  ],
  hotelAbout: [
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
  ],
  hotelRooms: [{ key: "title", label: "Title", type: "text" }],
  hotelAllRooms: [
    { key: "title", label: "Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
    { key: "showStatus", label: "Show room status badges", type: "boolean" },
  ],
  hotelAmenities: [{ key: "title", label: "Title", type: "text" }],
  hotelGallery: [{ key: "title", label: "Title", type: "text" }],
  hotelBooking: [
    { key: "cta", label: "CTA", type: "text" },
    { key: "ctaLabel", label: "CTA (API)", type: "text" },
  ],
  hotelPackages: SECTION_FIELDS,
  hotelReviews: [{ key: "title", label: "Title", type: "text" }],
  hotelNearby: [{ key: "title", label: "Title", type: "text" }],
  hotelContact: [
    { key: "title", label: "Title", type: "text" },
    { key: "address", label: "Address", type: "textarea" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "whatsapp", label: "WhatsApp", type: "text" },
  ],
  hotelPolicies: [{ key: "title", label: "Title", type: "text" }],
  hotelPayment: [
    { key: "title", label: "Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
    { key: "cta", label: "CTA", type: "text" },
    { key: "ctaLabel", label: "CTA (API)", type: "text" },
  ],
};

export const STYLE_FIELDS: BlockFieldDef[] = [
  { key: "backgroundColor", label: "Background", type: "color" },
  { key: "textColor", label: "Text color", type: "color" },
];

export const CONFIG_FIELDS_BY_KIND: Partial<Record<BlockKind, BlockFieldDef[]>> = {
  nav: [
    { key: "sticky", label: "Sticky header", type: "boolean" },
    {
      key: "layout",
      label: "Layout",
      type: "select",
      options: [
        { label: "Centered", value: "centered" },
        { label: "Split", value: "split" },
        { label: "Minimal", value: "minimal" },
      ],
    },
  ],
  features: [
    {
      key: "columns",
      label: "Columns",
      type: "select",
      options: [
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" },
      ],
    },
  ],
};

export function getContentFieldsForKind(kind: BlockKind): BlockFieldDef[] {
  return CONTENT_FIELDS_BY_KIND[kind] ?? [{ key: "title", label: "Title", type: "text" }];
}

export function getConfigFieldsForKind(kind: BlockKind): BlockFieldDef[] {
  return CONFIG_FIELDS_BY_KIND[kind] ?? [];
}

/** @deprecated */
export function getContentFields(type: string): BlockFieldDef[] {
  return [{ key: "title", label: "Title", type: "text" }];
}

/** @deprecated */
export function getConfigFields(_type: string): BlockFieldDef[] {
  return [];
}
