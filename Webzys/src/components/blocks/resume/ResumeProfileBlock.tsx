import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, Github, Globe } from "lucide-react";
import { ResumeTemplate, getTemplateStyles } from "./resumeTemplates";

interface ResumeProfileBlockProps {
  data: {
    template?: ResumeTemplate;
    fullName: string;
    title: string;
    photo?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
}

const ResumeProfileBlock = ({ data }: ResumeProfileBlockProps) => {
  const styles = getTemplateStyles(data.template);

  const getPhotoStyles = () => {
    switch (data.template) {
      case "modern":
        return "w-36 h-36 md:w-44 md:h-44 rounded-2xl object-cover border-4 border-violet-200 shadow-xl shadow-violet-200/50 rotate-3 hover:rotate-0 transition-transform";
      case "minimal":
        return "w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border border-neutral-200 grayscale hover:grayscale-0 transition-all";
      case "bold":
        return "w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border-4 border-amber-400 shadow-2xl ring-4 ring-amber-200/50";
      default:
        return "w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-slate-200 shadow-lg";
    }
  };

  const getContainerStyles = () => {
    switch (data.template) {
      case "modern":
        return "py-16 px-8 bg-gradient-to-br from-violet-100 via-white to-fuchsia-100";
      case "minimal":
        return "py-10 px-6 bg-neutral-50 border-b border-neutral-100";
      case "bold":
        return "py-16 px-8 bg-gradient-to-r from-amber-100 via-orange-50 to-amber-100";
      default:
        return "py-12 px-6 bg-slate-50 border-b-2 border-slate-200";
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={getContainerStyles()}
    >
      <div className="max-w-4xl mx-auto">
        <div className={`flex flex-col ${data.template === "minimal" ? "items-start" : "md:flex-row items-center md:items-start"} gap-8`}>
          {data.photo && (
            <div className="relative">
              <img
                src={data.photo}
                alt={data.fullName}
                className={getPhotoStyles()}
              />
            </div>
          )}
          <div className={`flex-1 ${data.template === "minimal" ? "text-left" : "text-center md:text-left"}`}>
            <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${styles.primary} ${data.template === "modern" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent" : ""}`}>
              {data.fullName || "Your Name"}
            </h1>
            <p className={`text-xl font-medium mb-4 ${styles.secondary}`}>
              {data.title || "Professional Title"}
            </p>
            <div className={`flex flex-wrap ${data.template === "minimal" ? "justify-start" : "justify-center md:justify-start"} gap-4 ${styles.text}`}>
              {data.email && (
                <a href={`mailto:${data.email}`} className={`flex items-center gap-2 hover:${styles.accent} transition-colors`}>
                  <Mail className={`h-4 w-4 ${styles.iconStyle}`} />
                  <span className="text-sm">{data.email}</span>
                </a>
              )}
              {data.phone && (
                <a href={`tel:${data.phone}`} className={`flex items-center gap-2 hover:${styles.accent} transition-colors`}>
                  <Phone className={`h-4 w-4 ${styles.iconStyle}`} />
                  <span className="text-sm">{data.phone}</span>
                </a>
              )}
              {data.location && (
                <span className="flex items-center gap-2">
                  <MapPin className={`h-4 w-4 ${styles.iconStyle}`} />
                  <span className="text-sm">{data.location}</span>
                </span>
              )}
              {data.linkedin && (
                <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 hover:${styles.accent} transition-colors`}>
                  <Linkedin className={`h-4 w-4 ${styles.iconStyle}`} />
                  <span className="text-sm">LinkedIn</span>
                </a>
              )}
              {data.github && (
                <a href={data.github} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 hover:${styles.accent} transition-colors`}>
                  <Github className={`h-4 w-4 ${styles.iconStyle}`} />
                  <span className="text-sm">GitHub</span>
                </a>
              )}
              {data.website && (
                <a href={data.website} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 hover:${styles.accent} transition-colors`}>
                  <Globe className={`h-4 w-4 ${styles.iconStyle}`} />
                  <span className="text-sm">Portfolio</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default ResumeProfileBlock;
