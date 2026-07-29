import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Copy,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
import CrmPageShell from "@/components/crm/CrmPageShell";
import CrmEmptyState from "@/components/crm/CrmEmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { EnquiryService } from "@/services/enquiry.service";
import { IntegrationService } from "@/services/integration.service";
import type { Enquiry } from "@/models/enquiry.model";
import type { IntegrationTokenUrlsRes } from "@/models/integration.model";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { resolveOrganisationId } from "@/utils/crm.util";

function formatLeadDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return format(d, "dd MMM yyyy, h:mm a");
}

function statusBadgeClass(status: string): string {
  const s = (status || "new").toLowerCase();
  if (s === "new") return "bg-[#FFF0EB] text-[#E85D4C] border-transparent";
  if (s === "contacted" || s === "in_progress") return "bg-blue-50 text-blue-700 border-transparent";
  if (s === "converted" || s === "won") return "bg-emerald-50 text-emerald-700 border-transparent";
  if (s === "closed" || s === "lost") return "bg-stone-100 text-stone-600 border-transparent";
  return "bg-stone-100 text-stone-700 border-transparent";
}

function CopyUrlRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <div className="flex gap-2">
        <Input readOnly value={value} className={cn(org.input, "h-9 text-xs")} />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => onCopy(value, label)}
          aria-label={`Copy ${label}`}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const CrmLeadPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const enquiryService = useMemo(() => new EnquiryService(), []);
  const integrationService = useMemo(() => new IntegrationService(), []);
  const organisationId = resolveOrganisationId(user?.organisationid);

  const [leads, setLeads] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Enquiry | null>(null);
  const [showIntegration, setShowIntegration] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [integrationUrls, setIntegrationUrls] = useState<IntegrationTokenUrlsRes | null>(null);

  const loadLeads = useCallback(async () => {
    if (!organisationId) {
      setLeads([]);
      return;
    }
    setIsLoading(true);
    try {
      const rows = await enquiryService.select({
        id: 0,
        organisation_id: organisationId,
        status: "",
        source: "",
        is_active: null,
      });
      setLeads(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Failed to load leads", error);
      toast({
        title: "Could not load leads",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [enquiryService, organisationId, toast]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const handleGenerateToken = useCallback(
    async (regenerate = false) => {
      setIsGeneratingToken(true);
      try {
        const urls = await integrationService.generateToken(regenerate);
        setIntegrationUrls(urls);
        setShowIntegration(true);
        toast({
          title: regenerate ? "New integration token created" : "Integration URLs ready",
          description: "Copy the URLs below to connect your external app.",
        });
      } catch (error) {
        console.error("Failed to generate integration token", error);
        toast({
          title: "Could not create token",
          description: "Sign in with an organisation account and try again.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingToken(false);
      }
    },
    [integrationService, toast],
  );

  const copyToClipboard = useCallback(
    async (value: string, label: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast({ title: "Copied", description: `${label} copied to clipboard.` });
      } catch {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) => {
      const hay = [
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
        .toLowerCase();
      return hay.includes(q);
    });
  }, [leads, search]);

  if (!organisationId) {
    return (
      <CrmPageShell
        title="Lead"
        description="Track prospects, capture inquiries, and move leads through your pipeline."
      >
        <CrmEmptyState
          icon={Target}
          title="Organization not found"
          description="Sign in with an organization account to view leads and create integration URLs."
        />
      </CrmPageShell>
    );
  }

  return (
    <CrmPageShell
      title="Lead"
      description="All enquiries and contact form submissions for your organization."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleGenerateToken(false)}
            disabled={isGeneratingToken}
            className={cn(org.btnOutline, "min-h-10")}
          >
            {isGeneratingToken ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Integration URL
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadLeads()}
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
        </div>
      }
    >
      <div className={cn(org.card, "overflow-hidden")}>
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-appointza-navy">All leads</h2>
            <span className="rounded-full bg-[#FFF0EB] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[#E85D4C]">
              {isLoading ? "…" : filteredLeads.length}
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
              placeholder="Search name, email, mobile…"
              className={cn(org.input, "h-10 pl-9")}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#E85D4C]" />
            Loading leads…
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-12">
            <CrmEmptyState
              icon={Target}
              title={search ? "No matching leads" : "No leads yet"}
              description={
                search
                  ? "Try a different search term."
                  : "Enquiries from your contact form and other sources will appear here."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-stone-600">Name</TableHead>
                  <TableHead className="text-stone-600">Contact</TableHead>
                  <TableHead className="text-stone-600">Status</TableHead>
                  <TableHead className="text-stone-600">Source</TableHead>
                  <TableHead className="hidden text-stone-600 md:table-cell">Message</TableHead>
                  <TableHead className="text-stone-600">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell className="font-medium text-appointza-navy">
                      {lead.name?.trim() || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-sm text-stone-600">
                        {lead.email ? (
                          <span className="inline-flex items-center gap-1 truncate">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            {lead.email}
                          </span>
                        ) : null}
                        {lead.mobile ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            {lead.mobile}
                          </span>
                        ) : null}
                        {!lead.email && !lead.mobile ? "—" : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("capitalize", statusBadgeClass(lead.status))}
                      >
                        {lead.status || "new"}
                      </Badge>
                      {!lead.is_active ? (
                        <span className="ml-1 text-xs text-stone-400">(inactive)</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-stone-600">
                      {lead.source?.trim() || "—"}
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate text-sm text-stone-600 md:table-cell">
                      {lead.message?.trim() || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-stone-600">
                      {formatLeadDate(lead.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={showIntegration} onOpenChange={setShowIntegration}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-appointza-navy">Integration URLs</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-600">
            Share these URLs with your external app. The token is included in each URL — keep it private.
          </p>
          {integrationUrls ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3 text-sm text-stone-700">
                <p>
                  <span className="font-medium">Organisation ID:</span>{" "}
                  {integrationUrls.context.organisation_id}
                </p>
                <p>
                  <span className="font-medium">User ID:</span> {integrationUrls.context.userid}
                </p>
              </div>
              <CopyUrlRow
                label="Context URL (organisation_id + userid)"
                value={integrationUrls.context_url}
                onCopy={copyToClipboard}
              />
              <CopyUrlRow
                label="Data URL (leads + customers)"
                value={integrationUrls.data_url}
                onCopy={copyToClipboard}
              />
              <CopyUrlRow
                label="Export URL (everything in one call)"
                value={integrationUrls.export_url}
                onCopy={copyToClipboard}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isGeneratingToken}
                onClick={() => void handleGenerateToken(true)}
              >
                {isGeneratingToken ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerate token
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          {selectedLead ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-appointza-navy">
                  {selectedLead.name || "Lead details"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={cn("capitalize", statusBadgeClass(selectedLead.status))}
                  >
                    {selectedLead.status || "new"}
                  </Badge>
                  {selectedLead.source ? (
                    <Badge variant="outline" className="bg-stone-50 text-stone-700">
                      {selectedLead.source}
                    </Badge>
                  ) : null}
                </div>
                {selectedLead.email ? (
                  <p className="flex items-center gap-2 text-stone-700">
                    <Mail className="h-4 w-4 text-stone-400" />
                    {selectedLead.email}
                  </p>
                ) : null}
                {selectedLead.mobile ? (
                  <p className="flex items-center gap-2 text-stone-700">
                    <Phone className="h-4 w-4 text-stone-400" />
                    {selectedLead.mobile}
                  </p>
                ) : null}
                {selectedLead.message ? (
                  <div>
                    <p className="mb-1 flex items-center gap-1 font-medium text-stone-500">
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </p>
                    <p className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3 text-stone-700 whitespace-pre-wrap">
                      {selectedLead.message}
                    </p>
                  </div>
                ) : null}
                {selectedLead.notes ? (
                  <div>
                    <p className="mb-1 font-medium text-stone-500">Notes</p>
                    <p className="text-stone-700 whitespace-pre-wrap">{selectedLead.notes}</p>
                  </div>
                ) : null}
                <p className="text-xs text-stone-500">
                  Created {formatLeadDate(selectedLead.created_at)}
                  {selectedLead.updated_at &&
                  formatLeadDate(selectedLead.updated_at) !== formatLeadDate(selectedLead.created_at)
                    ? ` · Updated ${formatLeadDate(selectedLead.updated_at)}`
                    : null}
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </CrmPageShell>
  );
};

export default CrmLeadPage;
