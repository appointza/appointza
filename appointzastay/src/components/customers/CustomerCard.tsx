import { Link } from "react-router-dom";
import {
  bookingStatusBadgeClass,
  bookingStatusLabel,
  currentStayStatusLabel,
  formatCustomerDate,
  roomStatusDisplay,
  type CustomerSummary,
} from "@/models/customer";

interface CustomerCardProps {
  customer: CustomerSummary;
  selected: boolean;
  onSelect: () => void;
}

export function CustomerCard({ customer, selected, onSelect }: CustomerCardProps) {
  const initial = customer.Name.trim() ? customer.Name.trim()[0].toUpperCase() : "?";
  const current = customer.CurrentStay;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`room-def-card w-full text-left${selected ? " room-def-card-selected" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold">{customer.Name || "Guest"}</p>
            {customer.HasUserAccount && (
              <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-800">
                Account
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{customer.Phone || "—"}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Bookings</p>
          <p className="mt-0.5 text-sm font-semibold">{customer.TotalBookings}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Spent</p>
          <p className="mt-0.5 text-sm font-semibold">₹{customer.TotalSpent.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Balance</p>
          <p
            className={`mt-0.5 text-sm font-semibold ${
              customer.OutstandingBalance > 0 ? "text-red-600" : "text-muted-foreground"
            }`}
          >
            {customer.OutstandingBalance > 0
              ? `₹${customer.OutstandingBalance.toLocaleString("en-IN")}`
              : "—"}
          </p>
        </div>
      </div>

      {current && (
        <div className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-800">
          Room {current.RoomNumber} · {currentStayStatusLabel(current)}
        </div>
      )}

      <p className="mt-3 text-right text-xs font-medium text-primary">View →</p>
    </button>
  );
}

export function CustomerDetailPanel({
  customer,
  onClose,
}: {
  customer: CustomerSummary;
  onClose: () => void;
}) {
  const initial = customer.Name.trim() ? customer.Name.trim()[0].toUpperCase() : "?";
  const stay = customer.CurrentStay;

  return (
    <aside className="room-def-detail-panel flex flex-col">
      <div className="shrink-0 pt-2 pb-0 flex justify-center md:hidden" aria-hidden>
        <span className="h-1 w-10 rounded-full bg-muted-foreground/25" />
      </div>
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h2 className="truncate text-sm font-bold">{customer.Name}</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 detail-panel-body-2col">
        <div className="detail-panel-col-span-2 flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {initial}
          </div>
          <div>
            <p className="text-sm font-bold">{customer.Name}</p>
            <p className="text-xs text-muted-foreground">📞 {customer.Phone}</p>
            {customer.Email && <p className="text-xs text-muted-foreground">✉ {customer.Email}</p>}
            {customer.HasUserAccount && (
              <span className="mt-1 inline-block rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Registered customer
              </span>
            )}
          </div>
        </div>

        <div className="detail-panel-col-span-2 grid grid-cols-2 gap-2">
          {[
            { value: customer.TotalBookings, label: "Total bookings" },
            { value: customer.ActiveBookings, label: "Active now", highlight: true },
            { value: `₹${customer.TotalSpent.toLocaleString("en-IN")}`, label: "Total paid" },
            {
              value: `₹${customer.OutstandingBalance.toLocaleString("en-IN")}`,
              label: "Balance due",
              danger: customer.OutstandingBalance > 0,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p
                className={`text-lg font-bold ${
                  stat.danger ? "text-red-600" : stat.highlight ? "text-primary" : ""
                }`}
              >
                {stat.value}
              </p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {stay && (
          <div className="detail-panel-col-span-2 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-orange-800">Current stay</p>
            <p className="text-sm font-bold">
              Room {stay.RoomNumber} — {stay.RoomName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCustomerDate(stay.CheckIn)} → {formatCustomerDate(stay.CheckOut)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {stay.Nights} nights · Ref {stay.BookingId}
            </p>
            {(() => {
              const st = roomStatusDisplay(stay.RoomStatus);
              return (
                <span className={`mt-2 inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${st.badgeClass}`}>
                  {st.emoji} {currentStayStatusLabel(stay)}
                </span>
              );
            })()}
            {stay.Balance > 0 && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                ₹{stay.Balance.toLocaleString("en-IN")} outstanding
              </p>
            )}
            <Link
              to={`/staff/rooms/status?id=${encodeURIComponent(stay.RoomId)}`}
              className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
            >
              View on status board →
            </Link>
          </div>
        )}

        <div className="detail-panel-col-span-2 space-y-2">
          <h4 className="room-def-section-title">All Bookings</h4>
          <div className="detail-panel-body-2col">
            {customer.Bookings.map((b) => (
              <div key={b.Id} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold">
                      {b.BookingId} · Room {b.RoomNumber}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {b.RoomName} · Floor {b.FloorNumber}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${bookingStatusBadgeClass(b)}`}
                  >
                    {bookingStatusLabel(b)}
                  </span>
                </div>
                <div className="mt-2 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in</span>
                    <span>{formatCustomerDate(b.CheckIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out</span>
                    <span>{formatCustomerDate(b.CheckOut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nights</span>
                    <span>{b.Nights}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-border pt-1">
                    <span className="text-muted-foreground">Total / Paid / Due</span>
                    <span className="font-medium">
                      ₹{b.Total.toLocaleString("en-IN")} / ₹{b.Paid.toLocaleString("en-IN")} /{" "}
                      <span className={b.Balance > 0 ? "text-red-600" : ""}>
                        ₹{b.Balance.toLocaleString("en-IN")}
                      </span>
                    </span>
                  </div>
                </div>
                {b.BookingStatus === "active" && (
                  <Link
                    to={`/staff/rooms/status?id=${encodeURIComponent(b.RoomId)}`}
                    className="mt-2 inline-block text-[10px] font-semibold text-primary"
                  >
                    Open room →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
