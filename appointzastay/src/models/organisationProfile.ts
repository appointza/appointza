import type { ProfileSectionId } from "./stay";

function toCamelCaseKey(key: string): string {
  if (!key) return key;
  return key.charAt(0).toLowerCase() + key.slice(1);
}

/** Recursively map API PascalCase keys to camelCase for profile UI. */
export function keysToCamelCase<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => keysToCamelCase(item)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[toCamelCaseKey(k)] = keysToCamelCase(v);
    }
    return out as T;
  }
  return value;
}

export interface OrganisationPagePayload {
  organisation: Record<string, unknown>;
  currentUser?: { name?: string; email?: string };
  owner?: { name?: string };
  roomCount?: number;
  logoUrl?: string | null;
  assets?: Record<string, unknown>[];
  activeSection: ProfileSectionId;
  sectionDef: { id: string; title: string; group: string; wide?: boolean };
  editSection?: ProfileSectionId | null;
  savedSection?: string | null;
}

export function normalizeOrganisationPagePayload(raw: unknown): OrganisationPagePayload {
  const data = keysToCamelCase(raw ?? {}) as Partial<OrganisationPagePayload>;
  const organisation = (data.organisation as Record<string, unknown>) ?? {};
  const assets =
    (data.assets as Record<string, unknown>[])?.length
      ? (data.assets as Record<string, unknown>[])
      : ((organisation.assets as Record<string, unknown>[]) ?? []);
  return {
    organisation,
    currentUser: data.currentUser,
    owner: data.owner,
    roomCount: data.roomCount,
    logoUrl: data.logoUrl,
    assets,
    activeSection: data.activeSection ?? "basic",
    sectionDef: data.sectionDef ?? { id: "basic", title: "Basic information", group: "General" },
    editSection: data.editSection,
    savedSection: data.savedSection,
  };
}

/** API may send AssetCategory as enum name or numeric index. */
const ASSET_CATEGORY_NAMES = [
  "logo",
  "hero",
  "gallery",
  "favicon",
  "social",
  "document",
  "other",
] as const;

export function normalizeAssetCategory(category: unknown): string {
  if (typeof category === "number" && category >= 0 && category < ASSET_CATEGORY_NAMES.length) {
    return ASSET_CATEGORY_NAMES[category];
  }
  const text = String(category ?? "").toLowerCase();
  if (/^\d+$/.test(text)) {
    const index = Number(text);
    return ASSET_CATEGORY_NAMES[index] ?? "other";
  }
  return text || "other";
}

export function isImageAssetRecord(asset: Record<string, unknown>): boolean {
  const url = String(asset.url ?? "").trim();
  if (!url) return false;
  if (normalizeAssetCategory(asset.category) === "document") return false;

  const kind = asset.kind;
  const isUpload =
    kind === 0 ||
    String(kind ?? "")
      .toLowerCase()
      .includes("upload");

  if (isUpload) {
    const mime = String(asset.mimeType ?? "").toLowerCase();
    if (mime.startsWith("image/")) return true;
    return /\.(jpe?g|png|gif|webp|svg)$/i.test(url);
  }

  return (
    /\.(jpe?g|png|gif|webp|svg)$/i.test(url) ||
    url.includes("images.unsplash.com") ||
    url.includes("images.pexels.com")
  );
}

const ASSET_CATEGORY_LABELS: Record<string, string> = {
  logo: "Logo",
  hero: "Hero / Banner",
  gallery: "Gallery",
  favicon: "Favicon",
  social: "Social / Link",
  document: "Document",
  other: "Other",
};

export function assetCategoryLabel(category: unknown, notes?: unknown): string {
  const notesText = String(notes ?? "").trim();
  if (notesText) return notesText;
  const key = normalizeAssetCategory(category);
  return ASSET_CATEGORY_LABELS[key] ?? key;
}

export function normalizeAssetKind(kind: unknown): "upload" | "url" {
  if (kind === 0 || String(kind ?? "").toLowerCase() === "upload") return "upload";
  return "url";
}
