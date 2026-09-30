import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { BedDouble, Loader2, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { OrganisationRoom, emptyRoom, normalizeOrganisationRoom } from "@/models/hospitality.model";
import { hospitalityService } from "@/services/hospitality.service";
import { organisationRoomsQueryKey, useOrganisationRooms } from "@/hooks/useOrganisationRooms";
import { RoomEditorForm } from "@/components/organization/RoomEditorForm";
import { ResponsiveEditSheet } from "@/components/organization/ResponsiveEditSheet";
import { cloneRoom, defaultRoomCode } from "@/utils/roomAmenities.util";

type RoomDefinitionsPanelProps = {
  locationId: number;
  locationName?: string;
  onOpenRoomStatus?: (roomId: number) => void;
};

export function RoomDefinitionsPanel({
  locationId,
  locationName,
  onOpenRoomStatus,
}: RoomDefinitionsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const organisationId = user?.organisationid ?? 0;

  const { data: rooms = [], isLoading: loading } = useOrganisationRooms({
    organisationId,
    locationId,
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(() => emptyRoom(organisationId, locationId));
  const openedFromUrlRef = useRef<number | null>(null);
  const prevLocationIdRef = useRef(locationId);

  useEffect(() => {
    if (prevLocationIdRef.current === locationId) return;
    const previousLocationId = prevLocationIdRef.current;
    prevLocationIdRef.current = locationId;
    if (previousLocationId <= 0 || locationId <= 0) return;

    setEditorOpen(false);
    openedFromUrlRef.current = null;
    setDraft(emptyRoom(organisationId, locationId));
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("roomId");
        return next;
      },
      { replace: true },
    );
  }, [locationId, organisationId, setSearchParams]);

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((room) =>
      `${room.room_number} ${room.room_name} ${room.room_type} ${room.booking_rules.room_code}`
        .toLowerCase()
        .includes(q),
    );
  }, [rooms, search]);

  const syncEditorUrl = useCallback(
    (roomId?: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (roomId && roomId > 0) next.set("roomId", String(roomId));
          else next.delete("roomId");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const closeEditor = useCallback(() => {
    if (saving || deleting) return;
    setEditorOpen(false);
    openedFromUrlRef.current = null;
    syncEditorUrl();
  }, [deleting, saving, syncEditorUrl]);

  const openCreate = () => {
    if (locationId <= 0) {
      toast({
        title: "Select a location",
        description: "Choose a business location before adding rooms.",
        variant: "destructive",
      });
      return;
    }
    openedFromUrlRef.current = null;
    const room = emptyRoom(organisationId, locationId);
    setDraft(room);
    syncEditorUrl();
    setEditorOpen(true);
  };

  const openEdit = useCallback(
    (room: OrganisationRoom) => {
      const normalized = normalizeOrganisationRoom(room);
      const roomLocationId = Number(normalized.organisation_location_id) || 0;
      const activeLocationId = Number(locationId) || 0;

      if (roomLocationId > 0 && activeLocationId > 0 && roomLocationId !== activeLocationId) {
        toast({
          title: "Room belongs to another location",
          description: "Switch to the correct business location to edit this room.",
          variant: "destructive",
        });
        return;
      }

      const cloned = cloneRoom(normalized);
      if (activeLocationId > 0) {
        cloned.organisation_location_id = activeLocationId;
      }
      if (!cloned.booking_rules.room_code.trim()) {
        cloned.booking_rules.room_code = defaultRoomCode(cloned.room_number);
      }
      openedFromUrlRef.current = cloned.id;
      setDraft(cloned);
      syncEditorUrl(cloned.id);
      setEditorOpen(true);
    },
    [locationId, syncEditorUrl, toast],
  );

  useEffect(() => {
    const roomId = Number(searchParams.get("roomId") || 0);
    if (roomId <= 0 || loading || locationId <= 0) return;
    if (openedFromUrlRef.current === roomId && editorOpen) return;

    const room = rooms.find((item) => Number(item.id) === roomId);
    if (room) {
      openEdit(room);
    }
  }, [editorOpen, loading, locationId, openEdit, rooms, searchParams]);

  const saveRoom = async () => {
    if (locationId <= 0) {
      toast({
        title: "Select a location",
        description: "Choose a business location before saving rooms.",
        variant: "destructive",
      });
      return;
    }
    if (!draft.room_number.trim()) {
      toast({ title: "Room number is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = cloneRoom(draft);
      payload.organisation_id = organisationId;
      payload.organisation_location_id = locationId;
      if (!payload.booking_rules.room_code.trim()) {
        payload.booking_rules.room_code = defaultRoomCode(payload.room_number);
      }
      if (payload.gallery_photos.length > 0) {
        payload.main_photo = payload.main_photo || payload.gallery_photos[0];
      }
      await hospitalityService.saveRoom(payload);
      closeEditor();
      await queryClient.invalidateQueries({
        queryKey: organisationRoomsQueryKey(organisationId, locationId),
      });
      toast({ title: "Saved", description: "Room saved successfully." });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteRoom = async () => {
    if (draft.id <= 0) return;
    const label = draft.room_name || `Room ${draft.room_number}`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await hospitalityService.deleteRoom({
        id: draft.id,
        organisation_id: organisationId,
      });
      closeEditor();
      await queryClient.invalidateQueries({
        queryKey: organisationRoomsQueryKey(organisationId, locationId),
      });
      toast({ title: "Deleted", description: "Room removed." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const editorTitle =
    draft.id > 0 ?
      `Edit — ${draft.room_name || `Room ${draft.room_number}`}`
    : "Add room";

  if (organisationId <= 0) {
    return <p className="text-sm text-stone-500">Sign in with an organisation account.</p>;
  }

  if (locationId <= 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-stone-500">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-stone-300" />
          Select a business location above to manage rooms for that property.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {locationName ?
          <p className="flex items-center gap-1.5 text-sm text-stone-600">
            <MapPin className="h-4 w-4 shrink-0 text-[#E85D4C]" />
            Rooms for <span className="font-medium text-stone-800">{locationName}</span>
          </p>
        : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search rooms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={openCreate} className="shrink-0 self-start sm:self-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add room
          </Button>
        </div>

        {loading ?
          <div className="flex items-center gap-2 py-12 text-stone-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading rooms…
          </div>
        : filteredRooms.length === 0 ?
          <Card>
            <CardContent className="py-12 text-center text-stone-500">
              <BedDouble className="mx-auto mb-3 h-10 w-10 text-stone-300" />
              No rooms at this location yet. Add your first room to get started.
            </CardContent>
          </Card>
        : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => (
              <Card
                key={room.id}
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                onClick={() => openEdit(room)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
                  <p className="text-sm capitalize text-stone-500">
                    {room.room_name || room.room_type} · Floor {room.floor_number}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-stone-600">
                  {room.guest?.name ?
                    <p>Guest: {room.guest.name}</p>
                  : null}
                  <p>
                    ₹{room.pricing.price_per_night.toLocaleString("en-IN")}/night · up to{" "}
                    {room.capacity.total_guests} guests
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(room);
                    }}
                  >
                    Edit room
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        }
      </div>

      <ResponsiveEditSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={editorTitle}
        subtitle="Room master — details, pricing, and amenities."
        isEdit={draft.id > 0}
        saving={saving}
        deleting={deleting}
        onCancel={closeEditor}
        onDelete={() => void deleteRoom()}
        onSave={() => void saveRoom()}
        saveLabel="Save Room"
      >
        <RoomEditorForm
          draft={draft}
          onChange={setDraft}
          onSave={() => void saveRoom()}
          onCancel={closeEditor}
          saving={saving}
          onOpenRoomStatus={onOpenRoomStatus}
          embedded
        />
      </ResponsiveEditSheet>
    </>
  );
}
