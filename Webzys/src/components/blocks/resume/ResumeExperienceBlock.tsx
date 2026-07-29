import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { ResumeTemplate, getTemplateStyles } from "./resumeTemplates";

interface Experience {
  id: number;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description: string;
  achievements?: string[];
}

interface ResumeExperienceBlockProps {
  data: {
    template?: ResumeTemplate;
    title?: string;
    experiences: Experience[];
  };
}

const ResumeExperienceBlock = ({ data }: ResumeExperienceBlockProps) => {
  const styles = getTemplateStyles(data.template);

  const getSectionStyles = () => {
    switch (data.template) {
      case "modern":
        return "py-10 px-8 bg-gradient-to-r from-violet-50/30 via-white to-fuchsia-50/30";
      case "minimal":
        return "py-6 px-6 bg-neutral-50";
      case "bold":
        return "py-10 px-8 bg-gradient-to-r from-amber-50/30 via-white to-orange-50/30";
      default:
        return "py-8 px-6 bg-white";
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

  const getTimelineStyles = () => {
    switch (data.template) {
      case "modern":
        return { line: "border-l-2 border-violet-200", dot: "bg-gradient-to-r from-violet-500 to-fuchsia-500" };
      case "minimal":
        return { line: "border-l border-neutral-200", dot: "bg-neutral-400" };
      case "bold":
        return { line: "border-l-4 border-amber-300", dot: "bg-amber-500" };
      default:
        return { line: "border-l-2 border-slate-200", dot: "bg-slate-600" };
    }
  };

  const timeline = getTimelineStyles();

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={getSectionStyles()}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className={`${getHeaderStyles()} ${styles.primary}`}>
          <Briefcase className={`h-5 w-5 ${styles.iconStyle}`} />
          {data.title || "Work Experience"}
        </h2>
        <div className="space-y-6">
          {(data.experiences || []).map((exp, index) => (
            <motion.div
              key={exp.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative pl-6 ${timeline.line}`}
            >
              <div className={`absolute -left-2 top-1 w-4 h-4 rounded-full ${timeline.dot}`} />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <div>
                  <h3 className={`text-lg font-semibold ${styles.primary}`}>{exp.position}</h3>
                  <p className={`font-medium ${styles.secondary}`}>{exp.company}</p>
                </div>
                <div className={`text-sm mt-1 md:mt-0 ${styles.text}`}>
                  {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  {exp.location && <span className="ml-2">• {exp.location}</span>}
                </div>
              </div>
              <p className={`text-sm mb-2 ${styles.text}`}>{exp.description}</p>
              {exp.achievements && exp.achievements.length > 0 && (
                <ul className={`list-disc list-inside text-sm space-y-1 ${styles.text}`}>
                  {exp.achievements.map((achievement, i) => (
                    <li key={i}>{achievement}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default ResumeExperienceBlock;
