import { motion } from "framer-motion";
import { ResumeTemplate, getTemplateStyles } from "./resumeTemplates";

interface ResumeSummaryBlockProps {
  data: {
    template?: ResumeTemplate;
    title?: string;
    summary: string;
  };
}

const ResumeSummaryBlock = ({ data }: ResumeSummaryBlockProps) => {
  const styles = getTemplateStyles(data.template);

  const getSectionStyles = () => {
    switch (data.template) {
      case "modern":
        return "py-10 px-8 bg-gradient-to-r from-violet-50/50 via-white to-fuchsia-50/50";
      case "minimal":
        return "py-6 px-6 bg-neutral-50";
      case "bold":
        return "py-10 px-8 bg-gradient-to-r from-amber-50/50 via-white to-orange-50/50";
      default:
        return "py-8 px-6 bg-white";
    }
  };

  const getHeaderStyles = () => {
    switch (data.template) {
      case "modern":
        return "text-xl font-bold mb-4 pb-2 border-b-2 border-violet-300 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent";
      case "minimal":
        return "text-lg font-medium mb-4 pb-2 border-b border-neutral-200 text-neutral-800 uppercase tracking-wider";
      case "bold":
        return "text-2xl font-black mb-4 pb-2 border-b-4 border-amber-400 text-amber-900";
      default:
        return "text-xl font-bold mb-4 pb-2 border-b-2 border-slate-300 text-slate-800";
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={getSectionStyles()}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className={getHeaderStyles()}>
          {data.title || "Professional Summary"}
        </h2>
        <p className={`leading-relaxed whitespace-pre-line ${styles.text} ${data.template === "bold" ? "text-lg" : ""}`}>
          {data.summary || "Add your professional summary here. Describe your experience, skills, and career objectives."}
        </p>
      </div>
    </motion.section>
  );
};

export default ResumeSummaryBlock;
