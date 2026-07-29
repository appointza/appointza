import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { ResumeTemplate, getTemplateStyles } from "./resumeTemplates";

interface Language {
  name: string;
  proficiency: "Native" | "Fluent" | "Advanced" | "Intermediate" | "Basic";
}

interface ResumeLanguagesBlockProps {
  data: {
    template?: ResumeTemplate;
    title?: string;
    languages: Language[];
  };
}

const proficiencyLevels: Record<string, number> = {
  Native: 100,
  Fluent: 90,
  Advanced: 75,
  Intermediate: 50,
  Basic: 25,
};

const ResumeLanguagesBlock = ({ data }: ResumeLanguagesBlockProps) => {
  const styles = getTemplateStyles(data.template);

  const getSectionStyles = () => {
    switch (data.template) {
      case "modern":
        return "py-10 px-8 bg-gradient-to-r from-violet-50/50 via-fuchsia-50/30 to-violet-50/50";
      case "minimal":
        return "py-6 px-6 bg-neutral-50";
      case "bold":
        return "py-10 px-8 bg-gradient-to-r from-amber-50/50 via-orange-50/30 to-amber-50/50";
      default:
        return "py-8 px-6 bg-slate-50";
    }
  };

  const getHeaderStyles = () => {
    switch (data.template) {
      case "modern":
        return "text-xl font-bold mb-6 pb-2 border-b-2 border-violet-300 flex items-center gap-2";
      case "minimal":
        return "text-lg font-medium mb-6 pb-2 border-b border-neutral-200 flex items-center gap-2 uppercase tracking-wider";
      case "bold":
        return "text-2xl font-black mb-6 pb-2 border-b-4 border-amber-400 flex items-center gap-2";
      default:
        return "text-xl font-bold mb-6 pb-2 border-b-2 border-slate-300 flex items-center gap-2";
    }
  };

  const getCardStyles = () => {
    switch (data.template) {
      case "modern":
        return "p-4 bg-white/90 backdrop-blur-sm border border-violet-100 rounded-xl text-center";
      case "minimal":
        return "p-4 bg-white border-l-2 border-neutral-200 rounded-none text-left";
      case "bold":
        return "p-4 bg-white border-2 border-amber-200 rounded-2xl text-center shadow-lg";
      default:
        return "p-4 bg-white border border-slate-200 rounded-lg text-center";
    }
  };

  const getBarColor = () => {
    switch (data.template) {
      case "modern": return "bg-gradient-to-r from-violet-500 to-fuchsia-500";
      case "minimal": return "bg-neutral-600";
      case "bold": return "bg-gradient-to-r from-amber-500 to-orange-500";
      default: return "bg-slate-600";
    }
  };

  const getBarBgColor = () => {
    switch (data.template) {
      case "modern": return "bg-violet-100";
      case "minimal": return "bg-neutral-200";
      case "bold": return "bg-amber-100";
      default: return "bg-slate-200";
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={getSectionStyles()}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className={`${getHeaderStyles()} ${styles.primary}`}>
          <Globe className={`h-5 w-5 ${styles.iconStyle}`} />
          {data.title || "Languages"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(data.languages || []).map((lang, index) => (
            <motion.div
              key={lang.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={getCardStyles()}
            >
              <p className={`font-semibold mb-2 ${styles.primary}`}>{lang.name}</p>
              <div className={`h-2 rounded-full overflow-hidden mb-2 ${getBarBgColor()}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${proficiencyLevels[lang.proficiency] || 50}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`h-full rounded-full ${getBarColor()}`}
                />
              </div>
              <span className={`text-xs ${styles.text}`}>{lang.proficiency}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default ResumeLanguagesBlock;
