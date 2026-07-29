import { motion } from "framer-motion";
import { Award, ExternalLink } from "lucide-react";
import { ResumeTemplate, getTemplateStyles } from "./resumeTemplates";

interface Certification {
  id: number;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

interface ResumeCertificationsBlockProps {
  data: {
    template?: ResumeTemplate;
    title?: string;
    certifications: Certification[];
  };
}

const ResumeCertificationsBlock = ({ data }: ResumeCertificationsBlockProps) => {
  const styles = getTemplateStyles(data.template);

  const getSectionStyles = () => {
    switch (data.template) {
      case "modern":
        return "py-10 px-8 bg-gradient-to-r from-fuchsia-50/30 via-white to-violet-50/30";
      case "minimal":
        return "py-6 px-6 bg-white";
      case "bold":
        return "py-10 px-8 bg-gradient-to-r from-orange-50/30 via-white to-amber-50/30";
      default:
        return "py-8 px-6 bg-white";
    }
  };

  const getHeaderStyles = () => {
    switch (data.template) {
      case "modern":
        return "text-xl font-bold mb-6 pb-2 border-b-2 border-fuchsia-300 flex items-center gap-2";
      case "minimal":
        return "text-lg font-medium mb-6 pb-2 border-b border-neutral-200 flex items-center gap-2 uppercase tracking-wider";
      case "bold":
        return "text-2xl font-black mb-6 pb-2 border-b-4 border-orange-400 flex items-center gap-2";
      default:
        return "text-xl font-bold mb-6 pb-2 border-b-2 border-slate-300 flex items-center gap-2";
    }
  };

  const getCardStyles = () => {
    switch (data.template) {
      case "modern":
        return "p-4 bg-white/90 backdrop-blur-sm border border-violet-100 rounded-xl hover:shadow-lg hover:shadow-violet-100/50 transition-all";
      case "minimal":
        return "p-4 bg-white border-l-2 border-neutral-200 rounded-none";
      case "bold":
        return "p-4 bg-white border-2 border-amber-200 rounded-xl hover:border-amber-300 transition-colors";
      default:
        return "p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors";
    }
  };

  const getIconBgStyles = () => {
    switch (data.template) {
      case "modern": return "bg-gradient-to-r from-violet-100 to-fuchsia-100";
      case "minimal": return "bg-neutral-100";
      case "bold": return "bg-amber-100";
      default: return "bg-slate-100";
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
          <Award className={`h-5 w-5 ${styles.iconStyle}`} />
          {data.title || "Certifications & Awards"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data.certifications || []).map((cert, index) => (
            <motion.div
              key={cert.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={getCardStyles()}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getIconBgStyles()}`}>
                  <Award className={`h-5 w-5 ${styles.iconStyle}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${styles.primary}`}>{cert.name}</h3>
                  <p className={`text-sm ${styles.secondary}`}>{cert.issuer}</p>
                  <p className={`text-xs mt-1 ${styles.text}`}>
                    {cert.date}
                    {cert.expiryDate && ` - ${cert.expiryDate}`}
                  </p>
                  {cert.credentialId && (
                    <p className={`text-xs mt-1 ${styles.text}`}>
                      ID: {cert.credentialId}
                    </p>
                  )}
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-xs hover:underline mt-2 ${styles.secondary}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Credential
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

export default ResumeCertificationsBlock;
