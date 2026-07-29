import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, Github, Globe } from "lucide-react";
import { ResumeTemplate, getTemplateStyles } from "./resumeTemplates";

interface ResumeContactBlockProps {
  data: {
    template?: ResumeTemplate;
    title?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    message?: string;
  };
}

const ResumeContactBlock = ({ data }: ResumeContactBlockProps) => {
  const styles = getTemplateStyles(data.template);

  const getSectionStyles = () => {
    switch (data.template) {
      case "modern":
        return "py-16 px-8 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-violet-100";
      case "minimal":
        return "py-10 px-6 bg-neutral-100 border-t border-neutral-200";
      case "bold":
        return "py-16 px-8 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100";
      default:
        return "py-12 px-6 bg-slate-100";
    }
  };

  const getContactCardStyles = () => {
    switch (data.template) {
      case "modern":
        return "flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-sm border border-violet-100 rounded-xl hover:shadow-lg hover:shadow-violet-100/50 transition-all";
      case "minimal":
        return "flex items-center gap-3 px-4 py-2 bg-white border-l-2 border-neutral-300 hover:border-neutral-500 transition-colors";
      case "bold":
        return "flex items-center gap-3 px-6 py-3 bg-white border-2 border-amber-200 rounded-2xl hover:border-amber-400 shadow-lg transition-all";
      default:
        return "flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-colors";
    }
  };

  const getSocialButtonStyles = () => {
    switch (data.template) {
      case "modern":
        return "p-3 bg-white/90 backdrop-blur-sm border border-violet-100 rounded-full hover:shadow-lg hover:shadow-violet-100/50 transition-all";
      case "minimal":
        return "p-3 bg-white border border-neutral-200 rounded-none hover:bg-neutral-50 transition-colors";
      case "bold":
        return "p-3 bg-white border-2 border-amber-200 rounded-full hover:border-amber-400 shadow-md transition-all";
      default:
        return "p-3 bg-white border border-slate-200 rounded-full hover:border-slate-400 transition-colors";
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={getSectionStyles()}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className={`text-2xl font-bold mb-4 ${data.template === "modern" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent" : styles.primary}`}>
          {data.title || "Get In Touch"}
        </h2>
        {data.message && (
          <p className={`mb-8 max-w-2xl mx-auto ${styles.text}`}>
            {data.message}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-6">
          {data.email && (
            <motion.a
              href={`mailto:${data.email}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={getContactCardStyles()}
            >
              <Mail className={`h-5 w-5 ${styles.iconStyle}`} />
              <span className={styles.primary}>{data.email}</span>
            </motion.a>
          )}
          {data.phone && (
            <motion.a
              href={`tel:${data.phone}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={getContactCardStyles()}
            >
              <Phone className={`h-5 w-5 ${styles.iconStyle}`} />
              <span className={styles.primary}>{data.phone}</span>
            </motion.a>
          )}
          {data.location && (
            <div className={getContactCardStyles()}>
              <MapPin className={`h-5 w-5 ${styles.iconStyle}`} />
              <span className={styles.primary}>{data.location}</span>
            </div>
          )}
        </div>
        <div className="flex justify-center gap-4 mt-6">
          {data.linkedin && (
            <motion.a
              href={data.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={getSocialButtonStyles()}
            >
              <Linkedin className={`h-5 w-5 ${styles.iconStyle}`} />
            </motion.a>
          )}
          {data.github && (
            <motion.a
              href={data.github}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={getSocialButtonStyles()}
            >
              <Github className={`h-5 w-5 ${styles.iconStyle}`} />
            </motion.a>
          )}
          {data.website && (
            <motion.a
              href={data.website}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={getSocialButtonStyles()}
            >
              <Globe className={`h-5 w-5 ${styles.iconStyle}`} />
            </motion.a>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default ResumeContactBlock;
