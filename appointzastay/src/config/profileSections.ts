import { normalizeAssetCategory } from "@/models/organisationProfile";
import type { ProfileSectionId } from "@/models/stay";

export interface ProfileSectionDef {
  id: ProfileSectionId;
  title: string;
  group: string;
  wide?: boolean;
}

export const PROFILE_SECTION_DEFS: ProfileSectionDef[] = [
  { id: "basic", title: "Basic information", group: "General" },
  { id: "location", title: "Location", group: "General" },
  { id: "contact", title: "Contact", group: "General" },
  { id: "policies", title: "Check-in & policies", group: "General" },
  { id: "schedule", title: "Slots & closures", group: "General", wide: true },
  { id: "website", title: "Website & domain", group: "Website" },
  { id: "uploads", title: "Images & assets", group: "Website", wide: true },
  { id: "seo", title: "SEO", group: "Website" },
  { id: "messaging", title: "SMS & WhatsApp", group: "Settings", wide: true },
  { id: "payments", title: "Payments (Razorpay)", group: "Settings", wide: true },
  { id: "weather", title: "Weather", group: "Settings" },
  { id: "highlights", title: "Highlights", group: "Content", wide: true },
  { id: "amenities", title: "Amenities", group: "Content", wide: true },
  { id: "packages", title: "Packages", group: "Content", wide: true },
  { id: "guest-services", title: "Guest services", group: "Content", wide: true },
  { id: "offers", title: "Offers", group: "Content", wide: true },
  { id: "images", title: "Property images", group: "Content", wide: true },
  { id: "nearby", title: "Nearby places", group: "Content" },
  { id: "activities", title: "Activities", group: "Content" },
  { id: "reviews", title: "Reviews", group: "Content", wide: true },
  { id: "food", title: "Food menu", group: "Content", wide: true },
  { id: "travel", title: "Travel information", group: "Content" },
  { id: "faq", title: "FAQ", group: "Content", wide: true },
];

const VALID_IDS = new Set(PROFILE_SECTION_DEFS.map((s) => s.id));

export function normalizeSectionId(id?: string | null): ProfileSectionId {
  if (id && VALID_IDS.has(id as ProfileSectionId)) return id as ProfileSectionId;
  return "basic";
}

export function getSectionDef(id: ProfileSectionId): ProfileSectionDef {
  return PROFILE_SECTION_DEFS.find((s) => s.id === id) ?? PROFILE_SECTION_DEFS[0];
}

export function sectionGroups() {
  const groups = new Map<string, ProfileSectionDef[]>();
  for (const s of PROFILE_SECTION_DEFS) {
    const list = groups.get(s.group) ?? [];
    list.push(s);
    groups.set(s.group, list);
  }
  return Array.from(groups.entries());
}

export function countForSection(
  org: Record<string, unknown>,
  id: ProfileSectionId,
  assets?: Record<string, unknown>[]
): number {
  const assetList = assets ?? ((org.assets as unknown[]) ?? []);
  const logoId = org.logoAssetId as string | undefined;
  switch (id) {
    case "highlights":
      return ((org.highlights as unknown[]) ?? []).length;
    case "amenities":
      return ((org.amenities as unknown[]) ?? []).length;
    case "packages":
      return ((org.packages as unknown[]) ?? []).length;
    case "guest-services":
      return ((org.guestServices as unknown[]) ?? []).length;
    case "offers":
      return ((org.offers as unknown[]) ?? []).length;
    case "images":
      return ((org.images as unknown[]) ?? []).length;
    case "uploads":
      return assetList.filter((a) => {
        const asset = a as { id?: string; category?: unknown };
        return normalizeAssetCategory(asset.category) !== "logo" && asset.id !== logoId;
      }).length;
    case "nearby":
      return ((org.nearbyPlaces as unknown[]) ?? []).length;
    case "activities":
      return ((org.activities as unknown[]) ?? []).length;
    case "reviews":
      return ((org.reviews as unknown[]) ?? []).length;
    case "food":
      return ((org.foodMenu as unknown[]) ?? []).length;
    case "travel":
      return (
        ((org.travelInfo as unknown[]) ?? []).length +
        (((org.contactInfo as { travelDistances?: unknown[] })?.travelDistances) ?? []).length
      );
    case "faq":
      return ((org.faq as unknown[]) ?? []).length;
    case "schedule":
      return (
        ((org.slots as unknown[]) ?? []).length + ((org.closures as unknown[]) ?? []).length
      );
    default:
      return 0;
  }
}
