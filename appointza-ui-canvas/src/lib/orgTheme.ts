/**
 * Shared organization dashboard theme (soft surface, navy text, blue-violet accents).
 * Prefer these tokens over per-page gray/orange classes.
 */
export const org = {
  page: "org-page",
  pageHeader: "org-page-header",
  pageSection: "org-page-section",
  title: "org-title",
  description: "org-description",
  card: "org-card",
  panel: "org-panel",
  panelSection: "org-panel-section",
  empty: "org-empty",
  loading: "org-loading",
  btnOutline:
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-sm font-semibold text-appointza-navy shadow-sm hover:border-blue-200 hover:bg-blue-50 sm:px-4",
  btnPrimary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border-0 bg-gradient-coral px-5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:-translate-y-0.5 hover:brightness-105",
  btnDark:
    "inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-gradient-coral px-5 text-sm font-medium text-white hover:opacity-95 shadow-sm",
  tabTrigger:
    "min-h-10 min-w-0 flex-1 rounded-xl border border-blue-100 bg-white px-2 py-2 text-xs font-semibold text-slate-600 shadow-none transition-colors data-[state=active]:border-transparent data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 sm:min-h-11 sm:px-4 sm:py-2.5 sm:text-sm",
  segmentActive: "bg-gradient-coral text-white",
  segmentInactive: "bg-white text-slate-600 hover:bg-blue-50",
  segmentGroup: "flex overflow-hidden rounded-xl border border-blue-100",
  selectTrigger:
    "h-11 w-full rounded-xl border-blue-100 bg-white text-sm focus:ring-blue-200",
  input:
    "rounded-xl border-blue-100 bg-white shadow-sm focus-visible:border-blue-400 focus-visible:ring-blue-100",
  label: "text-xs font-medium text-slate-500",
  tabsUnderline: "org-tabs-underline",
} as const;
