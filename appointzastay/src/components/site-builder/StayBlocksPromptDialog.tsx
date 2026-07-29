import { useMemo, useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { buildStayBlocksPrompt } from "./stayBlocksPrompt";
import { normalizePageBlocks } from "./normalizePageBlock";
import type { PageBlock } from "./types";

type StayBlocksPromptDialogProps = {
  propertyName: string;
  onApplyBlocks: (blocks: PageBlock[]) => void;
};

export function StayBlocksPromptDialog({ propertyName, onApplyBlocks }: StayBlocksPromptDialogProps) {
  const [copied, setCopied] = useState(false);
  const [paste, setPaste] = useState("");
  const [error, setError] = useState("");
  const prompt = useMemo(() => buildStayBlocksPrompt(propertyName), [propertyName]);

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const apply = () => {
    setError("");
    try {
      const parsed = JSON.parse(paste.trim()) as unknown;
      if (!Array.isArray(parsed)) {
        setError("Paste a JSON array of blocks.");
        return;
      }
      const blocks = normalizePageBlocks(parsed);
      if (!blocks.length) {
        setError("No valid blocks found in the JSON.");
        return;
      }
      onApplyBlocks(blocks);
      setPaste("");
    } catch {
      setError("Invalid JSON. Copy the AI prompt, generate JSON, then paste it here.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8">
          <Sparkles className="mr-2 h-4 w-4 text-indigo-600" />
          Blocks AI
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-3xl min-w-0 flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>AppointzaStay Blocks AI</DialogTitle>
          <DialogDescription>
            Copy the prompt into an AI tool, then paste the returned blocks JSON below to replace the page.
          </DialogDescription>
        </DialogHeader>

        <pre className="min-h-0 max-h-48 min-w-0 flex-1 whitespace-pre-wrap break-words overflow-y-auto rounded-lg border bg-slate-50 p-4 text-xs leading-relaxed">
          {prompt}
        </pre>
        <Button type="button" variant="secondary" onClick={() => void copy()}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy Blocks AI prompt"}
        </Button>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Paste AI JSON</p>
          <Textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            className="min-h-28 font-mono text-xs"
            placeholder='[{"id":"...","type":"hotel-hero","props":{...},"layout":{...}}]'
            spellCheck={false}
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <Button type="button" onClick={apply} disabled={!paste.trim()}>
            Apply blocks to canvas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
