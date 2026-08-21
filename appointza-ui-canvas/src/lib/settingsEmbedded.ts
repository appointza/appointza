import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

/** Horizontal padding shared by all profile-settings tabs. */
export const profileSettingsX = "px-4 md:px-6 lg:px-8";

/** Shared profile-settings card sections (embedded tabs under /organization/profile). */
export const settingsEmbedded = {
  shell: cn(org.card, "w-full overflow-hidden rounded-xl shadow-none"),
  /** Tab content title — no bottom border; tabs row already divides the page. */
  sectionHeader: cn(profileSettingsX, "w-full space-y-1.5 bg-white pb-4 pt-5 md:pb-5 md:pt-6"),
  sectionHeaderPlain: cn(profileSettingsX, "w-full space-y-1.5 bg-white pb-4 pt-5 md:pb-5 md:pt-6"),
  sectionBody: cn(profileSettingsX, "w-full min-w-0 pb-5 pt-0 md:pb-6"),
  title: "flex w-full items-center gap-3 text-lg font-semibold leading-snug text-appointza-navy md:text-xl",
  description: "text-sm text-slate-500",
  iconWrap:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600",
  list: "w-full space-y-3",
  /** Single grouped list — one border, dividers between rows (no stacked cards). */
  listGroup: "w-full overflow-hidden rounded-xl border border-stone-200 bg-white divide-y divide-stone-200",
  listRow:
    "flex w-full flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5",
  /** Standalone row card (non-embedded pages). */
  row: (embedded?: boolean, className?: string) =>
    cn(
      embedded
        ? settingsEmbedded.listRow
        : "rounded-xl border border-stone-200 bg-white p-4 hover:bg-blue-50/30",
      className,
    ),
  card: (embedded?: boolean, className?: string) =>
    cn(
      embedded
        ? "w-full rounded-xl border border-stone-200 bg-white shadow-none"
        : cn(org.card, "w-full shadow-none"),
      className,
    ),
} as const;
