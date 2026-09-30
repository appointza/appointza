import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  OrganisationRoom,
  OrganisationRoomStatusBoardRes,
  ROOM_STATUSES,
  statusClassName,
  statusLabel,
} from "@/models/hospitality.model";
import { hospitalityService } from "@/services/hospitality.service";
import { cn } from "@/lib/utils";

type RoomStatusPanelProps = {
  locationId: number;
  locationName?: string;
  selectedRoomId?: number;
  onEditRoom?: (roomId: number) => void;
};

export function RoomStatusPanel({
  locationId,
  locationName,
  selectedRoomId,
  onEditRoom,
}: RoomStatusPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const organisationId = user?.organisationid ?? 0;

  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<OrganisationRoomStatusBoardRes | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<OrganisationRoom | null>(null);
  const [busy, setBusy] = useState(false);

  const loadBoard = useCallback(async () => {
    if (organisationId <= 0 || locationId <= 0) {
      setBoard(null);
      setSelectedRoom(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await hospitalityService.getStatusBoard({
        organisation_id: organisationId,
        organisation_location_id: locationId,
        room_id: selectedRoomId,
      });
      setBoard(data);
      setSelectedRoom(data?.selected_room ?? null);
    } catch (error) {
      toast({
        title: "Could not load room status",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [locationId, organisationId, selectedRoomId, toast]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const runAction = async (action: () => Promise<boolean>, successMessage: string) => {
    setBusy(true);
    try {
      const ok = await action();
      if (!ok) throw new Error("Action failed");
      toast({ title: successMessage });
      await loadBoard();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = (room: OrganisationRoom, status: string) =>
    void runAction(
      () =>
        hospitalityService.updateRoomStatus({
          id: room.id,
          organisation_id: organisationId,
          status,
        }),
      `Room ${room.room_number} updated.`,
    );

  if (organisationId <= 0) {
    return <p className="text-sm text-stone-500">Sign in with an organisation account.</p>;
  }

  if (locationId <= 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-stone-500">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-stone-300" />
          Select a business location above to view room status for that property.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-stone-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading status board…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {locationName ?
        <p className="flex items-center gap-1.5 text-sm text-stone-600">
          <MapPin className="h-4 w-4 shrink-0 text-[#E85D4C]" />
          Status for <span className="font-medium text-stone-800">{locationName}</span>
          {board?.as_of ? <span className="text-stone-400">· {board.as_of}</span> : null}
        </p>
      : null}

      <div className="flex flex-wrap gap-2">
        {(board?.status_summary ?? []).map((item) => (
          <Badge key={item.value} variant="outline" className={cn("px-3 py-1", statusClassName(item.value))}>
            {item.label}: {item.count}
          </Badge>
        ))}
      </div>

      {(board?.floors ?? []).map((floor) => (
        <div key={floor.floor_number} className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">{floor.label}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {floor.rooms.map((room) => (
              <Card
                key={room.id}
                className={cn(
                  "cursor-pointer transition-shadow hover:shadow-md",
                  selectedRoom?.id === room.id && "ring-2 ring-orange-400",
                )}
                onClick={() => setSelectedRoom(room)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{room.room_number}</CardTitle>
                    <Badge className={statusClassName(room.status)}>{statusLabel(room.status)}</Badge>
                  </div>
                  {room.room_name ? <p className="text-sm text-stone-500">{room.room_name}</p> : null}
                </CardHeader>
                <CardContent className="text-sm text-stone-600">
                  {room.guest?.name ?
                    <p>Guest: {room.guest.name}</p>
                  : <p className="text-stone-400">No guest assigned</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {selectedRoom ?
        <Card className="border-orange-100 bg-orange-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Room {selectedRoom.room_number}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-stone-500">Set status</p>
                <Select
                  value={selectedRoom.status}
                  onValueChange={(status) => updateStatus(selectedRoom, status)}
                  disabled={busy}
                >
                  <SelectTrigger className="w-[220px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => onEditRoom?.(selectedRoom.id)}
              >
                Edit room
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runAction(
                    () =>
                      hospitalityService.checkoutRoom({
                        id: selectedRoom.id,
                        organisation_id: organisationId,
                      }),
                    "Room is available now.",
                  )
                }
              >
                Checkout — room available
              </Button>
              <Button
                disabled={busy}
                onClick={() =>
                  void runAction(
                    () =>
                      hospitalityService.markRoomClean({
                        id: selectedRoom.id,
                        organisation_id: organisationId,
                      }),
                    "Room marked clean and available.",
                  )
                }
              >
                Mark clean
              </Button>
            </div>
          </CardContent>
        </Card>
      : null}
    </div>
  );
}
