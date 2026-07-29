import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AMENITY_CATEGORIES,
  ROOM_STATUSES,
  ROOM_TYPES,
  amenitiesByCategory,
  getStatusMeta,
  getTypeLabel,
  resolveAmenities,
} from "@/config/roomCatalog";
import type { PickableImage, RoomDefinition } from "@/models/room";
import { formatDisplayDate, parseDateOnly } from "@/models/room";
import { stayApi } from "@/services/stay.service";
import { useToast } from "@/hooks/use-toast";
import { resolveMediaUrl } from "@/utils/environment";
import { AssetImagePicker } from "@/components/organisation/AssetImagePicker";
import { RoomStatusBoardLink } from "./RoomDefinitionCard";

interface RoomDefinitionFormProps {
  room: RoomDefinition;
  pickableImages: PickableImage[];
  onCancel: () => void;
  onSaved: (id: string) => void;
  onDeleted: () => void;
}

export function RoomDefinitionForm({
  room: initial,
  pickableImages,
  onCancel,
  onSaved,
  onDeleted,
}: RoomDefinitionFormProps) {
  const { toast } = useToast();
  const [room, setRoom] = useState(initial);
  const [galleryText, setGalleryText] = useState((initial.GalleryPhotos ?? []).join("\n"));
  const [saving, setSaving] = useState(false);

  const isNew = !room.Id;

  useEffect(() => {
    setRoom(initial);
    setGalleryText((initial.GalleryPhotos ?? []).join("\n"));
  }, [initial]);

  const setCapacity = (key: keyof RoomDefinition["Capacity"], value: number) =>
    setRoom((r) => ({ ...r, Capacity: { ...r.Capacity, [key]: value } }));

  const setPricing = (key: keyof RoomDefinition["Pricing"], value: number) =>
    setRoom((r) => ({ ...r, Pricing: { ...r.Pricing, [key]: value } }));

  const setRules = (key: keyof RoomDefinition["BookingRules"], value: string | number) =>
    setRoom((r) => ({ ...r, BookingRules: { ...r.BookingRules, [key]: value } }));

  const toggleAmenity = (id: string) =>
    setRoom((r) => ({
      ...r,
      Amenities: r.Amenities.includes(id) ? r.Amenities.filter((a) => a !== id) : [...r.Amenities, id],
    }));

  const galleryUrls = galleryText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.RoomNumber.trim()) {
      toast({ title: "Room number is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const saved = (await stayApi.rooms.save(room, room.Amenities, galleryUrls)) as RoomDefinition;
      toast({ title: isNew ? "Room created" : "Room saved" });
      onSaved(saved.Id || room.Id);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: msg || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!room.Id || !confirm("Delete this room?")) return;
    setSaving(true);
    try {
      await stayApi.rooms.delete(room.Id);
      toast({ title: "Room deleted" });
      onDeleted();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const previewAmenities = resolveAmenities(room.Amenities).slice(0, 6);
  const st = getStatusMeta(room.Status);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <form onSubmit={handleSave} className="room-def-detail-panel">
      <div className="shrink-0 pt-2 pb-0 flex justify-center md:hidden" aria-hidden>
        <span className="h-1 w-10 rounded-full bg-muted-foreground/25" />
      </div>
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3 md:hidden">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-primary">
          ← Back
        </button>
        <span className="text-sm font-semibold truncate">
          {isNew ? "Add New Room" : `Edit — ${room.RoomName || room.RoomNumber}`}
        </span>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">
            {isNew ? "Add New Room" : `Edit — ${room.RoomName || room.RoomNumber}`}
          </h2>
          <p className="text-xs text-muted-foreground">Room master — details, pricing, amenities & booking rules</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-border px-3 py-2 text-xs font-medium" disabled={saving}>
            Cancel
          </button>
          {!isNew && (
            <button type="button" onClick={handleDelete} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600" disabled={saving}>
              Delete
            </button>
          )}
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground" disabled={saving}>
            {saving ? "Saving…" : "Save Room"}
          </button>
        </div>
      </div>

      <div className="room-def-scroll bg-muted/30">
        <div className="w-full detail-panel-sections-2col pb-8 px-1">
          {!isNew && (
            <div className="room-def-form-section detail-panel-col-span-2">
              <p className="room-def-section-title">Room Card Preview</p>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-base font-bold">Room {room.RoomNumber}</p>
                  <p className="text-sm text-muted-foreground">{getTypeLabel(room.RoomType)}</p>
                  <p className="mt-2 text-xs font-semibold">
                    Status: {st.label} {st.emoji}
                  </p>
                  {room.Guest && (
                    <>
                      <p className="mt-1 text-xs text-muted-foreground">Guest: {room.Guest.Name}</p>
                      {room.Booking && (
                        <p className="text-xs text-muted-foreground">
                          Check-out: {formatDisplayDate(room.Booking.CheckOut)}
                        </p>
                      )}
                    </>
                  )}
                  <p className="mt-2 text-sm font-bold text-primary">
                    ₹{room.Pricing.PricePerNight.toLocaleString("en-IN")}/night weekday
                    {room.Pricing.WeekendPrice > 0 && (
                      <> · ₹{room.Pricing.WeekendPrice.toLocaleString("en-IN")}/night weekend</>
                    )}
                  </p>
                  {room.Capacity.ExtraBedsAllowed > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Extra beds: up to {room.Capacity.ExtraBedsAllowed}
                      {room.Pricing.ExtraBedCharge > 0 &&
                        ` · ₹${room.Pricing.ExtraBedCharge.toLocaleString("en-IN")}/bed/night`}
                    </p>
                  )}
                  {previewAmenities.length > 0 && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {previewAmenities.map((a) => a!.name).join(" | ")}
                    </p>
                  )}
                </div>
                {room.MainPhoto && (
                  <img src={resolveMediaUrl(room.MainPhoto)} alt="" className="h-24 w-32 rounded-lg border object-cover" />
                )}
              </div>
            </div>
          )}

          {/* 1 · Room Master */}
          <div className="room-def-form-section">
            <h3 className="room-def-section-title">1 · Room Master — Basic Details</h3>
            <div className="space-y-3">
              {!isNew && (
                <div>
                  <label className="room-def-label">Room ID</label>
                  <input className="room-def-input bg-muted text-muted-foreground" value={room.Id} readOnly />
                </div>
              )}
              <div className="detail-panel-fields-2">
                <div>
                  <label className="room-def-label">Room Number *</label>
                  <input
                    className="room-def-input"
                    value={room.RoomNumber}
                    onChange={(e) => setRoom((r) => ({ ...r, RoomNumber: e.target.value }))}
                    placeholder="101, 102, A1"
                    required
                  />
                </div>
                <div>
                  <label className="room-def-label">Room Name</label>
                  <input
                    className="room-def-input"
                    value={room.RoomName}
                    onChange={(e) => setRoom((r) => ({ ...r, RoomName: e.target.value }))}
                    placeholder="Deluxe AC Room"
                  />
                </div>
              </div>
              <div className="detail-panel-fields-2">
                <div>
                  <label className="room-def-label">Floor</label>
                  <input
                    type="number"
                    min={0}
                    className="room-def-input"
                    value={room.FloorNumber}
                    onChange={(e) => setRoom((r) => ({ ...r, FloorNumber: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="room-def-label">Building / Block</label>
                  <input
                    className="room-def-input"
                    value={room.BuildingWing}
                    onChange={(e) => setRoom((r) => ({ ...r, BuildingWing: e.target.value }))}
                    placeholder="Main Block"
                  />
                </div>
                <div>
                  <label className="room-def-label">Room Type</label>
                  <select
                    className="room-def-input"
                    value={room.RoomType}
                    onChange={(e) => setRoom((r) => ({ ...r, RoomType: e.target.value }))}
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2 · Capacity */}
          <div className="room-def-form-section">
            <h3 className="room-def-section-title">2 · Room Capacity</h3>
            <div className="detail-panel-fields-2">
              {(
                [
                  ["AdultsAllowed", "Adults Allowed", 1],
                  ["ChildrenAllowed", "Children Allowed", 0],
                  ["TotalGuests", "Total Guests Capacity", 1],
                ] as const
              ).map(([key, label, min]) => (
                <div key={key}>
                  <label className="room-def-label">{label}</label>
                  <input
                    type="number"
                    min={min}
                    className="room-def-input"
                    value={room.Capacity[key]}
                    onChange={(e) => setCapacity(key, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="room-def-label">Extra beds</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Roll-away or mattress beds beyond the room&apos;s standard beds.
              </p>
              <div className="mt-3 detail-panel-fields-2">
                <div>
                  <label className="room-def-label">Max extra beds allowed</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    className="room-def-input"
                    value={room.Capacity.ExtraBedsAllowed}
                    onChange={(e) => setCapacity("ExtraBedsAllowed", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="room-def-label">Charge per extra bed / night (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="room-def-input"
                    value={room.Pricing.ExtraBedCharge}
                    onChange={(e) => setPricing("ExtraBedCharge", Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3 · Pricing */}
          <div className="room-def-form-section">
            <h3 className="room-def-section-title">3 · Pricing</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Mon–Thu uses weekday rate; Fri–Sun uses weekend rate when set.
            </p>
            <div className="detail-panel-fields-2">
              <div>
                <label className="room-def-label">Weekday Price (₹ / night)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="room-def-input"
                  value={room.Pricing.PricePerNight}
                  onChange={(e) => setPricing("PricePerNight", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="room-def-label">Weekend Price (₹ / night)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="room-def-input"
                  value={room.Pricing.WeekendPrice}
                  onChange={(e) => setPricing("WeekendPrice", Number(e.target.value))}
                  placeholder="Same as weekday if empty"
                />
              </div>
            </div>
          </div>

          {/* 4 · Amenities */}
          <div className="room-def-form-section detail-panel-col-span-2">
            <h3 className="room-def-section-title">4 · Room Amenities</h3>
            {AMENITY_CATEGORIES.sort((a, b) => a.order - b.order).map((cat) => {
              const items = amenitiesByCategory(cat.id);
              if (!items.length) return null;
              return (
                <div key={cat.id} className="mb-4 last:mb-0">
                  <p className="mb-2 text-xs font-semibold">{cat.label}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {items.map((a) => (
                      <label
                        key={a.id}
                        className="flex cursor-pointer items-center gap-2 rounded border border-border px-2 py-2 text-xs hover:border-primary/30"
                      >
                        <input
                          type="checkbox"
                          checked={room.Amenities.includes(a.id)}
                          onChange={() => toggleAmenity(a.id)}
                        />
                        {a.icon} {a.name}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5 · Images */}
          <div className="room-def-form-section detail-panel-col-span-2">
            <h3 className="room-def-section-title">5 · Room Images</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Select from your{" "}
              <Link to="/staff/organisation?section=uploads" className="text-primary hover:underline">
                image library
              </Link>
              . First selected image is the main photo; all selected images are the gallery.
            </p>
            <div className="space-y-4">
              {room.MainPhoto ? (
                <img
                  src={resolveMediaUrl(room.MainPhoto)}
                  alt="Main"
                  className="h-24 w-36 rounded-lg border object-cover"
                />
              ) : null}
              <AssetImagePicker
                assets={pickableImages.map((img) => ({
                  id: img.Id,
                  url: img.Url,
                  title: img.Title,
                }))}
                multiple
                selectedIds={(() => {
                  const byUrl = new Map(pickableImages.map((img) => [img.Url, img.Id]));
                  const ids = galleryUrls.map((url) => byUrl.get(url)).filter(Boolean) as string[];
                  const mainId = byUrl.get(room.MainPhoto);
                  if (mainId && !ids.includes(mainId)) ids.unshift(mainId);
                  return ids;
                })()}
                label="Choose room photos"
                onChange={(selected) => {
                  const urls = selected.map((a) => a.url);
                  setRoom((r) => ({ ...r, MainPhoto: urls[0] ?? "" }));
                  setGalleryText(urls.join("\n"));
                }}
              />
              <div>
                <label className="room-def-label">Room Video URL (optional)</label>
                <input
                  className="room-def-input"
                  value={room.RoomVideo}
                  onChange={(e) => setRoom((r) => ({ ...r, RoomVideo: e.target.value }))}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          {/* 6 · Status */}
          <div className="room-def-form-section detail-panel-col-span-2">
            <h3 className="room-def-section-title">6 · Room Status</h3>
            <div className="detail-panel-fields-2">
              {ROOM_STATUSES.map((s) => {
                const selected = room.Status === s.value;
                return (
                  <label
                    key={s.value}
                    className={`room-def-status-option flex items-center gap-2 px-3 py-2.5 text-xs font-medium${selected ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s.value}
                      checked={selected}
                      className="sr-only"
                      onChange={() => setRoom((r) => ({ ...r, Status: s.value }))}
                    />
                    <span>{s.emoji}</span>
                    {s.label}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Live status is also updated from bookings on the Room Status Board.
            </p>
          </div>

          {/* 7 · Booking calendar */}
          {!isNew && room.Booking && (
            <div className="room-def-form-section">
              <h3 className="room-def-section-title">7 · Booking Calendar (next 7 days)</h3>
              <ul className="space-y-1 text-xs">
                {Array.from({ length: 7 }, (_, i) => {
                  const day = new Date(today);
                  day.setDate(day.getDate() + i);
                  let label = "Available";
                  const checkIn = parseDateOnly(room.Booking!.CheckIn);
                  const checkOut = parseDateOnly(room.Booking!.CheckOut);
                  if (checkIn && checkOut) {
                    const d = day.getTime();
                    if (d >= checkIn.getTime() && d < checkOut.getTime()) label = "Booked";
                    else if (d === checkOut.getTime() && (room.Status === "checkout_pending" || room.Status === "cleaning"))
                      label = "Cleaning";
                  }
                  if (room.Status === "maintenance") label = "Maintenance";
                  if (room.Status === "blocked") label = "Blocked";
                  return (
                    <li key={i} className="flex justify-between rounded bg-muted px-3 py-2">
                      <span className="font-medium">{day.toLocaleDateString("en-GB", { month: "short", day: "2-digit" })}</span>
                      <span className="text-muted-foreground">{label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* 8 · Guest stay */}
          {!isNew && room.Guest && room.Booking && (
            <div className="room-def-form-section border-orange-200 bg-orange-50/50">
              <h3 className="room-def-section-title text-orange-800">8 · Current Guest Stay</h3>
              <div className="grid gap-2 text-xs detail-panel-fields-2">
                <p><span className="font-semibold">Name:</span> {room.Guest.Name}</p>
                <p><span className="font-semibold">Phone:</span> {room.Guest.Phone}</p>
                <p><span className="font-semibold">Check-in:</span> {formatDisplayDate(room.Booking.CheckIn)}</p>
                <p><span className="font-semibold">Check-out:</span> {formatDisplayDate(room.Booking.CheckOut)}</p>
                <p><span className="font-semibold">Guests:</span> {room.Capacity.TotalGuests} max</p>
                {room.Guest.IdProof && <p><span className="font-semibold">ID:</span> {room.Guest.IdProof}</p>}
                {room.Payment && (
                  <p className="detail-panel-col-span-2">
                    <span className="font-semibold">Payment:</span> ₹{room.Payment.Paid.toLocaleString("en-IN")} paid · ₹
                    {room.Payment.Balance.toLocaleString("en-IN")} balance
                  </p>
                )}
              </div>
              <Link
                to={`/staff/rooms/status?id=${encodeURIComponent(room.Id)}`}
                className="mt-3 inline-block text-xs font-semibold text-primary"
              >
                Manage on Status Board →
              </Link>
            </div>
          )}

          {/* 9 · Housekeeping */}
          {!isNew && room.CleaningAssignment && (
            <div className="room-def-form-section border-teal-200 bg-teal-50/50">
              <h3 className="room-def-section-title text-teal-800">9 · Housekeeping</h3>
              <p className="text-xs">
                Assigned: <strong>{room.CleaningAssignment.UserName}</strong>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Since {new Date(room.CleaningAssignment.AssignedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Booking rules */}
          <div className="room-def-form-section">
            <h3 className="room-def-section-title">Booking Rules</h3>
            <div className="detail-panel-fields-2">
              <div>
                <label className="room-def-label">Check-in Time</label>
                <input
                  type="time"
                  className="room-def-input"
                  value={room.BookingRules.CheckInTime}
                  onChange={(e) => setRules("CheckInTime", e.target.value)}
                />
              </div>
              <div>
                <label className="room-def-label">Check-out Time</label>
                <input
                  type="time"
                  className="room-def-input"
                  value={room.BookingRules.CheckOutTime}
                  onChange={(e) => setRules("CheckOutTime", e.target.value)}
                />
              </div>
              <div className="detail-panel-col-span-2">
                <label className="room-def-label">Cancellation Policy</label>
                <textarea
                  className="room-def-input"
                  rows={2}
                  value={room.BookingRules.CancellationPolicy}
                  onChange={(e) => setRules("CancellationPolicy", e.target.value)}
                />
              </div>
              <div>
                <label className="room-def-label">Min Stay (nights)</label>
                <input
                  type="number"
                  min={1}
                  className="room-def-input"
                  value={room.BookingRules.MinimumStay}
                  onChange={(e) => setRules("MinimumStay", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="room-def-label">Max Stay (nights)</label>
                <input
                  type="number"
                  min={1}
                  className="room-def-input"
                  value={room.BookingRules.MaximumStay}
                  onChange={(e) => setRules("MaximumStay", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="room-def-label">Min Hours (hourly)</label>
                <input
                  type="number"
                  min={0}
                  className="room-def-input"
                  value={room.BookingRules.MinimumHours}
                  onChange={(e) => setRules("MinimumHours", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="room-def-label">Max Hours (hourly)</label>
                <input
                  type="number"
                  min={1}
                  className="room-def-input"
                  value={room.BookingRules.MaximumHours}
                  onChange={(e) => setRules("MaximumHours", Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {!isNew && (
            <div className="room-def-form-section detail-panel-col-span-2 border-dashed">
              <h3 className="room-def-section-title">Operations</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Room transfer, maintenance, and live ops are managed from the <strong>Room Status Board</strong>.
              </p>
              <RoomStatusBoardLink roomId={room.Id} />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
