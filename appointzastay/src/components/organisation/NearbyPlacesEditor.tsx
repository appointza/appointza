import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "@/utils/environment";
import { AssetImagePicker, findLibraryAsset, toLibraryAssets } from "./AssetImagePicker";
import { FieldInfoTip } from "./ProfileUi";

export type NearbyPlaceDraft = {
  name: string;
  distance: string;
  travelTime: string;
  icon: string;
  imageUrl: string;
  imageAssetId: string;
  mapUrl: string;
};

export function emptyNearbyDraft(): NearbyPlaceDraft {
  return { name: "", distance: "", travelTime: "", icon: "", imageUrl: "", imageAssetId: "", mapUrl: "" };
}

export function nearbyFromOrgItem(raw: Record<string, unknown>): NearbyPlaceDraft {
  return {
    name: String(raw.name ?? ""),
    distance: String(raw.distance ?? ""),
    travelTime: String(raw.travelTime ?? raw.TravelTime ?? ""),
    icon: String(raw.icon ?? ""),
    imageUrl: String(raw.imageUrl ?? raw.ImageUrl ?? ""),
    imageAssetId: String(raw.imageAssetId ?? raw.ImageAssetId ?? ""),
    mapUrl: String(raw.mapUrl ?? raw.MapUrl ?? ""),
  };
}

export function nearbyDraftToPayload(draft: NearbyPlaceDraft): Record<string, unknown> {
  return {
    name: draft.name.trim(),
    distance: draft.distance.trim(),
    travelTime: draft.travelTime.trim() || null,
    icon: draft.icon.trim() || null,
    imageUrl: draft.imageUrl.trim() || null,
    imageAssetId: draft.imageAssetId.trim() || null,
    mapUrl: draft.mapUrl.trim() || null,
  };
}

function Field({
  label,
  info,
  children,
  className,
}: {
  label: string;
  info?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-muted-foreground ${className ?? ""}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        {info ? <FieldInfoTip text={info} /> : null}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "org-profile-input h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground";

export function NearbyPlacesEditor({
  items,
  assets,
  logoAssetId,
  onChange,
  hideAddButton = false,
}: {
  items: NearbyPlaceDraft[];
  assets: Record<string, unknown>[];
  logoAssetId?: string;
  onChange: (items: NearbyPlaceDraft[]) => void;
  hideAddButton?: boolean;
}) {
  const rows = items.length > 0 ? items : [emptyNearbyDraft()];
  const library = toLibraryAssets(assets, { logoAssetId });

  const update = (index: number, patch: Partial<NearbyPlaceDraft>) => {
    const base = items.length > 0 ? items : [emptyNearbyDraft()];
    onChange(base.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const add = () => onChange([...rows, emptyNearbyDraft()]);
  const remove = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [emptyNearbyDraft()]);
  };

  return (
    <div className="space-y-4">
      {!hideAddButton ? (
        <div className="org-profile-editor-toolbar">
          <button type="button" className="org-profile-add-row org-profile-add-row-top" onClick={add}>
            <Plus className="h-4 w-4" />
            Add place
          </button>
        </div>
      ) : null}
      <p className="org-profile-hint mb-0">
        Add landmarks near your property so guests know what’s close by. Pick a photo from your{" "}
        <Link to="/staff/organisation?section=uploads" className="text-primary hover:underline">
          image library
        </Link>{" "}
        for each place.
      </p>

      {rows.map((row, index) => {
        const selectedId =
          row.imageAssetId ||
          findLibraryAsset(library, row.imageUrl)?.id ||
          "";
        return (
          <article
            key={`nearby-${index}`}
            className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {row.imageUrl ? (
                  <img
                    src={resolveMediaUrl(row.imageUrl)}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-md border object-cover"
                  />
                ) : null}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {row.name.trim() || `Place ${index + 1}`}
                  </p>
                  {selectedId ? (
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">asset: {selectedId}</p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-destructive"
                onClick={() => remove(index)}
                title="Remove place"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Name"
                info="Name of the place guests will recognize (e.g. Botanical Garden, Bus Stand, Lake)."
                className="sm:col-span-2"
              >
                <input
                  className={inputClass}
                  value={row.name}
                  placeholder="Botanical Garden"
                  onChange={(e) => update(index, { name: e.target.value })}
                />
              </Field>
              <Field
                label="Distance"
                info="How far from your property (e.g. 2 km, 500 m). Shown on the website nearby section."
              >
                <input
                  className={inputClass}
                  value={row.distance}
                  placeholder="2 km"
                  onChange={(e) => update(index, { distance: e.target.value })}
                />
              </Field>
              <Field
                label="Travel time"
                info="Typical time to get there (e.g. 10 min drive, 5 min walk)."
              >
                <input
                  className={inputClass}
                  value={row.travelTime}
                  placeholder="10 min drive"
                  onChange={(e) => update(index, { travelTime: e.target.value })}
                />
              </Field>
              <Field
                label="Google Maps link"
                info="Paste a Google Maps share link for this place so guests can open directions in one tap."
                className="sm:col-span-2 lg:col-span-3"
              >
                <input
                  className={inputClass}
                  type="url"
                  value={row.mapUrl}
                  placeholder="https://maps.google.com/…"
                  onChange={(e) => update(index, { mapUrl: e.target.value })}
                />
              </Field>
            </div>

            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Place photo
              <FieldInfoTip text="Optional photo of the landmark. Click an image from your library to attach it." />
            </div>
            <AssetImagePicker
              assets={library}
              selectedIds={selectedId ? [selectedId] : []}
              label="Place photo"
              onChange={(selected) => {
                const asset = selected[0];
                update(index, {
                  imageAssetId: asset?.id ?? "",
                  imageUrl: asset?.url ?? "",
                });
              }}
            />
          </article>
        );
      })}
    </div>
  );
}
