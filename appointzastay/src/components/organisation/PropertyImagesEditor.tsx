import { Link } from "react-router-dom";
import { AssetImagePicker, toLibraryAssets } from "./AssetImagePicker";

export type PropertyImageDraft = {
  assetId: string;
  label: string;
  category: string;
  url: string;
};

export function emptyPropertyImageDraft(): PropertyImageDraft {
  return { assetId: "", label: "", category: "Gallery", url: "" };
}

export function propertyImageFromOrgItem(raw: Record<string, unknown>): PropertyImageDraft {
  return {
    assetId: String(raw.assetId ?? raw.AssetId ?? ""),
    label: String(raw.label ?? raw.Label ?? ""),
    category: String(raw.category ?? raw.Category ?? ""),
    url: String(raw.url ?? raw.Url ?? ""),
  };
}

export function propertyImageDraftToPayload(draft: PropertyImageDraft): Record<string, unknown> {
  return {
    assetId: draft.assetId.trim() || null,
    label: draft.label.trim(),
    category: draft.category.trim() || "Gallery",
    url: draft.url.trim(),
  };
}

export function PropertyImagesEditor({
  items,
  assets,
  logoAssetId,
  onChange,
  uploadsHref = "/staff/organisation?section=uploads",
}: {
  items: PropertyImageDraft[];
  assets: Record<string, unknown>[];
  logoAssetId?: string;
  onChange: (items: PropertyImageDraft[]) => void;
  /** @deprecated unused — kept for call-site compatibility */
  hideAddButton?: boolean;
  uploadsHref?: string;
}) {
  const library = toLibraryAssets(assets, { logoAssetId });
  const selectedIds = items.map((r) => r.assetId).filter(Boolean);
  const byId = new Map(items.map((r) => [r.assetId, r]));

  return (
    <div className="space-y-3">
      <p className="org-profile-hint mb-0">
        All uploaded images are shown below. Click to select the ones for your property gallery
        {selectedIds.length > 0 ? ` · ${selectedIds.length} selected` : ""}.
      </p>
      <AssetImagePicker
        assets={library}
        multiple
        selectedIds={selectedIds}
        label="Your images"
        onChange={(selected) => {
          onChange(
            selected.map((asset) => {
              const existing = byId.get(asset.id);
              return {
                assetId: asset.id,
                url: asset.url,
                label: existing?.label?.trim() || asset.title,
                category: existing?.category?.trim() || "Gallery",
              };
            }),
          );
        }}
      />
      {library.length === 0 ? (
        <p className="org-profile-empty">
          No images in your library yet.{" "}
          <Link to={uploadsHref} className="text-primary hover:underline">
            Upload images
          </Link>{" "}
          first, then come back and select them here.
        </p>
      ) : null}
    </div>
  );
}
