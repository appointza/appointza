import { motion } from "framer-motion";
import { FolderOpen, ExternalLink, Github } from "lucide-react";
import { ResumeTemplate, getTemplateStyles } from "./resumeTemplates";

interface Project {
  id: number;
  name: string;
  description: string;
  technologies?: string[];
  liveUrl?: string;
  githubUrl?: string;
  image?: string;
}

interface ResumeProjectsBlockProps {
  data: {
    template?: ResumeTemplate;
    title?: string;
    projects: Project[];
  };
}

const ResumeProjectsBlock = ({ data }: ResumeProjectsBlockProps) => {
  const styles = getTemplateStyles(data.template);

  const getSectionStyles = () => {
    switch (data.template) {
      case "modern":
        return "py-10 px-8 bg-gradient-to-br from-violet-50/30 via-white to-fuchsia-50/30";
      case "minimal":
        return "py-6 px-6 bg-neutral-50";
      case "bold":
        return "py-10 px-8 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30";
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

  const getCardStyles = () => {
    switch (data.template) {
      case "modern":
        return "bg-white/90 backdrop-blur-sm border border-violet-100 rounded-xl shadow-lg shadow-violet-100/50 overflow-hidden hover:shadow-xl hover:shadow-violet-200/50 transition-all";
      case "minimal":
        return "bg-white border-0 rounded-none shadow-none border-l-2 border-neutral-200 overflow-hidden";
      case "bold":
        return "bg-white border-2 border-amber-200 rounded-2xl shadow-xl shadow-amber-100/50 overflow-hidden hover:shadow-2xl hover:border-amber-300 transition-all";
      default:
        return "bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden hover:shadow-lg transition-shadow";
    }
  };

  const getTechTagStyles = () => {
    switch (data.template) {
      case "modern": return "bg-violet-100 text-violet-700";
      case "minimal": return "bg-neutral-100 text-neutral-600";
      case "bold": return "bg-amber-100 text-amber-800 font-medium";
      default: return "bg-slate-100 text-slate-600";
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
          <FolderOpen className={`h-5 w-5 ${styles.iconStyle}`} />
          {data.title || "Projects"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(data.projects || []).map((project, index) => (
            <motion.div
              key={project.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={getCardStyles()}
            >
              {project.image && (
                <img
                  src={project.image}
                  alt={project.name}
                  className={`w-full h-40 object-cover ${data.template === "minimal" ? "grayscale hover:grayscale-0 transition-all" : ""}`}
                />
              )}
              <div className="p-4">
                <h3 className={`text-lg font-semibold mb-2 ${styles.primary}`}>{project.name}</h3>
                <p className={`text-sm mb-3 ${styles.text}`}>{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className={`px-2 py-0.5 text-xs rounded ${getTechTagStyles()}`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 text-sm hover:underline ${styles.secondary}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Live Demo
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 text-sm hover:underline ${styles.secondary}`}
                    >
                      <Github className="h-3.5 w-3.5" />
                      Source
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default ResumeProjectsBlock;
