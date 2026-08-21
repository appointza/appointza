import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import type { Enquiry } from "@/models/enquiry.model";
import { EnquiryService } from "@/services/enquiry.service";
import { resolveOrganisationId } from "@/utils/organisationContext.util";

const leadStatusClasses: Record<string, string> = {
  new: "border-transparent bg-orange-50 text-orange-700",
  contacted: "border-transparent bg-blue-50 text-blue-700",
  in_progress: "border-transparent bg-blue-50 text-blue-700",
  converted: "border-transparent bg-emerald-50 text-emerald-700",
  won: "border-transparent bg-emerald-50 text-emerald-700",
  closed: "border-transparent bg-stone-100 text-stone-600",
  lost: "border-transparent bg-stone-100 text-stone-600",
};

export default function OrganizationLeads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const enquiryService = useMemo(() => new EnquiryService(), []);
  const organisationId = resolveOrganisationId(user?.organisationid);

  const [leads, setLeads] = useState<Enquiry[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadLeads = useCallback(async () => {
    if (organisationId <= 0) {
      setLeads([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await enquiryService.selectByOrganisation(organisationId);
      setLeads(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Failed to load organization leads", error);
      setLeads([]);
      toast({
        title: "Could not load leads",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [enquiryService, organisationId, toast]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leads;
    return leads.filter((lead) =>
      [
        lead.name,
        lead.email,
        lead.mobile,
        lead.message,
        lead.status,
        lead.source,
        lead.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [leads, search]);

  return (
    <OrganizationPageShell
      className="box-border h-full min-h-0 overflow-hidden p-4 md:p-6"
    >
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex shrink-0 flex-col gap-3 border-b border-stone-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-appointza-navy">All leads</h2>
            <span className="rounded-full bg-[#FFF0EB] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[#E85D4C]">
              {isLoading ? "…" : filteredLeads.length}
            </span>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, mobile…"
                className={cn(org.input, "h-10 pl-9")}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className={cn(org.btnOutline, "h-10 shrink-0 px-4")}
              onClick={() => void loadLeads()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-stone-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#E85D4C]" />
            Loading leads…
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <Target className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-3 font-medium text-appointza-navy">
              {search ? "No matching leads" : "No leads yet"}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {search
                ? "Try a different search term."
                : "Enquiries from your contact form and other sources will appear here."}
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <Table className="min-w-[1100px] [&_td]:px-5 [&_td]:py-4 [&_th]:h-12 [&_th]:px-5">
              <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#e7e5e4]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-stone-600">Name</TableHead>
                  <TableHead className="text-stone-600">Email</TableHead>
                  <TableHead className="text-stone-600">Mobile</TableHead>
                  <TableHead className="text-stone-600">Status</TableHead>
                  <TableHead className="text-stone-600">Source</TableHead>
                  <TableHead className="hidden text-stone-600 md:table-cell">Message</TableHead>
                  <TableHead className="text-stone-600">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const status = (lead.status || "new").toLowerCase();
                  const createdDate = lead.created_at ? new Date(lead.created_at) : null;
                  const createdLabel =
                    createdDate && !Number.isNaN(createdDate.getTime())
                      ? format(createdDate, "dd MMM yyyy, h:mm a")
                      : "—";

                  return (
                    <TableRow key={lead.id} className="border-stone-200">
                      <TableCell className="font-medium text-appointza-navy">
                        {lead.name?.trim() || "—"}
                      </TableCell>
                    <TableCell className="text-sm text-stone-600">
                      {lead.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                          {lead.email}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-stone-600">
                      {lead.mobile ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                          {lead.mobile}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          leadStatusClasses[status] ??
                            "border-transparent bg-stone-100 text-stone-700",
                        )}
                      >
                        {lead.status || "new"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-stone-600">{lead.source || "—"}</TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-stone-600 md:table-cell">
                      {lead.message || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-stone-600">
                      {createdLabel}
                    </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </OrganizationPageShell>
  );
}
