import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { OrganisationCrmCatalogueOverview } from "@/models/organisationCrmCatalogue.model";
import type {
  OrganisationAiSalesStrategy,
  OrganisationLeadResearchConfig,
  OrganisationLeadResearchField,
  OrganisationSalesKnowledge,
  OrganisationSalesPriority,
  OrganisationSalesProfileView,
} from "@/models/organisationSalesProfile.model";
import { OrganisationCrmService } from "@/services/organisationCrm.service";
import { resolveOrganisationId } from "@/utils/organisationContext.util";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

function apiMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function rupees(value?: number): string {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function livePrice(catalogue: OrganisationCrmCatalogueOverview | null, kind: string, id: number): string {
  if (kind === "service") {
    const service = catalogue?.services?.find((item) => item.id === id);
    if (!service) return "Not in the live catalogue";
    if (service.show_price === false) return "Price hidden in the live catalogue";
    if (service.weekday_price || service.weekend_price) {
      return `Weekday ${rupees(service.weekday_price || service.price)} · Weekend ${rupees(service.weekend_price || service.price)}`;
    }
    return rupees(service.price);
  }
  if (kind === "event") {
    const event = catalogue?.events?.find((item) => item.id === id);
    if (!event) return "Not in the live catalogue";
    if (event.slot_limit > 0 && event.remainingslot <= 0) return "No remaining slots";
    return `Entry ${rupees(event.entry_amount)}`;
  }
  return "Check the live catalogue";
}

const statusLabel: Record<string, string> = {
  not_generated: "Not generated",
  generating: "Generating",
  pending_review: "Pending review",
  approved: "Approved",
  refresh_required: "Catalogue changed",
};

function emptyKnowledge(): OrganisationSalesKnowledge {
  return {
    ideal_customers: [],
    value_proposition: "",
    differentiators: [],
    proof: [],
    priorities: [],
    approved_claims: [],
    discount_limit: "",
    do_not_promise: [],
  };
}

function emptyResearch(): OrganisationLeadResearchConfig {
  return { fields: [] };
}

function emptyStrategy(): OrganisationAiSalesStrategy {
  return {
    qualification_rules: [],
    offer_matching: [],
    objections: [],
    discovery_questions: [],
    tone: "",
    channel: "",
    follow_up: "",
    opt_out: "",
    escalation: "",
  };
}

type Props = {
  catalogue?: OrganisationCrmCatalogueOverview | null;
};

export default function CrmSalesProfile({ catalogue: catalogueProp }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const service = useMemo(() => new OrganisationCrmService(), []);
  const organisationId = resolveOrganisationId(user?.organisationid);

  const [profile, setProfile] = useState<OrganisationSalesProfileView | null>(null);
  const [catalogue, setCatalogue] = useState<OrganisationCrmCatalogueOverview | null>(null);
  const [knowledge, setKnowledge] = useState<OrganisationSalesKnowledge>(emptyKnowledge);
  const [research, setResearch] = useState<OrganisationLeadResearchConfig>(emptyResearch);
  const [strategy, setStrategy] = useState<OrganisationAiSalesStrategy>(emptyStrategy);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const apply = useCallback((next: OrganisationSalesProfileView) => {
    setProfile(next);
    setKnowledge(next.knowledge ?? emptyKnowledge());
    setResearch(next.lead_research ?? emptyResearch());
    setStrategy(next.strategy ?? emptyStrategy());
  }, []);

  const load = useCallback(async () => {
    if (organisationId <= 0) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await service.getSalesProfile(organisationId);
      apply(next);
      if (catalogueProp === undefined) {
        const overview = await service
          .getCatalogueOverview({ organisation_id: organisationId })
          .catch(() => null);
        setCatalogue(overview);
      }
    } catch (err) {
      console.error(err);
      setProfile(null);
      toast({
        title: "Could not load the sales profile",
        description: apiMessage(err, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [apply, catalogueProp, organisationId, service, toast]);

  useEffect(() => {
    if (catalogueProp !== undefined) setCatalogue(catalogueProp ?? null);
  }, [catalogueProp]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (label: string, work: () => Promise<OrganisationSalesProfileView>) => {
    setBusy(label);
    try {
      apply(await work());
    } catch (err) {
      toast({
        title: "Sales profile",
        description: apiMessage(err, "Please try again."),
        variant: "destructive",
      });
      await load();
    } finally {
      setBusy("");
    }
  };

  const syncMatching = (priorities: OrganisationSalesPriority[]) => {
    setStrategy((current) => ({
      ...current,
      offer_matching: priorities.map((priority) => {
        const existing = current.offer_matching?.find(
          (rule) => rule.kind === priority.kind && rule.offer_id === priority.offer_id,
        );
        return {
          kind: priority.kind,
          offer_id: priority.offer_id,
          name: priority.name,
          when:
            existing?.when ||
            `Use when the prospect's research matches ${priority.name}. Confirm the live catalogue before quoting a price, date, or slot.`,
        };
      }),
    }));
  };

  const addPriority = (kind: string, offerId: number, name: string) => {
    if (knowledge.priorities.some((item) => item.kind === kind && item.offer_id === offerId)) return;
    const priorities = [
      ...knowledge.priorities,
      {
        kind,
        offer_id: offerId,
        name,
        problem_solved: `Customer need that ${name} is meant to solve. Confirm this before using it.`,
      },
    ];
    setKnowledge({ ...knowledge, priorities });
    syncMatching(priorities);
  };

  if (loading) {
    return (
      <section id="sales-profile" className="flex min-h-[8rem] items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-sm text-stone-500">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        Loading how this organisation sells…
      </section>
    );
  }

  if (!profile) {
    return (
      <section id="sales-profile" className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-8 text-center">
        <p className="font-medium text-appointza-navy">Sales profile unavailable</p>
        <Button type="button" variant="outline" className={org.btnOutline} onClick={() => void load()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </section>
    );
  }

  const status = profile.status || "not_generated";
  const canEdit = status === "pending_review" || status === "approved" || status === "refresh_required";
  const offers = [
    ...(catalogue?.services ?? []).map((service) => ({
      kind: "service",
      id: service.id,
      name: service.name,
    })),
    ...(catalogue?.events ?? []).map((event) => ({
      kind: "event",
      id: event.id,
      name: event.event_name,
    })),
  ];

  return (
    <section id="sales-profile" className="scroll-mt-4 flex flex-col gap-5">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-appointza-navy md:text-xl">Sell a service</h2>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">
              Offer a catalogue service to each lead. Prepare checks that it is still active, reads the current price, and writes a short message.
            </p>
          </div>
          <span className="rounded-full bg-[#eef2f7] px-3 py-1 text-[12px] font-medium text-[#1a1a1a]">
            {statusLabel[status] || status}
          </span>
        </div>

        {profile.last_error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {profile.last_error}
            {profile.approved_available ? " The last approved service list was kept." : ""}
          </p>
        ) : null}
        {profile.catalogue_changed ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            The catalogue changed. Leads still use the last approved service list until you save and approve.
          </p>
        ) : null}
        {status === "pending_review" && profile.approved_available ? (
          <p className="rounded-md border border-[#e6eaf0] bg-white px-3 py-2 text-sm text-stone-600">
            This draft is not used on leads until you approve it.
          </p>
        ) : null}

        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
          <h3 className="text-[15px] font-semibold text-[#1a1a1a]">Services to offer</h3>
          <p className="text-[13px] text-stone-500">
            Prepare uses this list, then checks the live catalogue before the message quotes a price.
          </p>
          {canEdit ? (
            <>
              <div className="space-y-2">
                {knowledge.priorities.length === 0 ? (
                  <p className="text-[13px] text-stone-500">No service selected yet. Add one from the catalogue.</p>
                ) : null}
                {knowledge.priorities.map((priority) => (
                  <div key={`${priority.kind}-${priority.offer_id}`} className="flex items-center justify-between gap-3 rounded-md border border-[#e6eaf0] px-3 py-2">
                    <div>
                      <p className="text-[13px] font-medium text-[#1a1a1a]">
                        {priority.name} <span className="font-normal text-stone-500">({priority.kind} {priority.offer_id})</span>
                      </p>
                      <p className="text-[12px] text-stone-500">{livePrice(catalogue, priority.kind, priority.offer_id)}</p>
                    </div>
                    <button
                      type="button"
                      className="text-[12px] text-stone-500 hover:text-[#1a1a1a]"
                      onClick={() => {
                        const priorities = knowledge.priorities.filter(
                          (item) => !(item.kind === priority.kind && item.offer_id === priority.offer_id),
                        );
                        setKnowledge({ ...knowledge, priorities });
                        syncMatching(priorities);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {offers.length > 0 ? (
                <select
                  className="h-9 w-full rounded-md border border-[#e6eaf0] bg-white px-2 text-[13px]"
                  defaultValue=""
                  onChange={(e) => {
                    const [kind, id] = e.target.value.split(":");
                    const offer = offers.find((item) => item.kind === kind && String(item.id) === id);
                    if (offer) addPriority(offer.kind, offer.id, offer.name);
                    e.target.value = "";
                  }}
                >
                  <option value="">Add a service from the catalogue</option>
                  {offers.map((offer) => (
                    <option key={`${offer.kind}-${offer.id}`} value={`${offer.kind}:${offer.id}`}>
                      {offer.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </>
          ) : (
            <div className="space-y-2">
              {offers.length === 0 ? (
                <p className="text-[13px] text-stone-500">The live catalogue has no active service yet.</p>
              ) : (
                offers.map((offer) => (
                  <div key={`${offer.kind}-${offer.id}`} className="rounded-md border border-[#e6eaf0] px-3 py-2">
                    <p className="text-[13px] font-medium text-[#1a1a1a]">
                      {offer.name} <span className="font-normal text-stone-500">({offer.kind} {offer.id})</span>
                    </p>
                    <p className="text-[12px] text-stone-500">{livePrice(catalogue, offer.kind, offer.id)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {canEdit ? (
          <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
            <h3 className="text-[15px] font-semibold text-[#1a1a1a]">Questions that help</h3>
            <p className="text-[13px] text-stone-500">
              Optional. Prepare still names a service when an answer is missing. The answer stays on the lead.
            </p>
            {research.fields.map((field, index) => (
              <div key={`${field.key}-${index}`} className="grid gap-2 rounded-md border border-[#e6eaf0] p-3 sm:grid-cols-2">
                <div>
                  <Label>Label</Label>
                  <Input className={cn(org.input, "mt-1.5")} value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} />
                </div>
                <div>
                  <Label>What to find out</Label>
                  <Input className={cn(org.input, "mt-1.5")} value={field.instructions} onChange={(e) => updateField(index, { instructions: e.target.value })} />
                </div>
                <button
                  type="button"
                  className="text-left text-[12px] text-stone-500 hover:text-[#1a1a1a]"
                  onClick={() => setResearch({ fields: research.fields.filter((_, i) => i !== index) })}
                >
                  Remove field
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className={org.btnOutline}
              onClick={() =>
                setResearch({
                  fields: [...research.fields, { key: "", label: "", field_type: "string", instructions: "" }],
                })
              }
            >
              Add research field
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className={org.btnPrimary}
                disabled={busy !== ""}
                onClick={() =>
                  void run("save", () =>
                    service.saveSalesProfile({
                      organisation_id: organisationId,
                      knowledge,
                      lead_research: research,
                      strategy,
                    }),
                  )
                }
              >
                {busy === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
              {status === "pending_review" ? (
                <Button
                  type="button"
                  variant="outline"
                  className={org.btnOutline}
                  disabled={busy !== ""}
                  onClick={() => void run("approve", () => service.approveSalesProfile(organisationId))}
                >
                  Approve for leads
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );

  function updateField(index: number, patch: Partial<OrganisationLeadResearchField>) {
    setResearch({
      fields: research.fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    });
  }
}
