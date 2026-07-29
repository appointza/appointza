import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { isImageAssetRecord, normalizeAssetCategory } from "@/models/organisationProfile";
import { resolveMediaUrl } from "@/utils/environment";

export type LibraryAsset = {
  id: string;
  url: string;
  title: string;
};

function isLogoAsset(asset: Record<string, unknown>, logoAssetId?: string): boolean {
  const id = String(asset.id ?? "");
  if (logoAssetId && id === logoAssetId) return true;
  return normalizeAssetCategory(asset.category) === "logo";
}

/** Normalize organisation assets into pickable library items (excludes logo by default). */
export function toLibraryAssets(
  assets: Record<string, unknown>[],
  options?: { logoAssetId?: string; includeLogo?: boolean },
): LibraryAsset[] {
  const logoAssetId = options?.logoAssetId;
  const includeLogo = options?.includeLogo === true;
  return assets
    .filter((asset) => isImageAssetRecord(asset) && (includeLogo || !isLogoAsset(asset, logoAssetId)))
    .map((asset) => ({
      id: String(asset.id ?? ""),
      url: String(asset.url ?? "").trim(),
      title: String(asset.title ?? "Image").trim() || "Image",
    }))
    .filter((a) => a.id && a.url);
}

export function findLibraryAsset(
  assets: LibraryAsset[],
  idOrUrl: string | null | undefined,
): LibraryAsset | undefined {
  const key = String(idOrUrl ?? "").trim();
  if (!key) return undefined;
  return assets.find((a) => a.id === key || a.url === key);
}

export function AssetImagePicker({
  assets,
  selectedIds = [],
  onChange,
  multiple = false,
  label = "Choose from image library",
  logoAssetId,
  includeLogo = false,
}: {
  assets: Record<string, unknown>[] | LibraryAsset[];
  selectedIds?: string[];
  onChange: (selected: LibraryAsset[]) => void;
  multiple?: boolean;
  label?: string;
  logoAssetId?: string;
  includeLogo?: boolean;
}) {
  const library: LibraryAsset[] = Array.isArray(assets)
    ? assets.every((a) => a && typeof a === "object" && "id" in a && "url" in a && !("category" in a) && !("kind" in a))
      ? (assets as LibraryAsset[])
      : toLibraryAssets(assets as Record<string, unknown>[], { logoAssetId, includeLogo })
    : [];

  const selectedSet = new Set(selectedIds.filter(Boolean));

  const toggle = (asset: LibraryAsset) => {
    if (multiple) {
      const next = selectedSet.has(asset.id)
        ? library.filter((a) => selectedSet.has(a.id) && a.id !== asset.id)
        : [...library.filter((a) => selectedSet.has(a.id)), asset];
      onChange(next);
      return;
    }
    onChange(selectedSet.has(asset.id) ? [] : [asset]);
  };

  return (
    <div className="org-profile-asset-picker-block">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h5 className="text-sm font-semibold text-foreground">{label}</h5>
        {library.length > 0 ? (
          <span className="text-xs text-muted-foreground">
            {multiple ? "Click to add / remove" : "Click to select"} · {library.length} available
          </span>
        ) : null}
      </div>
      {library.length > 0 ? (
        <div className="org-profile-asset-picker-grid">
          {library.map((asset) => {
            const selected = selectedSet.has(asset.id);
            return (
              <button
                key={asset.id}
                type="button"
                className={`org-profile-asset-picker-item${selected ? " org-profile-asset-picker-item-selected" : ""}`}
                title={`${asset.title} (${asset.id})`}
                onClick={() => toggle(asset)}
              >
                <img src={resolveMediaUrl(asset.url)} alt="" loading="lazy" />
                {selected ? (
                  <span className="org-profile-asset-picker-check" aria-hidden>
                    <Check className="h-3 w-3" />
                  </span>
                ) : null}
                <span className="org-profile-asset-picker-label">{asset.title}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="org-profile-empty">
          No images yet.{" "}
          <Link to="/staff/organisation?section=uploads" className="text-primary hover:underline">
            Upload images
          </Link>{" "}
          first — then select them here by ID.
        </p>
      )}
    </div>
  );
}
