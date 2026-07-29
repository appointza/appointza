import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "@/utils/environment";
import { AssetImagePicker, findLibraryAsset, toLibraryAssets, type LibraryAsset } from "./AssetImagePicker";
import { FieldInfoTip } from "./ProfileUi";

export type PackageDraft = {
  id: string;
  name: string;
  description: string;
  price: string;
  validFrom: string;
  validTo: string;
  minimumNights: number;
  maxGuests: number;
  includedGuests: number;
  extraGuestCharge: number;
  roomType: string;
  includesText: string;
  addOnsText: string;
  kind: string;
  badge: string;
  imageUrl: string;
  imageAssetId: string;
  imageUrlsText: string;
  imageAssetIds: string[];
  sortOrder: number;
  isActive: boolean;
};

function asList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,;]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function listToText(value: unknown): string {
  return asList(value).join(", ");
}

export function emptyPackageDraft(sortOrder = 0): PackageDraft {
  return {
    id: "",
    name: "",
    description: "",
    price: "",
    validFrom: "",
    validTo: "",
    minimumNights: 1,
    maxGuests: 10,
    includedGuests: 5,
    extraGuestCharge: 0,
    roomType: "",
    includesText: "",
    addOnsText: "",
    kind: "stay",
    badge: "",
    imageUrl: "",
    imageAssetId: "",
    imageUrlsText: "",
    imageAssetIds: [],
    sortOrder,
    isActive: true,
  };
}

export function packageFromOrgItem(raw: Record<string, unknown>, index: number): PackageDraft {
  const kindRaw = String(raw.kind ?? "stay").toLowerCase();
  const kind = kindRaw === "addon" ? "addon" : kindRaw === "standard" ? "stay" : kindRaw || "stay";
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    price: String(raw.price ?? ""),
    validFrom: String(raw.validFrom ?? raw.ValidFrom ?? ""),
    validTo: String(raw.validTo ?? raw.ValidTo ?? ""),
    minimumNights: Number(raw.minimumNights ?? raw.MinimumNights ?? 1) || 1,
    maxGuests: Number(raw.maxGuests ?? raw.MaxGuests ?? 2) || 2,
    includedGuests:
      Number(raw.includedGuests ?? raw.IncludedGuests ?? raw.maxGuests ?? raw.MaxGuests ?? 2) || 2,
    extraGuestCharge: Number(raw.extraGuestCharge ?? raw.ExtraGuestCharge ?? 0) || 0,
    roomType: String(raw.roomType ?? raw.RoomType ?? ""),
    includesText: listToText(raw.includes ?? raw.Includes),
    addOnsText: listToText(raw.addOns ?? raw.AddOns),
    kind,
    badge: String(raw.badge ?? ""),
    imageUrl: String(raw.imageUrl ?? raw.ImageUrl ?? ""),
    imageAssetId: String(raw.imageAssetId ?? raw.ImageAssetId ?? ""),
    imageUrlsText: listToText(raw.imageUrls ?? raw.ImageUrls),
    imageAssetIds: asList(raw.imageAssetIds ?? raw.ImageAssetIds),
    sortOrder: Number(raw.sortOrder ?? index) || 0,
    isActive: raw.isActive !== false,
  };
}

export function packageDraftToPayload(draft: PackageDraft): Record<string, unknown> {
  const includes = asList(draft.includesText);
  const addOns = asList(draft.addOnsText);
  const imageAssetIds = draft.imageAssetIds.filter(Boolean);
  const coverId = draft.imageAssetId.trim() || imageAssetIds[0] || "";
  const imageUrls = asList(draft.imageUrlsText);
  const cover = draft.imageUrl.trim() || imageUrls[0] || "";
  return {
    id: draft.id,
    name: draft.name.trim(),
    description: draft.description.trim(),
    price: draft.price.trim(),
    validFrom: draft.validFrom,
    validTo: draft.validTo,
    minimumNights: Math.max(1, Number(draft.minimumNights) || 1),
    maxGuests: Math.max(1, Number(draft.maxGuests) || 1),
    includedGuests: Math.max(
      1,
      Math.min(Number(draft.includedGuests) || 1, Math.max(1, Number(draft.maxGuests) || 1)),
    ),
    extraGuestCharge: Math.max(0, Number(draft.extraGuestCharge) || 0),
    roomType: draft.roomType.trim(),
    includes,
    addOns,
    kind: draft.kind === "addon" ? "addon" : "stay",
    badge: draft.badge.trim() || null,
    imageAssetId: coverId || null,
    imageAssetIds: coverId && !imageAssetIds.includes(coverId) ? [coverId, ...imageAssetIds] : imageAssetIds,
    imageUrl: cover,
    imageUrls: cover && !imageUrls.includes(cover) ? [cover, ...imageUrls] : imageUrls,
    sortOrder: Number(draft.sortOrder) || 0,
    isActive: Boolean(draft.isActive),
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

export function PackagesEditor({
  items,
  assets = [],
  logoAssetId,
  onChange,
  hideAddButton = false,
}: {
  items: PackageDraft[];
  assets?: Record<string, unknown>[];
  logoAssetId?: string;
  onChange: (items: PackageDraft[]) => void;
  hideAddButton?: boolean;
}) {
  const rows = items.length > 0 ? items : [emptyPackageDraft(0)];
  const library = toLibraryAssets(assets, { logoAssetId });

  const update = (index: number, patch: Partial<PackageDraft>) => {
    const base = items.length > 0 ? items : [emptyPackageDraft(0)];
    onChange(base.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const add = () => onChange([...rows, emptyPackageDraft(rows.length)]);
  const remove = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [emptyPackageDraft(0)]);
  };

  const applyImages = (index: number, selected: LibraryAsset[]) => {
    const cover = selected[0];
    update(index, {
      imageAssetId: cover?.id ?? "",
      imageUrl: cover?.url ?? "",
      imageAssetIds: selected.map((a) => a.id),
      imageUrlsText: selected.map((a) => a.url).join("\n"),
    });
  };

  return (
    <div className="space-y-4">
      {!hideAddButton ? (
        <div className="org-profile-editor-toolbar">
          <button type="button" className="org-profile-add-row org-profile-add-row-top" onClick={add}>
            <Plus className="h-4 w-4" />
            Add package
          </button>
        </div>
      ) : null}

      {rows.map((row, index) => (
        <article
          key={row.id || `new-${index}`}
          className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {row.name.trim() || `Package ${index + 1}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Stay package or add-on offered to guests at booking.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-destructive"
              onClick={() => remove(index)}
              title="Remove package"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Package name"
              info="Public name guests see (e.g. Honeymoon Package, Weekend Getaway)."
              className="sm:col-span-2 lg:col-span-2"
            >
              <input
                className={inputClass}
                value={row.name}
                placeholder="Honeymoon Package"
                onChange={(e) => update(index, { name: e.target.value })}
              />
            </Field>
            <Field label="Price" info="Display price for the package (include currency symbol if you want, e.g. ₹9,999).">
              <input
                className={inputClass}
                value={row.price}
                placeholder="₹9,999"
                onChange={(e) => update(index, { price: e.target.value })}
              />
            </Field>
            <Field
              label="Description"
              info="Short summary of what’s included or the stay length (e.g. 2 nights & 3 days)."
              className="sm:col-span-2 lg:col-span-3"
            >
              <textarea
                className={`${inputClass} min-h-[72px] py-2`}
                value={row.description}
                placeholder="2 Nights & 3 Days Stay"
                onChange={(e) => update(index, { description: e.target.value })}
              />
            </Field>
            <Field label="Valid from" info="First date this package can be booked. Leave empty if always available.">
              <input
                type="date"
                className={inputClass}
                value={row.validFrom}
                onChange={(e) => update(index, { validFrom: e.target.value })}
              />
            </Field>
            <Field label="Valid to" info="Last date this package can be booked. Leave empty if no end date.">
              <input
                type="date"
                className={inputClass}
                value={row.validTo}
                onChange={(e) => update(index, { validTo: e.target.value })}
              />
            </Field>
            <Field label="Room type" info="Which room or hall this package is for (e.g. Deluxe Room, Party Hall).">
              <input
                className={inputClass}
                value={row.roomType}
                placeholder="Deluxe Room"
                onChange={(e) => update(index, { roomType: e.target.value })}
              />
            </Field>
            <Field label="Minimum nights" info="Shortest stay length guests must book for this package (overnight stays).">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={row.minimumNights}
                onChange={(e) => update(index, { minimumNights: Number(e.target.value) || 1 })}
              />
            </Field>
            <Field
              label="Guests included in price"
              info="How many people are covered by the base price (e.g. hall package includes 5 guests)."
            >
              <input
                type="number"
                min={1}
                className={inputClass}
                value={row.includedGuests}
                placeholder="5"
                onChange={(e) => update(index, { includedGuests: Number(e.target.value) || 1 })}
              />
            </Field>
            <Field
              label="Extra guest price (₹)"
              info="Amount charged once per person above the included guest count."
            >
              <input
                type="number"
                min={0}
                step="1"
                className={inputClass}
                value={row.extraGuestCharge}
                placeholder="300"
                onChange={(e) => update(index, { extraGuestCharge: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field
              label="Maximum guests allowed"
              info="Hard cap — guests cannot book more people than this for the package."
            >
              <input
                type="number"
                min={1}
                className={inputClass}
                value={row.maxGuests}
                placeholder="20"
                onChange={(e) => update(index, { maxGuests: Number(e.target.value) || 1 })}
              />
            </Field>
            <Field
              label="Package kind"
              info="Stay / Hall = main booking with venue. Add-on = optional extra sold with a stay."
            >
              <select
                className={inputClass}
                value={row.kind}
                onChange={(e) => update(index, { kind: e.target.value })}
              >
                <option value="stay">Stay / Hall (includes venue)</option>
                <option value="addon">Add-on only</option>
              </select>
            </Field>
            <Field
              label="Inclusions"
              info="What’s included — separate with commas (e.g. Breakfast, Dinner, Pool access)."
              className="sm:col-span-2 lg:col-span-3"
            >
              <textarea
                className={`${inputClass} min-h-[64px] py-2`}
                value={row.includesText}
                placeholder="Breakfast, Dinner, Pool"
                onChange={(e) => update(index, { includesText: e.target.value })}
              />
            </Field>
            <Field
              label="Add-ons"
              info="Optional extras you can mention (e.g. Spa, Airport pickup). Separate with commas."
              className="sm:col-span-2 lg:col-span-3"
            >
              <textarea
                className={`${inputClass} min-h-[64px] py-2`}
                value={row.addOnsText}
                placeholder="Spa, Airport Pickup"
                onChange={(e) => update(index, { addOnsText: e.target.value })}
              />
            </Field>
            <Field label="Badge" info="Optional short label on the card (e.g. Popular, Best value).">
              <input
                className={inputClass}
                value={row.badge}
                placeholder="Popular"
                onChange={(e) => update(index, { badge: e.target.value })}
              />
            </Field>
            <Field label="Sort order" info="Lower numbers appear first on your website. Use 0, 1, 2…">
              <input
                type="number"
                className={inputClass}
                value={row.sortOrder}
                onChange={(e) => update(index, { sortOrder: Number(e.target.value) || 0 })}
              />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={row.isActive}
                onChange={(e) => update(index, { isActive: e.target.checked })}
              />
              <span className="inline-flex items-center gap-1">
                Active (shown on website & booking)
                <FieldInfoTip text="Turn off to hide this package from the public site without deleting it." />
              </span>
            </label>
          </div>

          <div className="space-y-2">
            {row.imageUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={resolveMediaUrl(row.imageUrl)}
                  alt=""
                  className="h-16 w-16 rounded-md border object-cover"
                />
                <p className="text-[10px] font-mono text-muted-foreground">
                  asset: {row.imageAssetId || findLibraryAsset(library, row.imageUrl)?.id || "—"}
                </p>
              </div>
            ) : null}
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Package photos
              <FieldInfoTip text="Pick images from your library. The first selected photo is the cover shown on the site." />
            </div>
            <AssetImagePicker
              assets={library}
              multiple
              selectedIds={
                row.imageAssetIds.length
                  ? row.imageAssetIds
                  : row.imageAssetId
                    ? [row.imageAssetId]
                    : findLibraryAsset(library, row.imageUrl)
                      ? [findLibraryAsset(library, row.imageUrl)!.id]
                      : []
              }
              label="Package photos (from library)"
              onChange={(selected) => applyImages(index, selected)}
            />
            <p className="text-[11px] text-muted-foreground">
              First selected image is the cover. Upload more in{" "}
              <Link to="/staff/organisation?section=uploads" className="text-primary hover:underline">
                Images
              </Link>
              .
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
