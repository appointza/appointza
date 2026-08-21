import { format } from "date-fns";
import { BedDouble, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { OrganisationRoom, ROOM_STATUSES } from "@/models/hospitality.model";
import {
  getRoomAvailabilityState,
  parseDateOnlyLocal,
  roomAvailabilityClassName,
} from "@/utils/roomAmenities.util";
import { roomGuestName, roomGuestPhone, roomHasActiveBooking } from "@/utils/roomBooking.util";
import { Link } from "react-router-dom";

type OrganizationCalendarRoomsViewProps = {
  selectedDate: Date;
  locationLabel: string;
  rooms: OrganisationRoom[];
  isLoading: boolean;
  occupiedCount: number;
  availableCount: number;
  busyRoomId?: number | null;
  onViewDetails?: (room: OrganisationRoom) => void;
  onStatusChange?: (room: OrganisationRoom, status: string) => void;
  onCheckout?: (room: OrganisationRoom) => void;
  onMarkClean?: (room: OrganisationRoom) => void;
};

function formatStayDate(value?: string | null) {
  const date = parseDateOnlyLocal(value);
  if (!date) return null;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function OrganizationCalendarRoomsView({
  selectedDate,
  locationLabel,
  rooms,
  isLoading,
  occupiedCount,
  availableCount,
  busyRoomId = null,
  onViewDetails,
  onStatusChange,
  onCheckout,
  onMarkClean,
}: OrganizationCalendarRoomsViewProps) {
  return (
    <div className="min-w-0 space-y-6">
      <div className={cn(org.card, "p-4 sm:p-5")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-appointza-navy">
            {format(selectedDate, "EEEE, d MMMM yyyy")}
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge className="border-transparent bg-emerald-50 text-emerald-700">
              {availableCount} available
            </Badge>
            <Badge className="border-transparent bg-orange-50 text-orange-800">
              {occupiedCount} occupied / reserved
            </Badge>
            <Badge variant="outline" className="text-stone-600">
              {rooms.length} room{rooms.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        {locationLabel ? (
          <p className="mb-4 text-sm text-stone-600">
            Location: <span className="font-medium text-stone-800">{locationLabel}</span>
          </p>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#E85D4C]" />
            Loading rooms…
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 px-4 py-10 text-center">
            <BedDouble className="mx-auto mb-3 h-10 w-10 text-stone-300" />
            <p className="text-sm text-stone-600">No rooms defined for this location.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/organization/services?kind=rooms">Add rooms</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => {
              const state = getRoomAvailabilityState(room, selectedDate);
              const isBusy = busyRoomId === room.id;
              const hasGuestOrBooking =
                roomHasActiveBooking(room) ||
                state === "Reserved" ||
                state === "Occupied" ||
                state === "Check-out" ||
                state === "Hold";
              const guestName = room.guest?.name?.trim() ? roomGuestName(room) : null;
              const guestPhone = room.guest?.phone?.trim() ? roomGuestPhone(room) : null;
              const checkInLabel = formatStayDate(room.booking?.check_in);
              const checkOutLabel = formatStayDate(room.booking?.check_out);
              const canManage = hasGuestOrBooking && state !== "Available";

              return (
                <div
                  key={room.id}
                  className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-appointza-navy">
                        Room {room.room_number}
                      </p>
                      <p className="text-sm text-stone-500">
                        {room.room_name || room.room_type} · Floor {room.floor_number}
                      </p>
                    </div>
                    <Badge className={cn("shrink-0 border", roomAvailabilityClassName(state))}>
                      {state}
                    </Badge>
                  </div>

                  {canManage ? (
                    <div className="mt-3 space-y-1.5 rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2.5">
                      <p className="text-sm font-semibold text-appointza-navy">
                        {guestName || "Guest details"}
                      </p>
                      {guestPhone ? (
                        <p className="text-sm text-stone-600">{guestPhone}</p>
                      ) : null}
                      {room.guest?.email?.trim() ? (
                        <p className="text-xs text-stone-500">{room.guest.email}</p>
                      ) : null}
                      {checkInLabel || checkOutLabel ? (
                        <p className="text-xs text-stone-500">
                          Stay: {checkInLabel || "—"} – {checkOutLabel || "—"}
                          {(room.booking?.nights ?? 0) > 0
                            ? ` · ${room.booking?.nights} night${room.booking?.nights === 1 ? "" : "s"}`
                            : ""}
                        </p>
                      ) : null}
                      {room.booking?.booking_id?.trim() ? (
                        <p className="text-xs text-stone-400">
                          Ref {room.booking.booking_id}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {canManage ? (
                    <div className="mt-3 space-y-2">
                      {onStatusChange ? (
                        <Select
                          value={room.status || "available"}
                          onValueChange={(status) => onStatusChange(room, status)}
                          disabled={isBusy}
                        >
                          <SelectTrigger className="h-9 w-full rounded-xl border-stone-200 bg-white">
                            <SelectValue placeholder="Room status" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROOM_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}

                      <div className="flex flex-col gap-2">
                        {onViewDetails ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full rounded-2xl border-stone-200"
                            disabled={isBusy}
                            onClick={() => onViewDetails(room)}
                          >
                            {isBusy ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="mr-1.5 h-4 w-4" />
                            )}
                            View customer details
                          </Button>
                        ) : null}
                        <div className="flex gap-2">
                          {onCheckout ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 flex-1 rounded-2xl"
                              disabled={isBusy}
                              onClick={() => onCheckout(room)}
                            >
                              Checkout
                            </Button>
                          ) : null}
                          {onMarkClean ? (
                            <Button
                              type="button"
                              className="h-9 flex-1 rounded-2xl bg-gradient-coral text-white hover:opacity-95"
                              disabled={isBusy}
                              onClick={() => onMarkClean(room)}
                            >
                              Mark clean
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-xs text-stone-500">
          Reserved and occupied rooms show guest details for the selected date. Full board also
          available under{" "}
          <Link
            to="/organization/hospitality?section=room-status"
            className="font-medium text-[#E85D4C] hover:underline"
          >
            Hospitality → Room status
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default OrganizationCalendarRoomsView;
