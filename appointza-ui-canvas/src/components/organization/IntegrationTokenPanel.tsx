import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Copy, Link2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { IntegrationService } from "@/services/integration.service";
import type { IntegrationTokenUrlsRes } from "@/models/integration.model";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

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

type IntegrationTokenPanelProps = {
  headerClass?: string;
  contentClass?: string;
  titleClass?: string;
  descClass?: string;
  iconWrapClass?: string;
  embedded?: boolean;
};

export default function IntegrationTokenPanel({
  headerClass = "space-y-1.5 p-5 md:p-6",
  contentClass = "p-5 pt-0 md:p-6 md:pt-0",
  titleClass = "text-lg font-semibold leading-snug text-appointza-navy md:text-xl",
  descClass = "text-sm text-stone-500",
  iconWrapClass = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#E85D4C]",
  embedded = false,
}: IntegrationTokenPanelProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [urls, setUrls] = useState<IntegrationTokenUrlsRes | null>(null);

  const integrationService = useMemo(() => new IntegrationService(), []);

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

  const handleGenerate = useCallback(
    async (regenerate = false) => {
      setIsGenerating(true);
      try {
        const result = await integrationService.generateToken(regenerate);
        setUrls(result);
        toast({
          title: regenerate ? "New token created" : "Integration URLs ready",
          description: "Copy the URLs below for your external app.",
        });
      } catch (error) {
        console.error("Failed to generate integration token", error);
        toast({
          title: "Could not create token",
          description: "Try again while signed in with an organisation account.",
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [integrationService, toast],
  );

  const body = (
    <>
      <div className={cn(contentClass, "space-y-4 pb-6 md:pb-8")}>
        <div className="space-y-3 rounded-2xl border border-[#FFD4CC]/60 bg-[#FFF8F5] p-4 text-sm text-stone-700">
          <div>
            <p className="font-semibold text-appointza-navy">Why this token?</p>
            <p className="mt-1 text-stone-600">
              External apps (CRM, your own website, automation tools) cannot log in as you.
              The token proves they are allowed to read <strong>your organisation&apos;s</strong>{" "}
              leads and customers from Appointza — without sharing your password.
            </p>
          </div>
          <div>
            <p className="font-semibold text-appointza-navy">Where to use it</p>
            <ul className="mt-1 list-inside list-disc space-y-1 text-stone-600">
              <li>Paste a URL into Postman, Zapier, or your backend server</li>
              <li>CRM or lead app at another port (e.g. localhost:8080)</li>
              <li>Any app that needs organisation ID, leads, or customers from Appointza</li>
            </ul>
          </div>
          <p className="text-xs text-stone-500">
            Keep the token private. Anyone with the URL can read your leads and customers.
            Use <strong>Regenerate token</strong> if it was shared by mistake.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-white p-4 text-sm text-stone-600">
          <p className="font-medium text-appointza-navy">What each URL returns</p>
          <dl className="mt-2 space-y-2">
            <div>
              <dt className="font-medium text-stone-700">Context URL</dt>
              <dd>Organisation ID, user ID, names — use first to connect your app.</dd>
            </div>
            <div>
              <dt className="font-medium text-stone-700">Data URL</dt>
              <dd>
                Contact form leads (enquiries) + appointment customers for your organisation.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-stone-700">Export URL</dt>
              <dd>Context + leads + customers in one response.</dd>
            </div>
          </dl>
        </div>

        {!urls ? (
          <Button
            type="button"
            onClick={() => void handleGenerate(false)}
            disabled={isGenerating}
            className={cn(org.btnPrimary, "min-h-11 w-full touch-manipulation sm:w-auto")}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Generate integration token
          </Button>
        ) : null}

        {urls ? (
          <div className="space-y-4 rounded-2xl border border-stone-100 bg-stone-50/80 p-4">
            <div className="text-sm text-stone-700">
              <p>
                <span className="font-medium">Organisation ID:</span>{" "}
                {urls.context.organisation_id}
              </p>
              <p>
                <span className="font-medium">User ID:</span> {urls.context.userid}
              </p>
            </div>
            <CopyUrlRow
              label="Context URL (organisation_id + userid)"
              value={urls.context_url}
              onCopy={copyToClipboard}
            />
            <CopyUrlRow
              label="Data URL (leads + customers)"
              value={urls.data_url}
              onCopy={copyToClipboard}
            />
            <CopyUrlRow
              label="Export URL (everything in one call)"
              value={urls.export_url}
              onCopy={copyToClipboard}
            />
            <Button
              type="button"
              variant="outline"
              className={cn(org.btnOutline, "w-full min-h-10")}
              disabled={isGenerating}
              onClick={() => void handleGenerate(true)}
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Regenerate token
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="border-t border-stone-100">
        <button
          type="button"
          className={cn(headerClass, "flex w-full items-center justify-between gap-3 text-left")}
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
        >
          <CardTitle className={`flex items-center gap-3 ${titleClass}`}>
            <span className={iconWrapClass}>
              <Link2 className="h-5 w-5" />
            </span>
            <span>Integration API</span>
          </CardTitle>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-stone-400 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>
        {isOpen ? (
          <>
            <CardDescription className={cn(descClass, contentClass, "pb-4 pt-0 md:pb-4")}>
              Secure key for external apps to read your leads and customers from Appointza
            </CardDescription>
            {body}
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn(org.card, "overflow-hidden rounded-3xl")}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-5 text-left md:p-6"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <CardTitle className={`flex items-center gap-3 ${titleClass}`}>
          <span className={iconWrapClass}>
            <Link2 className="h-5 w-5" />
          </span>
          <span>Integration API</span>
        </CardTitle>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-stone-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen ? (
        <>
          <CardDescription className={cn(descClass, "px-5 pb-4 md:px-6")}>
            Secure key for external apps to read your leads and customers from Appointza
          </CardDescription>
          {body}
        </>
      ) : null}
    </div>
  );
}
