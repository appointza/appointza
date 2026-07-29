// Resume Template Definitions
export type ResumeTemplate = "classic" | "modern" | "minimal" | "bold";

export interface TemplateStyles {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  cardBg: string;
  text: string;
  border: string;
  headerStyle: string;
  sectionStyle: string;
  cardStyle: string;
  tagStyle: string;
  iconStyle: string;
}

export const resumeTemplates: Record<ResumeTemplate, TemplateStyles> = {
  classic: {
    name: "Classic",
    description: "Traditional professional resume with clean typography",
    primary: "text-slate-800",
    secondary: "text-slate-600",
    accent: "text-blue-600",
    background: "bg-white",
    cardBg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    headerStyle: "border-b-2 border-slate-800",
    sectionStyle: "bg-white py-6 px-6",
    cardStyle: "bg-white border border-slate-200 rounded-md shadow-sm",
    tagStyle: "bg-slate-100 text-slate-700 border border-slate-200",
    iconStyle: "text-slate-600",
  },
  modern: {
    name: "Modern",
    description: "Contemporary design with gradients and vibrant colors",
    primary: "text-violet-900",
    secondary: "text-violet-600",
    accent: "text-violet-500",
    background: "bg-gradient-to-br from-violet-50 via-white to-fuchsia-50",
    cardBg: "bg-white/80 backdrop-blur-sm",
    text: "text-slate-700",
    border: "border-violet-200",
    headerStyle: "border-b-2 border-violet-400 bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent",
    sectionStyle: "bg-gradient-to-br from-violet-50/50 via-white to-fuchsia-50/50 py-8 px-6",
    cardStyle: "bg-white/90 backdrop-blur-sm border border-violet-100 rounded-xl shadow-lg shadow-violet-100/50",
    tagStyle: "bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 border-0",
    iconStyle: "text-violet-500",
  },
  minimal: {
    name: "Minimal",
    description: "Clean, minimalist design with focus on content",
    primary: "text-neutral-900",
    secondary: "text-neutral-500",
    accent: "text-neutral-700",
    background: "bg-neutral-50",
    cardBg: "bg-white",
    text: "text-neutral-600",
    border: "border-neutral-100",
    headerStyle: "border-b border-neutral-200",
    sectionStyle: "bg-neutral-50 py-6 px-6",
    cardStyle: "bg-white border-0 rounded-none shadow-none border-l-2 border-neutral-200 pl-4",
    tagStyle: "bg-transparent text-neutral-600 border border-neutral-300",
    iconStyle: "text-neutral-400",
  },
  bold: {
    name: "Bold",
    description: "Eye-catching design with strong colors and shadows",
    primary: "text-amber-900",
    secondary: "text-amber-700",
    accent: "text-amber-500",
    background: "bg-gradient-to-br from-amber-50 to-orange-50",
    cardBg: "bg-white",
    text: "text-gray-700",
    border: "border-amber-200",
    headerStyle: "border-b-4 border-amber-500",
    sectionStyle: "bg-gradient-to-br from-amber-50/80 to-orange-50/80 py-8 px-6",
    cardStyle: "bg-white border-2 border-amber-200 rounded-2xl shadow-xl shadow-amber-100/50",
    tagStyle: "bg-amber-100 text-amber-800 border-0 font-semibold",
    iconStyle: "text-amber-500",
  },
};

export const getTemplateStyles = (template: ResumeTemplate = "classic"): TemplateStyles => {
  return resumeTemplates[template] || resumeTemplates.classic;
};
