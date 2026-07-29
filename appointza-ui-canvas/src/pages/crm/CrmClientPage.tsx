import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import CrmPageShell from "@/components/crm/CrmPageShell";
import CrmEmptyState from "@/components/crm/CrmEmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AppoinmentService } from "@/services/appoinment.service";
import { EventService } from "@/services/event.service";
import { EventBookingService } from "@/services/eventbooking.service";
import { ClientInfoRes } from "@/models/appoinment.model";
import { EventSelectReq } from "@/models/event.model";
import { EventBookingSelectReq } from "@/models/eventbooking.model";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { clientInitials, resolveOrganisationId } from "@/utils/crm.util";

const CrmClientPage = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const eventService = useMemo(() => new EventService(), []);
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const organisationId = resolveOrganisationId(user?.organisationid);

  const [clients, setClients] = useState<ClientInfoRes[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientInfoRes | null>(null);

  const loadClients = useCallback(async () => {
    if (!isAuthenticated || !organisationId) {
      setClients([]);
      return;
    }
    setIsLoading(true);
    try {
      const appointmentClients =
        await appointmentService.selectUniqueClientsByOrganisation(organisationId);
      const clientsMap = new Map<number, ClientInfoRes>();

      (appointmentClients || []).forEach((client) => {
        if (client.userid > 0) {
          clientsMap.set(client.userid, client);
        }
      });

      try {
        const eventReq: EventSelectReq = {
          id: 0,
          organisation_id: organisationId,
          organisation_location_id: 0,
          status: "",
          is_public: true,
        };
        const events = await eventService.select(eventReq);

        for (const event of events || []) {
          const bookingReq: EventBookingSelectReq = {
            id: 0,
            event_id: event.id,
            user_id: 0,
            payment_status: "",
            check_in_status: "",
            confirmation_status: "",
          };
          const bookings = await eventBookingService.select(bookingReq);
          (bookings || []).forEach((booking) => {
            if (!booking.user_id || booking.user_id <= 0) return;

            const existing = clientsMap.get(booking.user_id);
            if (existing) {
              if (!existing.username && booking.user_name) {
                existing.username = booking.user_name;
              }
              if (!existing.mobile && booking.user_mobile) {
                existing.mobile = booking.user_mobile;
              }
              clientsMap.set(booking.user_id, existing);
              return;
            }

            const eventClient = new ClientInfoRes();
            eventClient.userid = booking.user_id;
            eventClient.username = booking.user_name || `User #${booking.user_id}`;
            eventClient.mobile = booking.user_mobile || "";
            eventClient.city = "";
            clientsMap.set(eventClient.userid, eventClient);
          });
        }
      } catch (eventMergeError) {
        console.error("Error merging event clients", eventMergeError);
      }

      const sorted = Array.from(clientsMap.values()).sort((a, b) =>
        (a.username || "").localeCompare(b.username || "", undefined, { sensitivity: "base" }),
      );
      setClients(sorted);
    } catch (error) {
      console.error("Failed to load clients", error);
      toast({
        title: "Could not load clients",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    organisationId,
    appointmentService,
    eventService,
    eventBookingService,
    toast,
  ]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const hay = [c.username, c.mobile, c.city].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [clients, search]);

  if (!organisationId) {
    return (
      <CrmPageShell
        title="Client"
        description="Customers who booked services or events with your organization."
      >
        <CrmEmptyState
          icon={UserPlus}
          title="Organization not found"
          description="Sign in with an organization account to view clients."
        />
      </CrmPageShell>
    );
  }

  return (
    <CrmPageShell
      title="Client"
      description="Customers who booked services or events with your organization."
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadClients()}
          disabled={isLoading}
          className={cn(org.btnOutline, "min-h-10")}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      }
    >
      <div className={cn(org.card, "overflow-hidden")}>
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-appointza-navy">All clients</h2>
            <span className="rounded-full bg-[#FFF0EB] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[#E85D4C]">
              {isLoading ? "…" : filteredClients.length}
            </span>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or mobile…"
              className={cn(org.input, "h-10 pl-9")}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#E85D4C]" />
            Loading clients…
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-12">
            <CrmEmptyState
              icon={Users}
              title={search ? "No matching clients" : "No clients yet"}
              description={
                search
                  ? "Try a different search term."
                  : "Clients appear here after they book a service or register for an event."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-stone-600" />
                  <TableHead className="text-stone-600">Name</TableHead>
                  <TableHead className="text-stone-600">Mobile</TableHead>
                  <TableHead className="text-stone-600">City</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow
                    key={client.userid}
                    className="cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    <TableCell>
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-xs font-semibold text-stone-600"
                        aria-hidden
                      >
                        {clientInitials(client.username)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-appointza-navy">
                      {client.username?.trim() || "—"}
                    </TableCell>
                    <TableCell>
                      {client.mobile ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-stone-600">
                          <Phone className="h-3.5 w-3.5 text-stone-400" />
                          {client.mobile}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {client.city ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-stone-600">
                          <MapPin className="h-3.5 w-3.5 text-stone-400" />
                          {client.city}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedClient ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-appointza-navy">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-coral text-sm font-semibold text-white">
                    {clientInitials(selectedClient.username)}
                  </span>
                  {selectedClient.username || "Client"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-stone-700">
                {selectedClient.mobile ? (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-stone-400" />
                    {selectedClient.mobile}
                  </p>
                ) : null}
                {selectedClient.city ? (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-stone-400" />
                    {selectedClient.city}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </CrmPageShell>
  );
};

export default CrmClientPage;
