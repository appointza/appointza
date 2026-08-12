import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  OrganisationRoom,
  statusClassName,
  statusLabel,
} from "@/models/hospitality.model";
import {
  ROOM_STATUS_EMOJI,
  amenityLabels,
  formatRoomTypeLabel,
} from "@/utils/roomAmenities.util";

type RoomCardPreviewProps = {
  room: OrganisationRoom;
};

export function RoomCardPreview({ room }: RoomCardPreviewProps) {
  const amenitiesText = amenityLabels(room.amenities ?? []).join(" | ");
  const statusEmoji = ROOM_STATUS_EMOJI[room.status] ?? "⚪";
  const roomCode = room.booking_rules.room_code || `room-${room.room_number}`.toLowerCase();
  const weekdayPrice = room.pricing.price_per_night;

  return (
    <Card className="overflow-hidden border-orange-100 bg-gradient-to-br from-orange-50/50 to-white">
      <CardHeader className="pb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Room Card Preview</p>
        <CardTitle className="text-xl text-stone-900">
          Room {room.room_number || "—"}
        </CardTitle>
        <p className="text-sm capitalize text-stone-600">{formatRoomTypeLabel(room.room_type)}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-stone-700">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusClassName(room.status)}>
            {statusEmoji} Status: {statusLabel(room.status)}
          </Badge>
        </div>

        {room.guest?.name ?
          <p>
            <span className="font-medium">Guest:</span> {room.guest.name}
          </p>
        : null}

        {room.booking?.check_out ?
          <p>
            <span className="font-medium">Check-out:</span>{" "}
            {new Date(room.booking.check_out).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        : null}

        {weekdayPrice > 0 ?
          <p className="font-medium text-stone-900">
            ₹{weekdayPrice.toLocaleString("en-IN")}/night weekday
          </p>
        : null}

        {amenitiesText ?
          <p className="text-xs leading-relaxed text-stone-600">{amenitiesText}</p>
        : null}

        <p className="text-xs text-stone-400">ID: {roomCode}</p>
      </CardContent>
    </Card>
  );
}
