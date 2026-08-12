import { useCallback, useMemo } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  OrganisationRoom,
  ROOM_STATUSES,
  ROOM_TYPES,
  statusLabel,
} from "@/models/hospitality.model";
import { RoomCardPreview } from "@/components/organization/RoomCardPreview";
import { OrgImageAssetField } from "@/components/organization/OrgImageAssetField";
import {
  ROOM_AMENITY_GROUPS,
  ROOM_STATUS_EMOJI,
  buildRoomCalendar,
  defaultRoomCode,
} from "@/utils/roomAmenities.util";

type RoomEditorFormProps = {
  draft: OrganisationRoom;
  onChange: (room: OrganisationRoom) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  onOpenRoomStatus?: (roomId: number) => void;
  /** When true, header/footer actions are handled by the parent panel. */
  embedded?: boolean;
};

function SectionCard({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {step} · {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function RoomEditorForm({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
  onOpenRoomStatus,
  embedded = false,
}: RoomEditorFormProps) {
  const patch = useCallback(
    (partial: Partial<OrganisationRoom>) => onChange({ ...draft, ...partial }),
    [draft, onChange],
  );

  const patchCapacity = (partial: Partial<OrganisationRoom["capacity"]>) => {
    const capacity = { ...draft.capacity, ...partial };
    if (partial.adults_allowed !== undefined || partial.children_allowed !== undefined) {
      capacity.total_guests = capacity.adults_allowed + capacity.children_allowed;
    }
    onChange({ ...draft, capacity });
  };

  const patchPricing = (partial: Partial<OrganisationRoom["pricing"]>) =>
    onChange({ ...draft, pricing: { ...draft.pricing, ...partial } });

  const patchRules = (partial: Partial<OrganisationRoom["booking_rules"]>) =>
    onChange({ ...draft, booking_rules: { ...draft.booking_rules, ...partial } });

  const toggleAmenity = (id: string) => {
    const set = new Set(draft.amenities ?? []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...draft, amenities: [...set] });
  };

  const gallery = draft.gallery_photos ?? [];
  const galleryIds = gallery.map((id) => Number(id)).filter((id) => id > 0);
  const calendarDays = useMemo(() => buildRoomCalendar(draft), [draft]);

  const updateGallery = (ids: number[]) => {
    const nextGallery = ids.map(String);
    onChange({
      ...draft,
      gallery_photos: nextGallery,
      main_photo:
        draft.main_photo && nextGallery.includes(draft.main_photo) ?
          draft.main_photo
        : nextGallery[0] ?? "",
    });
  };

  return (
    <div className="space-y-6">
      {!embedded ?
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to rooms
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ?
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <Save className="mr-2 h-4 w-4" />}
            Save room
          </Button>
        </div>
      : null}

      <RoomCardPreview room={draft} />

      <SectionCard step={1} title="Room Master — Basic Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Room ID</Label>
            <Input
              value={draft.booking_rules.room_code}
              placeholder={defaultRoomCode(draft.room_number)}
              onChange={(e) => patchRules({ room_code: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Room Number *</Label>
            <Input
              value={draft.room_number}
              onChange={(e) => {
                const room_number = e.target.value;
                const nextRules = { ...draft.booking_rules };
                if (!nextRules.room_code.trim()) {
                  nextRules.room_code = defaultRoomCode(room_number);
                }
                onChange({ ...draft, room_number, booking_rules: nextRules });
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>Room Name</Label>
            <Input
              value={draft.room_name}
              placeholder="Twin Room"
              onChange={(e) => patch({ room_name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Floor</Label>
            <Input
              type="number"
              value={draft.floor_number}
              onChange={(e) => patch({ floor_number: Number(e.target.value) || 1 })}
            />
          </div>
          <div className="space-y-1">
            <Label>Building / Block</Label>
            <Input
              value={draft.building_wing}
              placeholder="Main Block"
              onChange={(e) => patch({ building_wing: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Room Type</Label>
            <Select value={draft.room_type} onValueChange={(v) => patch({ room_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard step={2} title="Room Capacity">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>Adults Allowed</Label>
            <Input
              type="number"
              min={0}
              value={draft.capacity.adults_allowed}
              onChange={(e) => patchCapacity({ adults_allowed: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1">
            <Label>Children Allowed</Label>
            <Input
              type="number"
              min={0}
              value={draft.capacity.children_allowed}
              onChange={(e) => patchCapacity({ children_allowed: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1">
            <Label>Total Guests Capacity</Label>
            <Input type="number" value={draft.capacity.total_guests} readOnly className="bg-stone-50" />
          </div>
        </div>
        <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4">
          <p className="text-sm font-medium text-stone-800">Extra beds</p>
          <p className="text-xs text-stone-500">
            Roll-away or mattress beds beyond the room&apos;s standard beds.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Max extra beds allowed</Label>
              <Input
                type="number"
                min={0}
                value={draft.capacity.extra_beds_allowed}
                onChange={(e) =>
                  patchCapacity({ extra_beds_allowed: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Charge per extra bed / night (₹)</Label>
              <Input
                type="number"
                min={0}
                value={draft.pricing.extra_guest_charge || ""}
                onChange={(e) =>
                  patchPricing({ extra_guest_charge: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard step={3} title="Pricing">
        <CardDescription className="-mt-2">
          Mon–Thu uses weekday rate; Fri–Sun uses weekend rate when set.
        </CardDescription>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Weekday Price (₹ / night)</Label>
            <Input
              type="number"
              min={0}
              value={draft.pricing.price_per_night || ""}
              onChange={(e) => patchPricing({ price_per_night: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1">
            <Label>Weekend Price (₹ / night)</Label>
            <Input
              type="number"
              min={0}
              value={draft.pricing.weekend_price || ""}
              onChange={(e) => patchPricing({ weekend_price: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard step={4} title="Room Amenities">
        <div className="space-y-5">
          {ROOM_AMENITY_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-sm font-semibold text-stone-800">{group.title}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const checked = (draft.amenities ?? []).includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                        checked ?
                          "border-orange-300 bg-orange-50 text-stone-900"
                        : "border-stone-200 bg-white hover:border-orange-200",
                      )}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleAmenity(item.id)} />
                      <span>
                        {item.emoji} {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard step={5} title="Room Images">
        <p className="text-sm text-stone-600">
          Upload or pick room photos from organisation assets. Choose which image is the main photo.
        </p>
        <OrgImageAssetField
          label="Room photos"
          imageIds={galleryIds}
          onChange={updateGallery}
          multiple
          idPrefix="room-photos"
        />
        {galleryIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <p className="w-full text-xs font-medium text-stone-500">Main photo</p>
            {galleryIds.map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={draft.main_photo === String(id) ? "default" : "outline"}
                className={cn(
                  "rounded-xl",
                  draft.main_photo === String(id) && "bg-gradient-coral text-white",
                )}
                onClick={() => patch({ main_photo: String(id) })}
              >
                Image #{id}
              </Button>
            ))}
          </div>
        ) : null}
        <div className="space-y-1">
          <Label>Room Video URL (optional)</Label>
          <Input
            value={draft.booking_rules.video_url}
            placeholder="https://youtube.com/..."
            onChange={(e) => patchRules({ video_url: e.target.value })}
          />
        </div>
      </SectionCard>

      <SectionCard step={6} title="Room Status">
        <p className="text-sm text-stone-500">
          Live status is also updated from bookings on the Room Status Board.
        </p>
        <div className="flex flex-wrap gap-2">
          {ROOM_STATUSES.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={draft.status === item.value ? "default" : "outline"}
              className={cn(
                "rounded-xl",
                draft.status === item.value && "bg-gradient-coral text-white",
              )}
              onClick={() => patch({ status: item.value })}
            >
              {ROOM_STATUS_EMOJI[item.value]} {statusLabel(item.value)}
            </Button>
          ))}
        </div>
      </SectionCard>

      <SectionCard step={7} title="Booking Calendar (next 7 days)">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {calendarDays.map((day) => (
            <div
              key={day.label}
              className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2 text-center"
            >
              <p className="text-sm font-medium text-stone-900">{day.label}</p>
              <p className="text-xs text-stone-500">{day.state}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard step={8} title="Current Guest Stay">
        {draft.guest?.name || draft.booking?.check_in ?
          <div className="space-y-2 text-sm text-stone-700">
            {draft.guest?.name ?
              <p>
                <span className="font-medium">Name:</span> {draft.guest.name}
              </p>
            : null}
            {draft.guest?.phone ?
              <p>
                <span className="font-medium">Phone:</span> {draft.guest.phone}
              </p>
            : null}
            {draft.booking?.check_in ?
              <p>
                <span className="font-medium">Check-in:</span>{" "}
                {new Date(draft.booking.check_in).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            : null}
            {draft.booking?.check_out ?
              <p>
                <span className="font-medium">Check-out:</span>{" "}
                {new Date(draft.booking.check_out).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            : null}
            <p>
              <span className="font-medium">Guests:</span> {draft.capacity.total_guests} max
            </p>
            {draft.payment ?
              <p>
                <span className="font-medium">Payment:</span> ₹
                {draft.payment.paid.toLocaleString("en-IN")} paid · ₹
                {draft.payment.balance.toLocaleString("en-IN")} balance
              </p>
            : null}
            {draft.id > 0 && onOpenRoomStatus ?
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-orange-600"
                onClick={() => onOpenRoomStatus(draft.id)}
              >
                Manage on Status Board →
              </Button>
            : null}
          </div>
        : <p className="text-sm text-stone-500">No active guest stay for this room.</p>}
      </SectionCard>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Operations</CardTitle>
          <CardDescription>
            Housekeeping assignments and live board actions are managed from Room status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {draft.cleaning_assignment?.staff_name ?
            <p className="text-sm text-stone-600">
              Assigned to {draft.cleaning_assignment.staff_name}
            </p>
          : <p className="text-sm text-stone-500">No cleaning assignment.</p>}
          {draft.id > 0 && onOpenRoomStatus ?
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => onOpenRoomStatus(draft.id)}
            >
              Open Room Status Board
            </Button>
          : null}
        </CardContent>
      </Card>

      {!embedded ?
        <div className="flex justify-end border-t border-stone-100 pt-4">
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ?
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <Save className="mr-2 h-4 w-4" />}
            Save room
          </Button>
        </div>
      : null}
    </div>
  );
}
