import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { platformApi } from "@/services/platform.service";

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PlatformTodayBookingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["platform-today-bookings"],
    queryFn: () => platformApi.listTodayBookings(),
    refetchInterval: 60_000,
  });

  const bookings = data?.bookings ?? [];
  const dateLabel = data?.date
    ? new Date(`${data.date}T12:00:00`).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Today";

  return (
    <PlatformShell
      title="Today's bookings"
      subtitle={
        bookings.length > 0
          ? `${bookings.length} booking${bookings.length === 1 ? "" : "s"} on ${dateLabel}`
          : `Bookings created or checking in on ${dateLabel}`
      }
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading bookings…
        </div>
      )}

      {error && (
        <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load today's bookings.
        </div>
      )}

      {!isLoading && !error && bookings.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">No bookings for today yet.</p>
      )}

      {!isLoading && !error && bookings.length > 0 && (
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="min-w-[140px]">Booked at</TableHead>
              <TableHead className="min-w-[160px]">Guest</TableHead>
              <TableHead className="whitespace-nowrap">Mobile</TableHead>
              <TableHead className="min-w-[160px]">Organisation</TableHead>
              <TableHead className="whitespace-nowrap">Room</TableHead>
              <TableHead className="whitespace-nowrap">Check-in</TableHead>
              <TableHead className="whitespace-nowrap">Check-out</TableHead>
              <TableHead className="text-right whitespace-nowrap">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="align-top text-sm whitespace-nowrap">
                  <div>{formatDateTime(booking.createdAt)}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {booking.bookedToday && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        New today
                      </Badge>
                    )}
                    {booking.arrivalToday && (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px] px-1.5 py-0">
                        Arrival today
                      </Badge>
                    )}
                  </div>
                  {booking.bookingCode && (
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {booking.bookingCode}
                    </div>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <div className="font-medium">{booking.guestName || "Guest"}</div>
                  {booking.guestEmail && (
                    <div className="text-xs text-muted-foreground">{booking.guestEmail}</div>
                  )}
                </TableCell>
                <TableCell className="align-top font-mono text-sm whitespace-nowrap">
                  {booking.guestPhone || "—"}
                </TableCell>
                <TableCell className="align-top">
                  <div className="font-medium">{booking.organisationName || "—"}</div>
                  {booking.organisationSlug && (
                    <div className="text-xs text-muted-foreground">{booking.organisationSlug}</div>
                  )}
                </TableCell>
                <TableCell className="align-top text-sm whitespace-nowrap">
                  {booking.roomNumber || booking.roomName || "—"}
                </TableCell>
                <TableCell className="align-top text-sm whitespace-nowrap">{booking.checkIn || "—"}</TableCell>
                <TableCell className="align-top text-sm whitespace-nowrap">{booking.checkOut || "—"}</TableCell>
                <TableCell className="align-top text-right text-sm whitespace-nowrap">
                  <div className="font-medium">{formatMoney(booking.total)}</div>
                  {booking.balance > 0 && (
                    <div className="text-xs text-amber-700">Due {formatMoney(booking.balance)}</div>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant="outline" className="capitalize">
                    {booking.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PlatformShell>
  );
}
