import { useState } from "react";
import { Link } from "react-router-dom";
import { ROOM_STATUSES, getStatusMeta, resolveAmenities } from "@/config/roomCatalog";
import { formatDisplayDate } from "@/models/room";
import { formatStayDateTime } from "@/models/staffBooking";
import type { RoomDefinition } from "@/models/room";
import {
  STATUS_MEANINGS,
  needsCleaningAssignment,
  stayHint,
  type CleaningStaffMember,
} from "@/models/roomStatus";
import { stayApi } from "@/services/stay.service";
import { useToast } from "@/hooks/use-toast";

interface RoomStatusDetailPanelProps {
  room: RoomDefinition;
  cleaningStaff: CleaningStaffMember[];
  onClose: () => void;
  onUpdated: () => void;
}

export function RoomStatusDetailPanel({
  room,
  cleaningStaff,
  onClose,
  onUpdated,
}: RoomStatusDetailPanelProps) {
  const { toast } = useToast();
  const [staffId, setStaffId] = useState("");
  const [busy, setBusy] = useState(false);

  const st = getStatusMeta(room.Status);
  const amenities = resolveAmenities(room.Amenities ?? []);
  const hint = stayHint(room);
  const showGuest =
    room.Guest &&
    room.Booking &&
    (room.Status === "occupied" || room.Status === "reserved" || room.Status === "checkout_pending");

  const run = async (fn: () => Promise<unknown>, message?: string) => {
    setBusy(true);
    try {
      await fn();
      if (message) toast({ title: message });
      onUpdated();
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="room-def-detail-panel flex flex-col">
      <div className="shrink-0 pt-2 pb-0 flex justify-center md:hidden" aria-hidden>
        <span className="h-1 w-10 rounded-full bg-muted-foreground/25" />
      </div>
      <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Room detail</p>
          <h2 className="text-base font-semibold">Room {room.RoomNumber}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5 detail-panel-body-2col">
        {showGuest && room.Guest && room.Booking && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-orange-800">Guest</p>
            <p className="text-sm font-semibold">{room.Guest.Name}</p>
            <p className="text-xs text-muted-foreground">{room.Guest.Phone}</p>
            {room.Guest.Email && <p className="text-xs text-muted-foreground">{room.Guest.Email}</p>}
            <p className="mt-2 border-t border-orange-200/60 pt-2 text-xs text-muted-foreground">
              {formatStayDateTime(room.Booking.CheckIn, room.Booking.CheckInTime)} →{" "}
              {formatStayDateTime(room.Booking.CheckOut, room.Booking.CheckOutTime)} · {room.Booking.Nights} nights
            </p>
            {hint && <p className="mt-1 text-xs font-semibold text-orange-800">{hint}</p>}
            {room.Payment && room.Payment.Balance > 0 && (
              <p className="mt-1 text-xs font-semibold text-red-600">
                Balance due: ₹{room.Payment.Balance.toLocaleString("en-IN")}
              </p>
            )}
          </div>
        )}

        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${st.badgeClass.replace("text-", "border-").split(" ")[0] ?? "border-border"} bg-muted/30`}>
          <span className="text-xl">{st.emoji}</span>
          <div>
            <p className="text-xs font-semibold">{st.label}</p>
            <p className="text-[11px] text-muted-foreground">{STATUS_MEANINGS[room.Status] ?? ""}</p>
          </div>
        </div>

        {needsCleaningAssignment(room.Status) && (
          <div className="detail-panel-col-span-2 space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Assign for cleaning
            </h4>
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs">
              {room.CleaningAssignment ? (
                <div className="mb-3 rounded-lg border border-teal-200 bg-teal-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-teal-800">Assigned to</p>
                  <p className="mt-1 text-sm font-bold">{room.CleaningAssignment.UserName}</p>
                </div>
              ) : (
                <p className="mb-3 text-[11px] text-muted-foreground">No one assigned yet</p>
              )}
              {cleaningStaff.length === 0 ? (
                <p className="text-[10px] text-amber-700">
                  Add housekeeping staff in{" "}
                  <Link to="/staff/users" className="font-semibold text-primary hover:underline">
                    Users
                  </Link>{" "}
                  first.
                </p>
              ) : (
                <>
                  <select
                    className="room-def-input mb-2"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                  >
                    <option value="">Select staff…</option>
                    {cleaningStaff.map((u) => (
                      <option key={u.Id} value={u.Id}>
                        {u.Name} · {u.Phone}
                      </option>
                    ))}
                  </select>
                  <div className="detail-panel-fields-2">
                    <button
                      type="button"
                      disabled={!staffId || busy}
                      className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      onClick={() => run(() => stayApi.rooms.assignCleaning(room.Id, staffId, false), "Staff assigned")}
                    >
                      Assign
                    </button>
                    {room.Status === "checkout_pending" && (
                      <button
                        type="button"
                        disabled={!staffId || busy}
                        className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        onClick={() =>
                          run(() => stayApi.rooms.assignCleaning(room.Id, staffId, true), "Assigned & sent to cleaning")
                        }
                      >
                        Assign & Clean
                      </button>
                    )}
                  </div>
                  {room.CleaningAssignment && (
                    <button
                      type="button"
                      disabled={busy}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium"
                      onClick={() => run(() => stayApi.rooms.clearCleaning(room.Id), "Assignment cleared")}
                    >
                      Unassign
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {amenities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Services</h4>
            <ul className="space-y-1 rounded-xl border border-border bg-muted/20 p-4 text-xs">
              {amenities.map((a) => (
                <li key={a!.id}>
                  {a!.icon} {a!.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Change status</h4>
          <div className="detail-panel-fields-2 gap-1.5">
            {ROOM_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                disabled={busy}
                className={`w-full rounded-lg border px-2.5 py-2 text-left text-[10px] transition ${
                  room.Status === s.value
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
                onClick={() => run(() => stayApi.rooms.updateStatus(room.Id, s.value), `Status: ${s.label}`)}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="detail-panel-col-span-2 space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Actions</h4>
          <div className="detail-panel-fields-2">
            {room.Status === "occupied" && room.Booking && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-medium hover:bg-muted"
                  onClick={() => run(() => stayApi.rooms.extendStay(room.Id), "Stay extended (+1 night)")}
                >
                  Extend stay (+1 night)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-medium hover:bg-muted"
                  onClick={() => run(() => stayApi.rooms.addCharges(room.Id), "₹500 added to balance")}
                >
                  Add charges (+₹500)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="w-full rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground"
                  onClick={() => run(() => stayApi.rooms.checkout(room.Id), "Checkout initiated")}
                >
                  Checkout
                </button>
              </>
            )}
            {room.Status === "checkout_pending" && (
              <button
                type="button"
                disabled={busy}
                className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white"
                onClick={() => run(() => stayApi.rooms.updateStatus(room.Id, "cleaning"), "Sent to cleaning")}
              >
                Send to cleaning
              </button>
            )}
            {room.Status === "cleaning" && (
              <button
                type="button"
                disabled={busy}
                className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white"
                onClick={() => run(() => stayApi.rooms.markClean(room.Id), "Room marked available")}
              >
                Mark available
              </button>
            )}
          </div>
        </div>

        <Link
          to={`/staff/rooms/definitions?id=${encodeURIComponent(room.Id)}`}
          className="detail-panel-col-span-2 inline-block text-xs font-medium text-primary hover:underline"
        >
          Edit room definition →
        </Link>
      </div>
    </aside>
  );
}
