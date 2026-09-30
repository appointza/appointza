import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Sparkles } from "lucide-react";
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

type PromptMode = "html" | "blocks";

export default function TemplateVariablesCopyDialog({
  triggerClassName,
  triggerLabel = "Ask AI for help",
  locationId,
  locationName,
}: {
  triggerClassName?: string;
  triggerLabel?: string;
  locationId?: number;
  locationName?: string;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [promptMode, setPromptMode] = useState<PromptMode>("html");
  const [organisationLogoId, setOrganisationLogoId] = useState(0);
  const [organisationName, setOrganisationName] = useState("");
  const [theme, setTheme] = useState("");
  const [siteFor, setSiteFor] = useState("");

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
      siteFor,
    }),
    [user, organisationName, organisationLogoId, locationId, locationName, theme, siteFor],
  );

  const aiPromptText = useMemo(
    () =>
      promptMode === "blocks"
        ? buildAiBlockTemplatePrompt(businessContext)
        : buildAiTemplatePrompt(businessContext),
    [businessContext, promptMode],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(aiPromptText);
      toast({
        title: "Copied",
        description:
          promptMode === "blocks"
            ? "Blocks AI prompt copied — paste into ChatGPT/Claude, then paste the JSON into the editor."
            : "HTML AI prompt copied — paste into ChatGPT/Claude, then paste the HTML into the editor.",
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
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-3xl min-w-0 flex-col gap-3 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="min-w-0 shrink-0 pr-8 text-left">
          <DialogTitle className="text-xl leading-tight text-appointza-navy sm:text-2xl">
            Ask AI to write this page
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed sm:text-base">
            Copy a ready-made question for ChatGPT or Claude. Paste the answer into this app, then tap Save.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 gap-1 rounded-lg border border-stone-200 bg-stone-100 p-1">
          {(
            [
              { id: "html" as const, label: "HTML AI", hint: "Returns full HTML" },
              { id: "blocks" as const, label: "Blocks AI", hint: "Returns page JSON" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPromptMode(tab.id)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-left transition",
                promptMode === tab.id
                  ? "bg-white shadow-sm text-appointza-navy"
                  : "text-stone-500 hover:text-stone-800",
              )}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className="block text-[11px] text-stone-500">{tab.hint}</span>
            </button>
          ))}
        </div>

        <div className="shrink-0 space-y-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">
            Design briefing (added at the end of the prompt)
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="ai-prompt-theme" className="text-sm text-stone-700">
              Theme / visual style
            </Label>
            <Input
              id="ai-prompt-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. warm spa, modern clinic, luxury resort, bold gym"
              className="h-10 rounded-xl border-stone-200 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-prompt-site-for" className="text-sm text-stone-700">
              Who this site is for
            </Label>
            <Textarea
              id="ai-prompt-site-for"
              value={siteFor}
              onChange={(e) => setSiteFor(e.target.value)}
              placeholder="e.g. women booking salon appointments · families booking resort stays · athletes booking coaching"
              rows={2}
              className="rounded-xl border-stone-200 bg-white text-sm"
            />
          </div>
        </div>

        <p className="shrink-0 text-xs text-stone-500">
          {promptMode === "html"
            ? "Paste the returned HTML into the editor and Save."
            : "Paste the returned JSON into the editor — it will convert to HTML automatically."}
        </p>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-stone-200 bg-stone-50/80 p-2 sm:p-3">
          <pre className="min-h-0 min-w-0 flex-1 whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden rounded-lg bg-white p-3 font-mono text-[11px] leading-relaxed text-stone-700 sm:text-xs">
            {aiPromptText}
          </pre>
          <Button
            type="button"
            className="mt-3 min-h-11 w-full shrink-0 bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => void handleCopy()}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy {promptMode === "blocks" ? "Blocks" : "HTML"} AI prompt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
