import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 1990) return "-";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-[#1a1a1a]">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-[#5b6572]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Pill({ tone, children }: { tone: "green" | "red" | "amber" | "gray" | "blue"; children: ReactNode }) {
  const tones = {
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
    gray: "bg-slate-100 text-slate-700",
    blue: "bg-blue-100 text-blue-800",
  } as const;
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", tones[tone])}>{children}</span>;
}

export function OrgStatusPill({ isactive, issuspended }: { isactive?: boolean; issuspended?: boolean }) {
  if (issuspended) return <Pill tone="red">Suspended</Pill>;
  if (isactive === false) return <Pill tone="gray">Inactive</Pill>;
  return <Pill tone="green">Active</Pill>;
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-[#e6eaf0] bg-white p-4 shadow-sm", className)}>
      {title ? <h2 className="mb-3 text-sm font-semibold text-[#1a1a1a]">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-[#E85D4C]" aria-label={label} />
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-[#5b6572]">
      <span>
        {total === 0 ? "No results" : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2">
          {page} / {pages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export const tableCls = "w-full border-collapse text-left text-sm";
export const thCls = "border-b border-[#e6eaf0] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#7a8494]";
export const tdCls = "border-b border-[#f0f2f6] px-3 py-2 align-top text-[#1a1a1a]";
export const selectCls =
  "h-9 rounded-md border border-[#d7dde6] bg-white px-2 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#528ff0]";