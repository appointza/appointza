import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  FileBarChart2,
  Loader2,
  Search,
  Sparkles,
  Users,
  Wallet,
  BriefcaseBusiness,
  GitBranch,
  Megaphone,
  Layers3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ReportListItemDto } from "@/models/dynamicReport.model";
import { orgReportsService } from "@/services/orgReports.service";

const CATEGORY_META: Record<
  string,
  { icon: typeof FileBarChart2; accent: string; blurb: string }
> = {
  Customers: {
    icon: Users,
    accent: "from-[#dff0ff] to-[#f4f8ff]",
    blurb: "Who your customers are and what they have done",
  },
  "Events & Participants": {
    icon: CalendarDays,
    accent: "from-[#e4f7ef] to-[#f4fbf7]",
    blurb: "Registration, attendance and completion",
  },
  "Bookings & Appointments": {
    icon: BriefcaseBusiness,
    accent: "from-[#fff0e4] to-[#fff8f2]",
    blurb: "Appointment history and outcomes",
  },
  "Staff Performance": {
    icon: Sparkles,
    accent: "from-[#efe8ff] to-[#f7f4ff]",
    blurb: "Completed work and revenue by staff",
  },
  "Sales & Finance": {
    icon: Wallet,
    accent: "from-[#ffe8e8] to-[#fff6f6]",
    blurb: "Payments, pending balances and revenue",
  },
  "Marketing & Loyalty": {
    icon: Megaphone,
    accent: "from-[#e8f4ff] to-[#f5faff]",
    blurb: "Inactivity and re-engagement signals",
  },
  "Cross-Module Analytics": {
    icon: GitBranch,
    accent: "from-[#e9eef8] to-[#f5f7fb]",
    blurb: "Customer journey across modules",
  },
  General: {
    icon: Layers3,
    accent: "from-[#eef2f7] to-[#f7f9fc]",
    blurb: "Published operational reports",
  },
};

function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? CATEGORY_META.General;
}

export default function OrganizationReports() {
  const [rows, setRows] = useState<ReportListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await orgReportsService.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.category || "General");
    return ["All", ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const cat = r.category || "General";
      if (activeCategory !== "All" && cat !== activeCategory) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, activeCategory]);

  const byCategory = useMemo(() => {
    const map = new Map<string, ReportListItemDto[]>();
    for (const r of filtered) {
      const key = r.category || "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f5f7fa]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(ellipse_at_top,_#dbe8ff_0%,_transparent_62%),linear-gradient(180deg,#eef3f9_0%,#f5f7fa_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 h-56 w-56 rounded-full bg-[#2a5af5]/[0.06] blur-3xl"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
        <header className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a8494]">
            Insights
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.03em] text-[#121826] md:text-[2.35rem]">
            Reports
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#5b6572]">
            Customer, event, booking and revenue answers — record by record, with filters you can trust.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa3b2]" />
              <Input
                className="h-11 rounded-xl border-[#dde3ec] bg-white/90 pl-10 shadow-[0_1px_2px_rgba(16,24,40,0.04)] placeholder:text-[#9aa3b2] focus-visible:ring-[#2a5af5]/30"
                placeholder="Search by report or category…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {!loading && rows.length > 0 ? (
              <p className="text-[13px] text-[#7a8494]">
                <span className="font-semibold text-[#1a2332]">{filtered.length}</span> of {rows.length}{" "}
                reports
              </p>
            ) : null}
          </div>
        </header>

        {!loading && categories.length > 1 ? (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200",
                    active
                      ? "bg-[#121826] text-white shadow-sm"
                      : "bg-white/80 text-[#5b6572] ring-1 ring-[#e4e9f0] hover:bg-white hover:text-[#121826]",
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-8">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-[13px] text-red-700">
              {error}
              <button type="button" className="ml-2 font-medium underline" onClick={() => void load()}>
                Retry
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-24 text-[13px] text-[#7a8494]">
              <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
              Loading reports…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#e6eaf0]">
                <FileBarChart2 className="h-6 w-6 text-[#9aa3b2]" />
              </div>
              <p className="text-[15px] font-medium text-[#121826]">No reports match</p>
              <p className="max-w-sm text-[13px] text-[#7a8494]">
                Try another category or clear your search to see published reports.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {byCategory.map(([category, items], sectionIndex) => {
                const meta = categoryMeta(category);
                const Icon = meta.icon;
                return (
                  <section
                    key={category}
                    className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500"
                    style={{ animationDelay: `${Math.min(sectionIndex, 5) * 60}ms` }}
                  >
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ring-1 ring-black/[0.03]",
                            meta.accent,
                          )}
                        >
                          <Icon className="h-4 w-4 text-[#1a2332]" strokeWidth={1.75} />
                        </div>
                        <div>
                          <h2 className="text-[15px] font-semibold tracking-tight text-[#121826]">
                            {category}
                          </h2>
                          <p className="text-[12px] text-[#7a8494]">{meta.blurb}</p>
                        </div>
                      </div>
                      <span className="text-[12px] font-medium text-[#9aa3b2]">{items.length}</span>
                    </div>

                    <ul className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-[#e6eaf0]">
                      {items.map((r, i) => (
                        <li key={r.id} className={cn(i > 0 && "border-t border-[#eef1f5]")}>
                          <Link
                            to={`/organization/reports/${r.id}`}
                            className="group flex items-start gap-4 px-4 py-4 transition-colors duration-200 hover:bg-[#f8fafc] sm:px-5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[15px] font-medium tracking-tight text-[#121826] transition-colors group-hover:text-[#2a5af5]">
                                  {r.name}
                                </p>
                                <div className="flex gap-1">
                                  {r.export_csv ? (
                                    <span className="rounded bg-[#f1f4f8] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a8494]">
                                      CSV
                                    </span>
                                  ) : null}
                                  {r.export_excel ? (
                                    <span className="rounded bg-[#f1f4f8] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a8494]">
                                      Excel
                                    </span>
                                  ) : null}
                                  {r.export_pdf ? (
                                    <span className="rounded bg-[#f1f4f8] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a8494]">
                                      PDF
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              {r.description ? (
                                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#5b6572]">
                                  {r.description}
                                </p>
                              ) : null}
                            </div>
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-transparent text-[#9aa3b2] transition-all duration-200 group-hover:bg-[#eef3ff] group-hover:text-[#2a5af5]">
                              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
