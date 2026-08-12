import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { OrganisationRoom } from "@/models/hospitality.model";
import { statusClassName, statusLabel } from "@/models/hospitality.model";
import { formatRoomTypeLabel } from "@/utils/roomAmenities.util";
import {
  roomBookingLabel,
  roomBookingReference,
  roomGuestName,
  roomGuestPhone,
  roomIsPaid,
  roomPaymentSummary,
} from "@/utils/roomBooking.util";

type RoomBookingDetailsDialogProps = {
  room: OrganisationRoom | null;
  open: boolean;
  onClose: () => void;
};

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function RoomBookingDetailsDialog({
  room,
  open,
  onClose,
}: RoomBookingDetailsDialogProps) {
  if (!room) return null;

  const paid = roomIsPaid(room);
  const total = room.payment?.total ?? 0;
  const amountPaid = room.payment?.paid ?? 0;
  const balance = room.payment?.balance ?? Math.max(0, total - amountPaid);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Room booking details</DialogTitle>
          <DialogDescription>{roomBookingLabel(room)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusClassName(room.status)}>{statusLabel(room.status)}</Badge>
            <Badge variant="outline">Room stay</Badge>
            {room.booking?.booking_id ? (
              <Badge variant="secondary">Ref {roomBookingReference(room)}</Badge>
            ) : null}
          </div>

          <section className="space-y-2">
            <h3 className="font-semibold text-appointza-navy">Guest</h3>
            <dl className="grid gap-1.5 sm:grid-cols-2">
              <div>
                <dt className="text-stone-500">Name</dt>
                <dd className="font-medium">{roomGuestName(room)}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Phone</dt>
                <dd>{roomGuestPhone(room)}</dd>
              </div>
              {room.guest?.email?.trim() ? (
                <div className="sm:col-span-2">
                  <dt className="text-stone-500">Email</dt>
                  <dd>{room.guest.email}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-appointza-navy">Room</h3>
            <dl className="grid gap-1.5 sm:grid-cols-2">
              <div>
                <dt className="text-stone-500">Room number</dt>
                <dd>{room.room_number || "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Type</dt>
                <dd>{formatRoomTypeLabel(room.room_type)}</dd>
              </div>
              {room.room_name?.trim() ? (
                <div className="sm:col-span-2">
                  <dt className="text-stone-500">Name</dt>
                  <dd>{room.room_name}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-stone-500">Floor</dt>
                <dd>{room.floor_number ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Capacity</dt>
                <dd>{room.capacity?.total_guests ?? "—"} guests</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-appointza-navy">Stay</h3>
            <dl className="grid gap-1.5 sm:grid-cols-2">
              <div>
                <dt className="text-stone-500">Check-in</dt>
                <dd>{room.booking?.check_in || "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Check-out</dt>
                <dd>{room.booking?.check_out || "—"}</dd>
              </div>
              {(room.booking?.nights ?? 0) > 0 ? (
                <div>
                  <dt className="text-stone-500">Nights</dt>
                  <dd>{room.booking?.nights}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-appointza-navy">Payment</h3>
            <dl className="grid gap-1.5 sm:grid-cols-2">
              <div>
                <dt className="text-stone-500">Status</dt>
                <dd>{paid ? "Paid" : "Balance due"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Summary</dt>
                <dd>{roomPaymentSummary(room)}</dd>
              </div>
              {total > 0 ? (
                <>
                  <div>
                    <dt className="text-stone-500">Total</dt>
                    <dd className="font-medium">{formatInr(total)}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Balance</dt>
                    <dd>{formatInr(balance)}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          </section>

          {room.cleaning_assignment?.staff_name?.trim() ? (
            <section className="space-y-2">
              <h3 className="font-semibold text-appointza-navy">Housekeeping</h3>
              <p>{room.cleaning_assignment.staff_name}</p>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
