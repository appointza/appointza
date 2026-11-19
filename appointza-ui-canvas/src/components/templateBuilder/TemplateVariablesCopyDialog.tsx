import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildAiBlockTemplatePrompt,
  buildAiTemplatePrompt,
  type TemplateBusinessContext,
} from "@/utils/templateVariablesGuide.util";
import { cn } from "@/lib/utils";
import { OrganisationService } from "@/services/organisation.service";
import { OrganisationSelectReq } from "@/models/organisation.model";
import type { TemplateBuilderPage } from "@/types/templateBuilder.types";
import {
  AI_SITE_CHIPS,
  type AiSiteChip,
  applyChipToPage,
  clonePageSnapshot,
  generateSitePageFromDescription,
} from "@/utils/templateBuilder/aiSiteGenerator";
import { generateTemplateHtml } from "@/utils/templateBuilder/html";

type PromptMode = "html" | "blocks";

export default function TemplateVariablesCopyDialog({
  triggerClassName,
  triggerLabel = "Describe your website",
  locationId,
  locationName,
  onUseDesign,
}: {
  triggerClassName?: string;
  triggerLabel?: string;
  locationId?: number;
  locationName?: string;
  /** Called when the owner accepts a generated design — nothing goes live until they Save. */
  onUseDesign?: (page: TemplateBuilderPage) => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [promptMode, setPromptMode] = useState<PromptMode>("blocks");
  const [organisationLogoId, setOrganisationLogoId] = useState(0);
  const [organisationName, setOrganisationName] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChips, setSelectedChips] = useState<AiSiteChip[]>([]);
  const [draftPage, setDraftPage] = useState<TemplateBuilderPage | null>(null);
  const [history, setHistory] = useState<TemplateBuilderPage[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!open || !user?.organisationid) {
      return;
    }
    let cancelled = false;
    const loadOrganisation = async () => {
      try {
        const orgService = new OrganisationService();
        const req = new OrganisationSelectReq();
        req.id = user.organisationid;
        const response = await orgService.select(req);
        if (!cancelled) {
          setOrganisationLogoId(response?.[0]?.organisationlogo ?? 0);
          setOrganisationName(response?.[0]?.name ?? "");
        }
      } catch {
        if (!cancelled) {
          setOrganisationLogoId(0);
          setOrganisationName("");
        }
      }
    };
    void loadOrganisation();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const businessContext = useMemo<TemplateBusinessContext>(
    () => ({
      organisationId: user?.organisationid ?? 0,
      organisationName,
      organisationLogoId,
      locationId: locationId ?? user?.locationid ?? 0,
      locationName: locationName ?? "",
      userEmail: user?.email,
      theme,
      siteFor: description,
    }),
    [user, organisationName, organisationLogoId, locationId, locationName, theme, description],
  );

  const aiPromptText = useMemo(
    () =>
      promptMode === "blocks"
        ? buildAiBlockTemplatePrompt(businessContext)
        : buildAiTemplatePrompt(businessContext),
    [businessContext, promptMode],
  );

  const previewHtml = useMemo(() => {
    if (!draftPage) return "";
    return generateTemplateHtml(draftPage, draftPage.name || "Preview");
  }, [draftPage]);

  const pushHistory = useCallback((page: TemplateBuilderPage) => {
    setHistory((prev) => [clonePageSnapshot(page), ...prev].slice(0, 8));
  }, []);

  const handleGenerate = useCallback(() => {
    if (!description.trim() && selectedChips.length === 0) {
      toast({
        title: "Add a description",
        description: "Describe your website or pick a starter chip.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    try {
      if (draftPage) pushHistory(draftPage);
      const page = generateSitePageFromDescription(description, selectedChips, {
        organisationName,
        theme,
      });
      setDraftPage(page);
      toast({
        title: "Design ready",
        description: "Preview on the right. Use this design when you like it — nothing is live yet.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [description, selectedChips, draftPage, pushHistory, organisationName, theme, toast]);

  const handleChip = useCallback(
    (chip: AiSiteChip) => {
      setSelectedChips((prev) =>
        prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
      );
      if (draftPage) {
        pushHistory(draftPage);
        setDraftPage(applyChipToPage(draftPage, chip));
      }
    },
    [draftPage, pushHistory],
  );

  const handleUseDesign = useCallback(() => {
    if (!draftPage) return;
    onUseDesign?.(clonePageSnapshot(draftPage));
    toast({
      title: "Design applied",
      description: "Review the preview, then Save to publish.",
    });
    setOpen(false);
  }, [draftPage, onUseDesign, toast]);

  const handleRestore = useCallback(
    (index: number) => {
      const snapshot = history[index];
      if (!snapshot) return;
      if (draftPage) pushHistory(draftPage);
      setDraftPage(clonePageSnapshot(snapshot));
      setHistory((prev) => prev.filter((_, i) => i !== index));
    },
    [history, draftPage, pushHistory],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(aiPromptText);
      toast({
        title: "Copied",
        description:
          promptMode === "blocks"
            ? "Blocks AI prompt copied — paste into ChatGPT/Claude, then paste the JSON into Advanced."
            : "HTML AI prompt copied — paste into ChatGPT/Claude, then paste the HTML into Advanced.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  }, [aiPromptText, promptMode, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-9 gap-1.5", triggerClassName)}
        >
          <Sparkles className="h-4 w-4 text-orange-600" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-5xl min-w-0 flex-col gap-3 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="min-w-0 shrink-0 pr-8 text-left">
          <DialogTitle className="text-xl leading-tight text-appointza-navy sm:text-2xl">
            Describe your website
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed sm:text-base">
            Generate a draft with live services, hours, and booking buttons. Nothing goes live until
            you click Use this design and Save.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-2">
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
            <div className="space-y-1.5">
              <Label htmlFor="ai-site-desc" className="text-sm text-stone-700">
                What should the site say?
              </Label>
              <Textarea
                id="ai-site-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Warm spa for weekend pampering · family resort with rooms · clinic with clear pricing"
                rows={4}
                className="rounded-xl border-stone-200 bg-white text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-site-theme" className="text-sm text-stone-700">
                Theme / colours (optional)
              </Label>
              <Input
                id="ai-site-theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. soft coral spa, modern clinic blues"
                className="h-10 rounded-xl border-stone-200 bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {AI_SITE_CHIPS.map((chip) => {
                const active = selectedChips.includes(chip.id);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleChip(chip.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      active
                        ? "border-orange-300 bg-orange-50 text-orange-800"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="min-h-11 flex-1 bg-orange-600 text-white hover:bg-orange-700"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating…" : draftPage ? "Try again" : "Generate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 flex-1"
                disabled={!draftPage}
                onClick={handleUseDesign}
              >
                Use this design
              </Button>
            </div>
            {history.length > 0 ? (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Version history
                </p>
                <div className="space-y-1.5">
                  {history.map((item, index) => (
                    <button
                      key={`${item.id}-${index}`}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-sm hover:bg-stone-50"
                      onClick={() => handleRestore(index)}
                    >
                      <span className="truncate">{item.name || `Version ${history.length - index}`}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              className="text-left text-xs font-semibold text-stone-500 underline-offset-2 hover:underline"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "Hide advanced (HTML / external AI)" : "Advanced (HTML / external AI)"}
            </button>

            {showAdvanced ? (
              <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/80 p-3">
                <div className="flex shrink-0 gap-1 rounded-lg border border-stone-200 bg-stone-100 p-1">
                  {(
                    [
                      { id: "html" as const, label: "HTML AI" },
                      { id: "blocks" as const, label: "Blocks AI" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPromptMode(tab.id)}
                      className={cn(
                        "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition",
                        promptMode === tab.id
                          ? "bg-white text-appointza-navy shadow-sm"
                          : "text-stone-500 hover:text-stone-800",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 font-mono text-[11px] text-stone-700">
                  {aiPromptText}
                </pre>
                <Button type="button" variant="outline" className="w-full" onClick={() => void handleCopy()}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy external AI prompt
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex min-h-[40vh] flex-col overflow-hidden rounded-xl border border-stone-200 bg-white lg:min-h-0">
            <div className="border-b border-stone-100 px-3 py-2 text-sm font-semibold text-appointza-navy">
              Preview
            </div>
            {previewHtml ? (
              <iframe
                title="AI design preview"
                srcDoc={previewHtml}
                className="min-h-0 flex-1 w-full border-0 bg-white"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-stone-500">
                Generate a design to see a side-by-side preview here.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
