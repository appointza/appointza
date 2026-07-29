import { Code2, Eye, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StayHtmlPromptDialog } from "./StayHtmlPromptDialog";
import { CustomHtmlFrame } from "./CustomHtmlFrame";

type HtmlTemplateEditorProps = {
  propertyName: string;
  html: string;
  renderedHtml: string;
  previewing: boolean;
  onChange: (html: string) => void;
  onResetDefault?: () => void;
};

export function HtmlTemplateEditor({
  propertyName,
  html,
  renderedHtml,
  previewing,
  onChange,
  onResetDefault,
}: HtmlTemplateEditorProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f3f4f6]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Code2 className="h-4 w-4 text-indigo-600" />
            Custom HTML template
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Scripts and unsafe event attributes are removed; published HTML runs in a sandbox.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onResetDefault ? (
            <Button type="button" variant="outline" size="sm" onClick={onResetDefault}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Restore default
            </Button>
          ) : null}
          <StayHtmlPromptDialog propertyName={propertyName} />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
        <section className="flex min-h-0 flex-col border-b bg-white lg:border-b-0 lg:border-r">
          <div className="flex h-10 shrink-0 items-center border-b px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            HTML editor
          </div>
          <Textarea
            value={html}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none rounded-none border-0 p-4 font-mono text-xs leading-relaxed focus-visible:ring-0"
            placeholder="<!doctype html>&#10;<html>&#10;<head><style>...</style></head>&#10;<body>...</body>&#10;</html>"
          />
        </section>

        <section className="flex min-h-0 flex-col bg-[#e5e7eb]">
          <div className="flex h-10 shrink-0 items-center justify-between border-b bg-white px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Live data preview
            </span>
            {previewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <div className="mx-auto h-full min-h-[320px] max-w-[1440px] overflow-hidden border bg-white shadow-xl lg:min-h-[480px]">
              {renderedHtml ? (
                <CustomHtmlFrame
                  html={renderedHtml}
                  title={`${propertyName} HTML preview`}
                  className="h-full min-h-[320px] lg:min-h-[480px]"
                />
              ) : (
                <div className="flex h-full min-h-[500px] items-center justify-center px-6 text-center text-sm text-slate-500">
                  Paste a complete HTML document to preview it with live organisation data.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
