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
import { buildStayHtmlPrompt } from "./stayHtmlPrompt";

export function StayHtmlPromptDialog({ propertyName }: { propertyName: string }) {
  const [copied, setCopied] = useState(false);
  const prompt = useMemo(() => buildStayHtmlPrompt(propertyName), [propertyName]);

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4 text-indigo-600" />
          HTML AI
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-3xl min-w-0 flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>AppointzaStay HTML AI</DialogTitle>
          <DialogDescription>
            Copy this prompt into an AI tool, then paste its HTML into the editor.
          </DialogDescription>
        </DialogHeader>
        <pre className="min-h-0 min-w-0 flex-1 whitespace-pre-wrap break-words overflow-y-auto rounded-lg border bg-slate-50 p-4 text-xs leading-relaxed">
          {prompt}
        </pre>
        <Button type="button" onClick={() => void copy()}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy full prompt"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
