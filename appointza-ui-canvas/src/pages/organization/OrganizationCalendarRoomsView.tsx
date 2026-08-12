import { format } from "date-fns";
import { BedDouble, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { OrganisationRoom } from "@/models/hospitality.model";
import {
  getRoomAvailabilityState,
  roomAvailabilityClassName,
} from "@/utils/roomAmenities.util";
import { Link } from "react-router-dom";

type OrganizationCalendarRoomsViewProps = {
  selectedDate: Date;
  locationLabel: string;
  rooms: OrganisationRoom[];
  isLoading: boolean;
  occupiedCount: number;
  availableCount: number;
};

export function OrganizationCalendarRoomsView({
  selectedDate,
  locationLabel,
  rooms,
  isLoading,
  occupiedCount,
  availableCount,
}: OrganizationCalendarRoomsViewProps) {
  return (
    <div className="space-y-6 min-w-0">
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

        {locationLabel ?
          <p className="mb-4 text-sm text-stone-600">
            Location: <span className="font-medium text-stone-800">{locationLabel}</span>
          </p>
        : null}

        {isLoading ?
          <div className="flex items-center gap-2 py-12 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#E85D4C]" />
            Loading rooms…
          </div>
        : rooms.length === 0 ?
          <div className="rounded-2xl border border-dashed border-stone-200 px-4 py-10 text-center">
            <BedDouble className="mx-auto mb-3 h-10 w-10 text-stone-300" />
            <p className="text-sm text-stone-600">No rooms defined for this location.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/organization/hospitality?section=room-definitions">Add rooms</Link>
            </Button>
          </div>
        : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => {
              const state = getRoomAvailabilityState(room, selectedDate);
              return (
                <div
                  key={room.id}
                  className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
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
                  {room.guest?.name && (state === "Occupied" || state === "Check-out") ?
                    <p className="mt-2 text-sm text-stone-600">Guest: {room.guest.name}</p>
                  : null}
                  {room.booking?.check_in && room.booking?.check_out ?
                    <p className="mt-1 text-xs text-stone-500">
                      Stay:{" "}
                      {new Date(room.booking.check_in).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      –{" "}
                      {new Date(room.booking.check_out).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  : null}
                </div>
              );
            })}
          </div>
        }

        <p className="mt-4 text-xs text-stone-500">
          Based on room status and current stay dates. Update live status on{" "}
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
