import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrganisationRoom, OrganisationRoomStatusEvent } from "@/models/hospitality.model";
import {
  ROOM_STATUSES,
  ROOM_STATUS_FUNNEL,
  roomStatusEventLabel,
  statusClassName,
  statusLabel,
} from "@/models/hospitality.model";
import { formatRoomTypeLabel } from "@/utils/roomAmenities.util";
import {
  roomBookingLabel,
  roomBookingReference,
  roomGuestName,
  roomGuestPhone,
  roomIsPaid,
  roomPaymentSummary,
} from "@/utils/roomBooking.util";
import { hospitalityService } from "@/services/hospitality.service";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type RoomBookingDetailsDialogProps = {
  room: OrganisationRoom | null;
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  onStatusChange?: (room: OrganisationRoom, status: string) => void;
  onCheckout?: (room: OrganisationRoom) => void;
  onMarkClean?: (room: OrganisationRoom) => void;
};

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatEventTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RoomBookingDetailsDialog({
  room,
  open,
  onClose,
  busy = false,
  onStatusChange,
  onCheckout,
  onMarkClean,
}: RoomBookingDetailsDialogProps) {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<OrganisationRoomStatusEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    if (!open || !room?.id || !room.organisation_id) {
      setEvents([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingEvents(true);
      try {
        const items = await hospitalityService.selectRoomStatusEvents({
          organisation_id: room.organisation_id,
          organisation_room_id: room.id,
          booking_id: room.booking?.booking_id?.trim() || "",
          limit: 50,
        });
        if (!cancelled) setEvents(items || []);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, room?.id, room?.organisation_id, room?.status, room?.booking?.booking_id, busy]);

  if (!room) return null;

  const paid = roomIsPaid(room);
  const total = room.payment?.total ?? 0;
  const amountPaid = room.payment?.paid ?? 0;
  const balance = room.payment?.balance ?? Math.max(0, total - amountPaid);
  const canManage = Boolean(onStatusChange || onCheckout || onMarkClean);

  const chronological = [...events].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  );

  const latestByFunnelType = new Map<string, OrganisationRoomStatusEvent>();
  for (const ev of chronological) {
    const key = (ev.event_type || "").toLowerCase();
    if (ROOM_STATUS_FUNNEL.some((s) => s.event_type === key)) {
      latestByFunnelType.set(key, ev);
    }
    // Treat "booked" and reserved status as same funnel step
    if (key === "booked" || ev.to_status === "reserved") {
      latestByFunnelType.set("booked", ev);
    }
    if (key === "available" && (ev.source || "").toLowerCase() === "mark_clean") {
      latestByFunnelType.set("clean", ev);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "overflow-y-auto",
          isMobile
            ? "h-[88dvh] max-h-[88dvh] rounded-t-3xl p-4"
            : "h-dvh w-full p-6 sm:max-w-lg",
        )}
      >
        <SheetHeader>
          <SheetTitle>Room booking details</SheetTitle>
          <SheetDescription>{roomBookingLabel(room)}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusClassName(room.status)}>{statusLabel(room.status)}</Badge>
            <Badge variant="outline">Room stay</Badge>
            {room.booking?.booking_id ? (
              <Badge variant="secondary">Ref {roomBookingReference(room)}</Badge>
            ) : null}
          </div>

          <section className="space-y-3">
            <h3 className="font-semibold text-appointza-navy">Stay funnel</h3>
            {loadingEvents ? (
              <div className="flex items-center gap-2 text-stone-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading timeline…
              </div>
            ) : (
              <ol className="space-y-2">
                {ROOM_STATUS_FUNNEL.map((step) => {
                  const hit = latestByFunnelType.get(step.event_type);
                  const done = Boolean(hit);
                  return (
                    <li
                      key={step.event_type}
                      className={cn(
                        "rounded-xl border px-3 py-2.5",
                        done
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-stone-100 bg-stone-50/80",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={cn(
                              "text-sm font-medium",
                              done ? "text-appointza-navy" : "text-stone-500",
                            )}
                          >
                            {step.label}
                          </p>
                          {hit ? (
                            <p className="mt-0.5 text-xs text-stone-600">
                              {formatEventTime(hit.occurred_at)}
                              {hit.changed_by_name
                                ? ` · ${hit.changed_by_name}`
                                : ""}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-stone-400">Not yet</p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-[10px]",
                            done ? "border-emerald-300 text-emerald-800" : "text-stone-400",
                          )}
                        >
                          {done ? "Done" : "Pending"}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-appointza-navy">Full timeline</h3>
            {loadingEvents ? null : chronological.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-200 px-3 py-4 text-center text-xs text-stone-500">
                No status changes recorded yet. Changing status (Reserved, Check-in, Checkout,
                Clean) will store the time here.
              </p>
            ) : (
              <ul className="space-y-2">
                {[...chronological].reverse().map((ev) => (
                  <li
                    key={ev.id}
                    className="rounded-xl border border-stone-100 bg-white px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusClassName(ev.to_status)}>
                        {roomStatusEventLabel(ev.event_type, ev.to_status)}
                      </Badge>
                      {ev.from_status ? (
                        <span className="text-xs text-stone-400">
                          from {statusLabel(ev.from_status)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-stone-600">
                      {formatEventTime(ev.occurred_at)}
                      {ev.changed_by_name ? ` · ${ev.changed_by_name}` : ""}
                    </p>
                    {ev.notes?.trim() ? (
                      <p className="mt-1 text-xs text-stone-500">{ev.notes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

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

          {canManage ? (
            <section className="space-y-3 border-t border-stone-100 pt-4">
              <h3 className="font-semibold text-appointza-navy">Manage room</h3>
              {onStatusChange ? (
                <Select
                  value={room.status || "available"}
                  onValueChange={(status) => onStatusChange(room, status)}
                  disabled={busy}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl">
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
              <div className="flex flex-col gap-2 sm:flex-row">
                {onCheckout ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 flex-1 rounded-2xl"
                    disabled={busy}
                    onClick={() => onCheckout(room)}
                  >
                    Checkout
                  </Button>
                ) : null}
                {onMarkClean ? (
                  <Button
                    type="button"
                    className="h-10 flex-1 rounded-2xl bg-gradient-coral text-white hover:opacity-95"
                    disabled={busy}
                    onClick={() => onMarkClean(room)}
                  >
                    Mark clean
                  </Button>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
