import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Code2,
  Database,
  Eye,
  Layers,
  Loader2,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import {
  organizationTemplatesRoute,
  onboardingStepRoute,
} from "@/utils/organizationOnboarding.util";
import { OnboardingPageGuide } from "@/components/onboarding/OrganizationOnboarding";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { SiteDetailsService } from "@/services/siteDetails.service";
import { EventService } from "@/services/event.service";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { SiteDetailsItem } from "@/models/sitedetail.model";
import {
  OrganisationLocation,
  OrganisationLocationSelectReq,
  UpdateLocationTemplateIdReq,
} from "@/models/organisationlocation.model";
import TemplateVariablesCopyDialog from "@/components/templateBuilder/TemplateVariablesCopyDialog";
import LocationTemplateMediaDialog from "@/components/templateBuilder/LocationTemplateMediaDialog";
import { HeroBlockPalette } from "@/components/templateBuilder/HeroBlockPalette";
import { TemplateBuilderStructurePanel } from "@/components/templateBuilder/TemplateBuilderStructurePanel";
import { TemplateBuilderBlockEditor } from "@/components/templateBuilder/TemplateBuilderBlockEditor";
import { OrgAssetPanel } from "@/components/templateBuilder/OrgAssetPanel";
import { ORG_TEMPLATE_ASSETS_IDENTIFIER } from "@/types/orgAssets.types";
import type { TemplateBuilderProject } from "@/types/templateBuilder.types";
import { TEMPLATE_BUILDER_CATEGORIES } from "@/utils/templateBuilder/catalog";
import { createBlock } from "@/utils/templateBuilder/defaults";
import { generateTemplateHtml } from "@/utils/templateBuilder/html";
import { collectImageIdsFromProject } from "@/utils/templateBuilder/orgAssetsStorage";
import {
  createDefaultProject,
  parseBuilderProject,
  serializeBuilderProject,
} from "@/utils/templateBuilder/storage";
import { renderSiteTemplateHtml } from "@/utils/templateRenderer.util";
import { cn } from "@/lib/utils";

const TEMPLATE_REFERENCE_TYPE_ID = 5;
const HOME_PAGE_ID = "home";

type BuilderMode = "blocks" | "html";
type LeftTab = "blocks" | "assets";
type RightTab = "sections" | "settings";

function notesHasBlocksProject(notes: string | null | undefined): boolean {
  if (!notes?.trim()) return false;
  try {
    const parsed = JSON.parse(notes) as { builderVersion?: number; pages?: unknown };
    return parsed?.builderVersion === 2 && !!parsed.pages;
  } catch {
    return false;
  }
}

function TemplateBuilderInner() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    isComplete,
    hasCustomDomain,
    hasServices,
    hasWebsite,
    hasTiming,
    nextStep,
  } = useOnboardingStatus();
  const navigate = useNavigate();
  const templatesBackRoute = organizationTemplatesRoute(isComplete);
  const inOnboarding = !isComplete && hasCustomDomain && hasServices;
  const [searchParams] = useSearchParams();
  const { registerFileIds } = useOrgTemplateAssets();

  const refService = useMemo(() => new ReferenceValueService(), []);
  const siteService = useMemo(() => new SiteDetailsService(), []);
  const eventService = useMemo(() => new EventService(), []);
  const locationService = useMemo(() => new OrganisationLocationService(), []);

  const [templateName, setTemplateName] = useState("");
  const [templateId, setTemplateId] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [builderMode, setBuilderMode] = useState<BuilderMode>("blocks");
  const [project, setProject] = useState<TemplateBuilderProject>(() => createDefaultProject());
  const [html, setHtml] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [savedTemplates, setSavedTemplates] = useState<ReferenceValue[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locations, setLocations] = useState<OrganisationLocation[]>([]);
  const [previewLocationId, setPreviewLocationId] = useState(0);
  const [previewSiteData, setPreviewSiteData] = useState<SiteDetailsItem | null>(null);
  const [previewEvents, setPreviewEvents] = useState<unknown[]>([]);
  const [isLoadingPreviewData, setIsLoadingPreviewData] = useState(false);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [jsonDraft, setJsonDraft] = useState("{}");
  const [leftTab, setLeftTab] = useState<LeftTab>("blocks");
  const [rightTab, setRightTab] = useState<RightTab>("sections");
  /** Keep blocks JSON on save once the user works in Blocks mode or loads a blocks project. */
  const [persistBlocks, setPersistBlocks] = useState(true);

  const organisationId = user?.organisationid ?? 0;
  const userLocationId = user?.organisationlocationid ?? user?.locationid ?? 0;
  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === previewLocationId) ?? null,
    [locations, previewLocationId],
  );

  const homePage = project.pages[HOME_PAGE_ID] ?? createDefaultProject().pages[HOME_PAGE_ID];
  const blocks = homePage.blocks;
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;

  const setBlocks = useCallback(
    (updater: (prev: typeof blocks) => typeof blocks) => {
      setProject((prev) => {
        const page = prev.pages[HOME_PAGE_ID] ?? createDefaultProject().pages[HOME_PAGE_ID];
        return {
          ...prev,
          pages: {
            ...prev.pages,
            [HOME_PAGE_ID]: { ...page, blocks: updater(page.blocks) },
          },
        };
      });
    },
    [],
  );

  const blocksHtml = useMemo(
    () => generateTemplateHtml(homePage, templateName || homePage.name || "Booking page"),
    [homePage, templateName],
  );

  const sourceHtml = builderMode === "blocks" ? blocksHtml : html;

  const previewHtml = useMemo(() => {
    if (!sourceHtml.trim()) return "";
    if (!previewSiteData) {
      return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;color:#57534e"><p>Loading preview data…</p></body></html>`;
    }
    return renderSiteTemplateHtml(sourceHtml, {
      ...previewSiteData,
      events: previewEvents,
    } as SiteDetailsItem);
  }, [sourceHtml, previewSiteData, previewEvents]);

  useEffect(() => {
    if (selectedBlock) {
      setJsonDraft(JSON.stringify(selectedBlock.data, null, 2));
    }
  }, [selectedBlock?.id, selectedBlock?.data]);

  const fetchLocations = useCallback(async () => {
    if (!user) return;
    try {
      const req = new OrganisationLocationSelectReq();
      if (user.organisationid && user.organisationid > 0) {
        req.organisationid = user.organisationid;
      } else if (user.locationid && user.locationid > 0) {
        req.organisationlocationid = user.locationid;
      } else {
        return;
      }

      const response = await locationService.select(req);
      if (!response?.length) {
        setLocations([]);
        return;
      }

      setLocations(response);
      const preferred =
        (userLocationId > 0 && response.some((loc) => loc.id === userLocationId)
          ? userLocationId
          : response[0].id) ?? 0;
      setPreviewLocationId((current) =>
        current > 0 && response.some((loc) => loc.id === current) ? current : preferred,
      );
    } catch {
      toast({ title: "Could not load locations for preview", variant: "destructive" });
    }
  }, [locationService, toast, user, userLocationId]);

  const fetchPreviewData = useCallback(async () => {
    if (previewLocationId <= 0) {
      setPreviewSiteData(null);
      setPreviewEvents([]);
      return;
    }

    setIsLoadingPreviewData(true);
    try {
      const siteResponse = await siteService.select(previewLocationId);
      const siteData = siteResponse?.[0] ?? null;
      setPreviewSiteData(siteData);

      if (!siteData) {
        setPreviewEvents([]);
        return;
      }

      try {
        const eventsResponse = await eventService.select({
          id: 0,
          organisation_id: siteData.organisationdetail?.id || 0,
          organisation_location_id: siteData.locationdetail?.id || 0,
          status: "",
          is_public: true,
        });
        setPreviewEvents(
          (eventsResponse || []).filter(
            (event: { is_public?: boolean }) => event?.is_public === true,
          ),
        );
      } catch {
        setPreviewEvents([]);
      }
    } catch {
      setPreviewSiteData(null);
      setPreviewEvents([]);
      toast({ title: "Could not load preview data", variant: "destructive" });
    } finally {
      setIsLoadingPreviewData(false);
    }
  }, [eventService, previewLocationId, siteService, toast]);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    void fetchPreviewData();
  }, [fetchPreviewData]);

  const fetchSavedTemplates = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = TEMPLATE_REFERENCE_TYPE_ID;
      req.organisationid = organisationId;
      const resp = await refService.select(req);
      setSavedTemplates((resp ?? []).filter((t) => t.identifier !== ORG_TEMPLATE_ASSETS_IDENTIFIER));
    } catch {
      toast({ title: "Could not load templates", variant: "destructive" });
    } finally {
      setIsLoadingList(false);
    }
  }, [refService, toast, organisationId]);

  useEffect(() => {
    void fetchSavedTemplates();
  }, [fetchSavedTemplates]);

  const loadTemplate = useCallback(
    (id: string) => {
      const row = savedTemplates.find((t) => String(t.id) === id);
      if (!row) return;
      setTemplateId(row.id);
      setTemplateName(row.displaytext || "");
      setIsActive(!!row.isactive);
      setHtml(row.description || "");
      setSelectedBlockId(null);

      if (notesHasBlocksProject(row.notes)) {
        setProject(parseBuilderProject(row.notes));
        setBuilderMode("blocks");
        setPersistBlocks(true);
      } else {
        setProject(createDefaultProject());
        setBuilderMode("html");
        setPersistBlocks(false);
        if (!row.description?.trim()) {
          toast({
            title: "Empty template",
            description: "Add blocks or paste HTML to build this page.",
          });
        }
      }
    },
    [savedTemplates, toast],
  );

  useEffect(() => {
    const locId = Number(searchParams.get("locationId") || 0);
    if (locId > 0 && locations.some((loc) => loc.id === locId)) {
      setPreviewLocationId(locId);
    }
  }, [searchParams, locations]);

  useEffect(() => {
    const qp = Number(searchParams.get("templateId") || 0);
    if (qp > 0 && savedTemplates.length && !templateId) {
      loadTemplate(String(qp));
    }
  }, [searchParams, savedTemplates, templateId, loadTemplate]);

  const handleNew = () => {
    setTemplateId(0);
    setTemplateName("");
    setHtml("");
    setIsActive(true);
    setProject(createDefaultProject());
    setBuilderMode("blocks");
    setPersistBlocks(true);
    setSelectedBlockId(null);
    setRightTab("sections");
  };

  const switchMode = (mode: BuilderMode) => {
    if (mode === builderMode) return;
    if (mode === "html") {
      setHtml((current) => current.trim() || blocksHtml);
    } else {
      setPersistBlocks(true);
    }
    setBuilderMode(mode);
  };

  const handleAddBlock = (type: string) => {
    const block = createBlock(type);
    setBlocks((prev) => [...prev, block]);
    setSelectedBlockId(block.id);
    setRightTab("settings");
    setPersistBlocks(true);
    toast({ title: "Section added", description: "Edit it in Section settings." });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateBlockData = (id: string, patch: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...patch } } : b)),
    );
  };

  const applyJsonDraft = () => {
    if (!selectedBlock) return;
    try {
      const parsed = JSON.parse(jsonDraft) as Record<string, unknown>;
      updateBlockData(selectedBlock.id, parsed);
      toast({ title: "Block data updated" });
    } catch {
      toast({ title: "Invalid JSON", variant: "destructive" });
    }
  };

  const applyHtmlEditorContent = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.includes('"builderVersion"')) {
      try {
        const parsed = JSON.parse(trimmed) as {
          builderVersion?: number;
          pages?: Record<string, { name?: string; blocks?: unknown[] }>;
        };
        if (parsed.builderVersion === 2 && parsed.pages) {
          const next = parseBuilderProject(trimmed);
          const home = next.pages.home ?? Object.values(next.pages)[0];
          if (home?.blocks?.length) {
            setProject(next);
            setBuilderMode("blocks");
            setPersistBlocks(true);
            setHtml(generateTemplateHtml(home, templateName || home.name || "Booking page"));
            toast({
              title: "Blocks imported",
              description: "Switched to Blocks mode with the AI project.",
            });
            return;
          }
        }
      } catch {
        /* keep typing */
      }
    }
    setHtml(raw);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({ title: "Add a page name", variant: "destructive" });
      return;
    }

    const effectiveHtml = builderMode === "blocks" ? blocksHtml : html;
    if (!effectiveHtml.trim()) {
      toast({
        title: builderMode === "blocks" ? "Add at least one section" : "Paste HTML from AI",
        variant: "destructive",
      });
      return;
    }

    const wasUpdate = templateId > 0;
    setIsSaving(true);
    try {
      const namedProject: TemplateBuilderProject = {
        ...project,
        pages: {
          ...project.pages,
          [HOME_PAGE_ID]: { ...homePage, name: templateName.trim() || homePage.name },
        },
      };

      const payload = new ReferenceValue();
      payload.id = templateId;
      payload.referencetypeid = TEMPLATE_REFERENCE_TYPE_ID;
      payload.displaytext = templateName.trim();
      payload.identifier = templateName.trim().toLowerCase().replace(/\s+/g, "_");
      payload.description = effectiveHtml;
      payload.notes = persistBlocks
        ? serializeBuilderProject(namedProject)
        : JSON.stringify({ builderVersion: 3, mode: "ai-html" });
      payload.isactive = isActive;
      payload.organizationid = organisationId;

      const saved = await refService.save(payload);
      const savedTemplateId = saved?.id ?? templateId;
      if (savedTemplateId) setTemplateId(savedTemplateId);

      if (persistBlocks) {
        await registerFileIds(collectImageIdsFromProject(namedProject));
        setProject(namedProject);
      }
      setHtml(effectiveHtml);

      let assignedLocationName: string | null = null;
      if (previewLocationId > 0 && savedTemplateId > 0) {
        try {
          const assignReq = new UpdateLocationTemplateIdReq();
          assignReq.organisationlocationid = previewLocationId;
          assignReq.templateid = savedTemplateId;
          const assigned = await locationService.updateLocationTemplateId(assignReq);
          if (assigned) {
            assignedLocationName =
              locations.find((loc) => loc.id === previewLocationId)?.name ||
              locations.find((loc) => loc.id === previewLocationId)?.city ||
              null;
            setLocations((current) =>
              current.map((location) =>
                location.id === previewLocationId
                  ? { ...location, templateid: savedTemplateId }
                  : location,
              ),
            );
          }
        } catch (assignError) {
          console.error("Failed to assign template to location:", assignError);
        }
      }

      toast({
        title: wasUpdate ? "Page updated" : "Page saved",
        description:
          assignedLocationName ?
            `Assigned to ${assignedLocationName}. Your booking page is live for that location.`
          : previewLocationId > 0 ?
            "Page saved, but could not assign it to the selected location. Assign it from Templates in your profile."
          : "Page saved. Select a location in preview, then save again to assign it.",
      });
      await fetchSavedTemplates();

      if (!isComplete && assignedLocationName && previewLocationId > 0) {
        await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
        toast({
          title: "Website ready!",
          description: "Next step: set your business hours so customers can book.",
        });
        window.setTimeout(() => navigate(onboardingStepRoute("timing")), 700);
      }
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openPreviewTab = () => {
    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const previewPanel = (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border border-stone-200 bg-white lg:rounded-xl">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stone-100 bg-stone-50/80 px-3 py-2">
        <p className="text-xs font-medium text-stone-600">
          Preview
          {previewSiteData?.organisationdetail?.name
            ? ` — ${previewSiteData.organisationdetail.name}`
            : ""}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {locations.length > 1 ? (
            <Select
              value={previewLocationId > 0 ? String(previewLocationId) : undefined}
              onValueChange={(value) => setPreviewLocationId(Number(value))}
            >
              <SelectTrigger className="h-7 w-[min(100%,180px)] text-xs">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.name || loc.city || `Location #${loc.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowPreview((v) => !v)}
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            {showPreview ? "Hide" : "Show"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={openPreviewTab}
            disabled={!sourceHtml.trim()}
          >
            Open tab
          </Button>
        </div>
      </div>
      {showPreview ? (
        isLoadingPreviewData ? (
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-stone-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading business data…
          </div>
        ) : sourceHtml.trim() ? (
          <div className="relative min-h-0 flex-1 bg-stone-100">
            <iframe
              title="Page preview"
              srcDoc={previewHtml}
              className="absolute inset-0 h-full w-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-stone-500">
            {builderMode === "blocks"
              ? "Add sections from the left to preview your page."
              : "Paste HTML to see a live preview with your business data."}
          </div>
        )
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-stone-400">
          Preview hidden
        </div>
      )}
    </section>
  );

  const handleBackFromBuilder = () => {
    if (!isComplete && nextStep === "website") {
      navigate(onboardingStepRoute("services"));
      return;
    }
    navigate(templatesBackRoute);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[hsl(var(--app-surface))]">
      {inOnboarding && (
        <div className="shrink-0 border-b border-stone-100 bg-appointza-cream px-3 py-2 sm:px-4">
          <OnboardingPageGuide
            compact
            stepId="website"
            hasCustomDomain={hasCustomDomain}
            hasServices={hasServices}
            hasWebsite={hasWebsite}
            hasTiming={hasTiming}
          />
        </div>
      )}
      <header className="z-30 shrink-0 border-b border-stone-200 bg-white px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleBackFromBuilder}
            aria-label="Back to templates"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-appointza-navy sm:text-base">Page builder</h1>
            <p className="hidden text-xs text-stone-500 sm:block">
              Build with blocks or paste AI HTML — both save as your booking page.
            </p>
          </div>

          <div className="flex shrink-0 items-center rounded-lg border border-stone-200 bg-stone-100 p-0.5">
            {(
              [
                { id: "blocks" as const, label: "Blocks", icon: Layers },
                { id: "html" as const, label: "HTML", icon: Code2 },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchMode(tab.id)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition",
                  builderMode === tab.id
                    ? "bg-white text-appointza-navy shadow-sm"
                    : "text-stone-500 hover:text-stone-800",
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <TemplateVariablesCopyDialog
            triggerClassName="h-8"
            locationId={selectedLocation?.id}
            locationName={selectedLocation?.name}
          />
          <LocationTemplateMediaDialog
            organisationId={organisationId || selectedLocation?.organisationid || 0}
            location={selectedLocation}
            onSaved={(savedLocation) => {
              setLocations((current) =>
                current.map((location) =>
                  location.id === savedLocation.id ? savedLocation : location,
                ),
              );
              setPreviewSiteData((current) =>
                current
                  ? {
                      ...current,
                      locationdetail: {
                        ...current.locationdetail,
                        images: savedLocation.images ?? [],
                        attributes: savedLocation.attributes ?? {},
                      },
                    }
                  : current,
              );
            }}
          />
          <Button variant="outline" size="sm" className="h-8" onClick={handleNew}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            New
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={isSaving}
            size="sm"
            className="h-8 bg-orange-600 hover:bg-orange-700"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save
              </>
            )}
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div>
            <Label htmlFor="page-name" className="text-xs text-stone-500">
              Page name
            </Label>
            <Input
              id="page-name"
              className="mt-0.5 h-8"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Main booking page"
            />
          </div>
          <div>
            <Label className="text-xs text-stone-500">Open saved page</Label>
            <Select value={templateId ? String(templateId) : undefined} onValueChange={loadTemplate}>
              <SelectTrigger className="mt-0.5 h-8">
                <SelectValue placeholder={isLoadingList ? "Loading…" : "Choose page"} />
              </SelectTrigger>
              <SelectContent>
                {savedTemplates.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.displaytext || `#${t.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-1.5 lg:h-8">
            <Label htmlFor="active" className="text-sm whitespace-nowrap">
              Published
            </Label>
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        {selectedLocation ? (
          <p className="mt-2 text-xs text-stone-500">
            Saving assigns this page to{" "}
            <span className="font-medium text-appointza-navy">
              {selectedLocation.name || selectedLocation.city || `location #${selectedLocation.id}`}
            </span>
            .
          </p>
        ) : null}
      </header>

      {builderMode === "html" ? (
        <div
          className={cn(
            "grid min-h-0 flex-1",
            showPreview
              ? "grid-cols-1 grid-rows-[minmax(40vh,1fr)_minmax(40vh,1fr)] lg:grid-cols-2 lg:grid-rows-1"
              : "grid-cols-1",
          )}
        >
          <section className="flex min-h-0 flex-col overflow-hidden border-b border-stone-200 lg:border-b-0 lg:border-r">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stone-100 bg-stone-50/80 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-stone-700">HTML editor</p>
                <p className="text-[11px] text-stone-500">
                  Use <strong>Copy AI prompts</strong> → HTML or Blocks, then paste here.
                </p>
              </div>
            </div>
            <Textarea
              className="min-h-0 flex-1 resize-none rounded-none border-0 font-mono text-xs leading-relaxed focus-visible:ring-0 sm:text-sm"
              value={html}
              onChange={(e) => applyHtmlEditorContent(e.target.value)}
              placeholder={"<!DOCTYPE html>\n<html>\n  <head>...</head>\n  <body>...</body>\n</html>"}
              spellCheck={false}
            />
          </section>
          {showPreview ? (
            <div className="flex min-h-0 flex-col overflow-hidden p-0 lg:p-3">{previewPanel}</div>
          ) : null}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(280px,42vh)_minmax(0,1fr)_minmax(220px,32vh)] lg:grid-rows-1 lg:grid-cols-[220px_minmax(0,1fr)_260px] xl:grid-cols-[240px_minmax(0,1fr)_280px]">
          {/* Left: palette */}
          <aside className="flex min-h-0 flex-col overflow-hidden border-b border-stone-200 bg-white lg:border-b-0 lg:border-r">
            <div className="flex shrink-0 gap-1 border-b border-stone-100 p-2">
              {(
                [
                  { id: "blocks" as const, label: "Add sections", icon: Plus },
                  { id: "assets" as const, label: "Images", icon: Database },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLeftTab(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition",
                    leftTab === tab.id
                      ? "bg-orange-50 text-orange-700"
                      : "text-stone-500 hover:bg-stone-50",
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {leftTab === "assets" ? (
                <OrgAssetPanel />
              ) : (
                <div className="space-y-5">
                  {TEMPLATE_BUILDER_CATEGORIES.map((cat) => (
                    <div key={cat.name}>
                      {cat.name === "Hero / Banner" ? (
                        <HeroBlockPalette blocks={cat.blocks} onAdd={handleAddBlock} />
                      ) : (
                        <>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                            {cat.name}
                          </p>
                          <div className="space-y-1.5">
                            {cat.blocks.map((bt) => (
                              <button
                                key={bt.type}
                                type="button"
                                onClick={() => handleAddBlock(bt.type)}
                                className="flex w-full items-start gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-2 text-left transition hover:border-orange-300 hover:bg-orange-50/40"
                              >
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                                  <Plus className="h-3.5 w-3.5" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-appointza-navy">
                                    {bt.name}
                                  </span>
                                  <span className="block text-[11px] text-stone-500">
                                    {bt.description}
                                  </span>
                                  {bt.mode === "appointza" ? (
                                    <span className="mt-1 inline-flex rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                      Live data
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Center: preview — takes remaining height */}
          <div className="flex min-h-0 flex-col overflow-hidden p-0 lg:p-3">{previewPanel}</div>

          {/* Right: structure / settings */}
          <aside className="flex min-h-0 flex-col overflow-hidden border-t border-stone-200 bg-white lg:border-t-0 lg:border-l">
            <div className="flex shrink-0 gap-1 border-b border-stone-100 p-2">
              {(
                [
                  { id: "sections" as const, label: "Page order" },
                  { id: "settings" as const, label: "Section settings" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightTab(tab.id)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition",
                    rightTab === tab.id
                      ? "bg-orange-50 text-orange-700"
                      : "text-stone-500 hover:bg-stone-50",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {rightTab === "sections" ? (
                <TemplateBuilderStructurePanel
                  blocks={blocks}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={(id) => {
                    setSelectedBlockId(id);
                    setRightTab("settings");
                  }}
                  onToggleVisible={(id, visible) =>
                    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, visible } : b)))
                  }
                  onMove={moveBlock}
                  onDelete={(id) => {
                    setBlocks((prev) => prev.filter((b) => b.id !== id));
                    if (selectedBlockId === id) setSelectedBlockId(null);
                  }}
                  onEditBlock={(id) => {
                    setSelectedBlockId(id);
                    setRightTab("settings");
                  }}
                />
              ) : selectedBlock ? (
                <TemplateBuilderBlockEditor
                  block={selectedBlock}
                  jsonDraft={jsonDraft}
                  onJsonDraftChange={setJsonDraft}
                  onUpdate={(patch) => updateBlockData(selectedBlock.id, patch)}
                  onApplyJson={applyJsonDraft}
                  onResetJson={() => setJsonDraft(JSON.stringify(selectedBlock.data, null, 2))}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-10 text-center">
                  <p className="text-sm font-medium text-stone-700">No section selected</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Add a section on the left, or pick one from Page order.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default TemplateBuilderInner;
