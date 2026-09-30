import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveEditSheet } from "@/components/organization/ResponsiveEditSheet";
import {
  HospitalityFoodItem,
  HospitalityGuestService,
  HospitalityNearbyPlace,
  HospitalityPackage,
  OrganisationRoom,
  OrganisationRoomSelectReq,
  ROOM_TYPES,
  normalizeOrganisationRoom,
} from "@/models/hospitality.model";
import { hospitalityService } from "@/services/hospitality.service";
import { formatRoomTypeLabel } from "@/utils/roomAmenities.util";

type PersistFn<T> = (items: T[]) => Promise<void>;

function useContentEditor<T>(items: T[], setItems: (items: T[]) => void) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorIndex, setEditorIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = (empty: T) => {
    setEditorIndex(null);
    setDraft(empty);
    setEditorOpen(true);
  };

  const openEdit = (index: number, item: T) => {
    setEditorIndex(index);
    setDraft({ ...item });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditorIndex(null);
    setDraft(null);
  };

  const saveDraft = async (onPersist: PersistFn<T>) => {
    if (draft == null) return;
    setSaving(true);
    try {
      const next = [...items];
      if (editorIndex == null) next.push(draft);
      else next[editorIndex] = draft;
      setItems(next);
      await onPersist(next);
      closeEditor();
    } finally {
      setSaving(false);
    }
  };

  const deleteDraft = async (onPersist: PersistFn<T>) => {
    if (editorIndex == null || saving) return;
    setSaving(true);
    try {
      const next = items.filter((_, index) => index !== editorIndex);
      setItems(next);
      await onPersist(next);
      closeEditor();
    } finally {
      setSaving(false);
    }
  };

  return {
    editorOpen,
    editorIndex,
    draft,
    saving,
    setDraft,
    openCreate,
    openEdit,
    closeEditor,
    saveDraft,
    deleteDraft,
  };
}

type PackagesPanelProps = {
  packages: HospitalityPackage[];
  setPackages: (items: HospitalityPackage[]) => void;
  onPersist: PersistFn<HospitalityPackage>;
  newItem: () => HospitalityPackage;
  organisationId: number;
  locationId: number;
  onAddRooms?: () => void;
};

export function HospitalityPackagesPanel({
  packages,
  setPackages,
  onPersist,
  newItem,
  organisationId,
  locationId,
  onAddRooms,
}: PackagesPanelProps) {
  const editor = useContentEditor(packages, setPackages);
  const [rooms, setRooms] = useState<OrganisationRoom[]>([]);

  useEffect(() => {
    if (organisationId <= 0 || locationId <= 0) {
      setRooms([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const req = new OrganisationRoomSelectReq();
        req.organisation_id = organisationId;
        req.organisation_location_id = locationId;
        const list = await hospitalityService.selectRooms(req);
        if (!cancelled) {
          setRooms((list ?? []).map((room) => normalizeOrganisationRoom(room)));
        }
      } catch {
        if (!cancelled) setRooms([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organisationId, locationId]);

  const matchingRooms = useMemo(() => {
    const type = (editor.draft?.room_type || "").trim().toLowerCase();
    if (!type) return rooms;
    return rooms.filter((room) => room.room_type.trim().toLowerCase() === type);
  }, [editor.draft?.room_type, rooms]);

  const title =
    editor.editorIndex != null ?
      `Edit — ${editor.draft?.name || "Package"}`
    : "Add package";

  return (
    <>
      <div className="space-y-4">
        {packages.length === 0 ?
          <Card>
            <CardContent className="py-10 text-center text-sm text-stone-500">
              No packages yet.
            </CardContent>
          </Card>
        : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg, index) => (
              <Card
                key={pkg.id || index}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => editor.openEdit(index, pkg)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{pkg.name || "Untitled package"}</CardTitle>
                  {pkg.price ?
                    <p className="text-sm font-medium text-stone-700">{pkg.price}</p>
                  : null}
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-stone-600">
                  {pkg.description ?
                    <p className="line-clamp-2">{pkg.description}</p>
                  : <p className="text-stone-400">No description</p>}
                  <p className="text-xs text-stone-500">
                    {pkg.room_type
                      ? `Rooms: ${formatRoomTypeLabel(pkg.room_type)}`
                      : "Rooms: any type"}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      editor.openEdit(index, pkg);
                    }}
                  >
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        }
        <Button type="button" variant="outline" onClick={() => editor.openCreate(newItem())}>
          <Plus className="mr-2 h-4 w-4" />
          Add package
        </Button>
      </div>

      {editor.draft ?
        <ResponsiveEditSheet
          open={editor.editorOpen}
          onOpenChange={() => undefined}
          title={title}
          subtitle="Guests book this package with a room of the type you pick."
          isEdit={editor.editorIndex != null}
          saving={editor.saving}
          onCancel={editor.closeEditor}
          onDelete={
            editor.editorIndex != null ?
              () => void editor.deleteDraft(onPersist)
            : undefined
          }
          onSave={() => void editor.saveDraft(onPersist)}
          saveLabel="Save package"
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={editor.draft.name}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Price</Label>
                <Input
                  value={editor.draft.price}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, price: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={editor.draft.description}
                onChange={(e) => editor.setDraft({ ...editor.draft!, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-1">
              <Label>Room type for this package</Label>
              <Select
                value={editor.draft.room_type?.trim() ? editor.draft.room_type : "any"}
                onValueChange={(value) =>
                  editor.setDraft({ ...editor.draft!, room_type: value === "any" ? "" : value })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Pick a room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any room type</SelectItem>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatRoomTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-stone-500">
                You do not pick one room number. You pick a type (for example Deluxe). Every room of
                that type at this location can be used with the package.
              </p>
              {locationId <= 0 ? (
                <p className="text-xs text-amber-700">Choose a location in the sidebar first.</p>
              ) : matchingRooms.length > 0 ? (
                <p className="text-xs text-stone-600">
                  Rooms of this type here:{" "}
                  {matchingRooms
                    .map((room) => room.room_name || room.room_number || `#${room.id}`)
                    .join(", ")}
                </p>
              ) : (
                <p className="text-xs text-stone-500">
                  No rooms of this type yet. Add them under Hospitality → Rooms, using the same type.
                </p>
              )}
              {onAddRooms ? (
                <Button type="button" variant="outline" className="mt-1 h-10" onClick={onAddRooms}>
                  Add rooms
                </Button>
              ) : null}
            </div>
          </div>
        </ResponsiveEditSheet>
      : null}
    </>
  );
}

type FoodPanelProps = {
  foodMenu: HospitalityFoodItem[];
  setFoodMenu: (items: HospitalityFoodItem[]) => void;
  onPersist: PersistFn<HospitalityFoodItem>;
  newItem: () => HospitalityFoodItem;
};

export function HospitalityFoodPanel({ foodMenu, setFoodMenu, onPersist, newItem }: FoodPanelProps) {
  const editor = useContentEditor(foodMenu, setFoodMenu);
  const title =
    editor.editorIndex != null ?
      `Edit — ${editor.draft?.title || editor.draft?.meal || "Menu item"}`
    : "Add menu item";

  return (
    <>
      <div className="space-y-4">
        {foodMenu.length === 0 ?
          <Card>
            <CardContent className="py-10 text-center text-sm text-stone-500">
              No menu items yet.
            </CardContent>
          </Card>
        : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {foodMenu.map((item, index) => (
              <Card
                key={index}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => editor.openEdit(index, item)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{item.title || item.meal || "Menu item"}</CardTitle>
                  {item.meal ?
                    <p className="text-sm text-stone-500">{item.meal}</p>
                  : null}
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-stone-600">
                  {item.description ?
                    <p className="line-clamp-2">{item.description}</p>
                  : null}
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); editor.openEdit(index, item); }}>
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        }
        <Button type="button" variant="outline" onClick={() => editor.openCreate(newItem())}>
          <Plus className="mr-2 h-4 w-4" />
          Add menu item
        </Button>
      </div>

      {editor.draft ?
        <ResponsiveEditSheet
          open={editor.editorOpen}
          onOpenChange={() => undefined}
          title={title}
          subtitle="Food and dining options for guests."
          isEdit={editor.editorIndex != null}
          saving={editor.saving}
          onCancel={editor.closeEditor}
          onDelete={editor.editorIndex != null ? () => void editor.deleteDraft(onPersist) : undefined}
          onSave={() => void editor.saveDraft(onPersist)}
          saveLabel="Save item"
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Meal</Label>
                <Input
                  value={editor.draft.meal}
                  placeholder="Breakfast, Lunch…"
                  onChange={(e) => editor.setDraft({ ...editor.draft!, meal: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Title</Label>
                <Input
                  value={editor.draft.title}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, title: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={editor.draft.description}
                onChange={(e) => editor.setDraft({ ...editor.draft!, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        </ResponsiveEditSheet>
      : null}
    </>
  );
}

type NearbyPanelProps = {
  nearbyPlaces: HospitalityNearbyPlace[];
  setNearbyPlaces: (items: HospitalityNearbyPlace[]) => void;
  onPersist: PersistFn<HospitalityNearbyPlace>;
  newItem: () => HospitalityNearbyPlace;
};

export function HospitalityNearbyPanel({
  nearbyPlaces,
  setNearbyPlaces,
  onPersist,
  newItem,
}: NearbyPanelProps) {
  const editor = useContentEditor(nearbyPlaces, setNearbyPlaces);
  const title =
    editor.editorIndex != null ?
      `Edit — ${editor.draft?.name || "Nearby place"}`
    : "Add nearby place";

  return (
    <>
      <div className="space-y-4">
        {nearbyPlaces.length === 0 ?
          <Card>
            <CardContent className="py-10 text-center text-sm text-stone-500">
              No nearby places yet.
            </CardContent>
          </Card>
        : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {nearbyPlaces.map((place, index) => (
              <Card
                key={index}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => editor.openEdit(index, place)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{place.name || "Nearby place"}</CardTitle>
                  {place.distance ?
                    <p className="text-sm text-stone-500">{place.distance}</p>
                  : null}
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-stone-600">
                  {place.travel_time ?
                    <p>{place.travel_time}</p>
                  : null}
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); editor.openEdit(index, place); }}>
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        }
        <Button type="button" variant="outline" onClick={() => editor.openCreate(newItem())}>
          <Plus className="mr-2 h-4 w-4" />
          Add nearby place
        </Button>
      </div>

      {editor.draft ?
        <ResponsiveEditSheet
          open={editor.editorOpen}
          onOpenChange={() => undefined}
          title={title}
          subtitle="Attractions and places near your property."
          isEdit={editor.editorIndex != null}
          saving={editor.saving}
          onCancel={editor.closeEditor}
          onDelete={editor.editorIndex != null ? () => void editor.deleteDraft(onPersist) : undefined}
          onSave={() => void editor.saveDraft(onPersist)}
          saveLabel="Save place"
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={editor.draft.name}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Distance</Label>
                <Input
                  value={editor.draft.distance}
                  placeholder="2 km"
                  onChange={(e) => editor.setDraft({ ...editor.draft!, distance: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Travel time</Label>
                <Input
                  value={editor.draft.travel_time ?? ""}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, travel_time: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Map URL</Label>
                <Input
                  value={editor.draft.map_url ?? ""}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, map_url: e.target.value })}
                />
              </div>
            </div>
          </div>
        </ResponsiveEditSheet>
      : null}
    </>
  );
}

type GuestServicesPanelProps = {
  guestServices: HospitalityGuestService[];
  setGuestServices: (items: HospitalityGuestService[]) => void;
  onPersist: PersistFn<HospitalityGuestService>;
  newItem: () => HospitalityGuestService;
};

export function HospitalityGuestServicesPanel({
  guestServices,
  setGuestServices,
  onPersist,
  newItem,
}: GuestServicesPanelProps) {
  const editor = useContentEditor(guestServices, setGuestServices);
  const title =
    editor.editorIndex != null ?
      `Edit — ${editor.draft?.name || "Guest service"}`
    : "Add guest service";

  return (
    <>
      <div className="space-y-4">
        {guestServices.length === 0 ?
          <Card>
            <CardContent className="py-10 text-center text-sm text-stone-500">
              No guest services yet.
            </CardContent>
          </Card>
        : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {guestServices.map((service, index) => (
              <Card
                key={service.id || index}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => editor.openEdit(index, service)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{service.name || "Guest service"}</CardTitle>
                  {service.price ?
                    <p className="text-sm font-medium text-stone-700">{service.price}</p>
                  : null}
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-stone-600">
                  {service.description ?
                    <p className="line-clamp-2">{service.description}</p>
                  : null}
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); editor.openEdit(index, service); }}>
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        }
        <Button type="button" variant="outline" onClick={() => editor.openCreate(newItem())}>
          <Plus className="mr-2 h-4 w-4" />
          Add guest service
        </Button>
      </div>

      {editor.draft ?
        <ResponsiveEditSheet
          open={editor.editorOpen}
          onOpenChange={() => undefined}
          title={title}
          subtitle="Optional paid add-ons guests can request when booking."
          isEdit={editor.editorIndex != null}
          saving={editor.saving}
          onCancel={editor.closeEditor}
          onDelete={editor.editorIndex != null ? () => void editor.deleteDraft(onPersist) : undefined}
          onSave={() => void editor.saveDraft(onPersist)}
          saveLabel="Save service"
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={editor.draft.name}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Price</Label>
                <Input
                  value={editor.draft.price}
                  onChange={(e) => editor.setDraft({ ...editor.draft!, price: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={editor.draft.description}
                onChange={(e) => editor.setDraft({ ...editor.draft!, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        </ResponsiveEditSheet>
      : null}
    </>
  );
}
