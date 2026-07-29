import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { ResumeTemplate, getTemplateStyles } from "./resumeTemplates";

interface Education {
  id: number;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  achievements?: string[];
}

interface ResumeEducationBlockProps {
  data: {
    template?: ResumeTemplate;
    title?: string;
    education: Education[];
  };
}

const ResumeEducationBlock = ({ data }: ResumeEducationBlockProps) => {
  const styles = getTemplateStyles(data.template);

  const getSectionStyles = () => {
    switch (data.template) {
      case "modern":
        return "py-10 px-8 bg-gradient-to-r from-fuchsia-50/30 via-white to-violet-50/30";
      case "minimal":
        return "py-6 px-6 bg-neutral-50";
      case "bold":
        return "py-10 px-8 bg-gradient-to-r from-orange-50/30 via-white to-amber-50/30";
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
        return { line: "border-l-2 border-fuchsia-200", dot: "bg-gradient-to-r from-fuchsia-500 to-violet-500" };
      case "minimal":
        return { line: "border-l border-neutral-200", dot: "bg-neutral-400" };
      case "bold":
        return { line: "border-l-4 border-orange-300", dot: "bg-orange-500" };
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
          <GraduationCap className={`h-5 w-5 ${styles.iconStyle}`} />
          {data.title || "Education"}
        </h2>
        <div className="space-y-6">
          {(data.education || []).map((edu, index) => (
            <motion.div
              key={edu.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative pl-6 ${timeline.line}`}
            >
              <div className={`absolute -left-2 top-1 w-4 h-4 rounded-full ${timeline.dot}`} />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <div>
                  <h3 className={`text-lg font-semibold ${styles.primary}`}>{edu.degree} in {edu.field}</h3>
                  <p className={`font-medium ${styles.secondary}`}>{edu.institution}</p>
                </div>
                <div className={`text-sm mt-1 md:mt-0 ${styles.text}`}>
                  {edu.startDate} - {edu.endDate}
                  {edu.location && <span className="ml-2">• {edu.location}</span>}
                </div>
              </div>
              {edu.gpa && <p className={`text-sm mb-2 ${styles.text}`}>GPA: {edu.gpa}</p>}
              {edu.achievements && edu.achievements.length > 0 && (
                <ul className={`list-disc list-inside text-sm space-y-1 ${styles.text}`}>
                  {edu.achievements.map((achievement, i) => (
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

export default ResumeEducationBlock;
