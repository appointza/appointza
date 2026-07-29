import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

/** Shared profile-settings card sections (embedded tabs under /organization/profile). */
export const settingsEmbedded = {
  shell: cn(org.card, "overflow-hidden rounded-3xl"),
  sectionHeader:
    "space-y-1.5 border-b border-blue-50 bg-gradient-to-br from-blue-50/80 via-white to-violet-50/50 p-5 md:p-6",
  sectionHeaderPlain: "space-y-1.5 border-b border-blue-50 p-5 md:p-6",
  sectionBody: "p-5 md:p-6",
  title: "flex items-center gap-3 text-lg font-semibold leading-snug text-appointza-navy md:text-xl",
  description: "text-sm text-slate-500",
  iconWrap:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600",
  /** Nested card inside the settings shell — flat section instead of stacked card. */
  card: (embedded?: boolean, className?: string) =>
    cn(
      embedded ?
        "rounded-2xl border border-blue-50 bg-appointza-cream/40 shadow-none"
      : cn(org.card, "shadow-sm"),
      className
    ),
  /** List row inside embedded settings. */
  row: (embedded?: boolean, className?: string) =>
    cn(
      embedded ?
        "rounded-2xl border border-blue-50 bg-white p-4 transition-colors hover:border-blue-100 hover:bg-blue-50/40"
      : "rounded-xl border border-slate-200 bg-white p-4 hover:bg-blue-50/40",
      className
    ),
} as const;
