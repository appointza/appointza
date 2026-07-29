import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { ResumeTemplate, getTemplateStyles } from "./resumeTemplates";

interface Skill {
  name: string;
  level: number;
  category?: string;
}

interface ResumeSkillsBlockProps {
  data: {
    template?: ResumeTemplate;
    title?: string;
    skills: Skill[];
    displayType?: "bars" | "tags" | "grid";
  };
}

const ResumeSkillsBlock = ({ data }: ResumeSkillsBlockProps) => {
  const styles = getTemplateStyles(data.template);
  const displayType = data.displayType || "bars";
  const groupedSkills = (data.skills || []).reduce((acc, skill) => {
    const category = skill.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const getSectionStyles = () => {
    switch (data.template) {
      case "modern":
        return "py-10 px-8 bg-gradient-to-r from-violet-50/50 via-fuchsia-50/30 to-violet-50/50";
      case "minimal":
        return "py-6 px-6 bg-white";
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

  const getBarColor = () => {
    switch (data.template) {
      case "modern": return "bg-gradient-to-r from-violet-500 to-fuchsia-500";
      case "minimal": return "bg-neutral-600";
      case "bold": return "bg-gradient-to-r from-amber-500 to-orange-500";
      default: return "bg-slate-600";
    }
  };

  const getTagStyles = () => {
    switch (data.template) {
      case "modern": return "bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 border-0";
      case "minimal": return "bg-transparent text-neutral-600 border border-neutral-300";
      case "bold": return "bg-amber-100 text-amber-800 border-0 font-semibold";
      default: return "bg-slate-100 text-slate-700 border border-slate-200";
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
          <Star className={`h-5 w-5 ${styles.iconStyle}`} />
          {data.title || "Skills"}
        </h2>
        
        {displayType === "bars" && (
          <div className="space-y-6">
            {Object.entries(groupedSkills).map(([category, skills]) => (
              <div key={category}>
                {Object.keys(groupedSkills).length > 1 && (
                  <h3 className={`text-sm font-semibold mb-3 ${styles.secondary}`}>{category}</h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skills.map((skill, index) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex justify-between mb-1">
                        <span className={`text-sm font-medium ${styles.primary}`}>{skill.name}</span>
                        <span className={`text-xs ${styles.text}`}>{skill.level * 20}%</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${data.template === "modern" ? "bg-violet-100" : data.template === "bold" ? "bg-amber-100" : "bg-slate-200"}`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.level * 20}%` }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                          className={`h-full rounded-full ${getBarColor()}`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {displayType === "tags" && (
          <div className="flex flex-wrap gap-2">
            {(data.skills || []).map((skill, index) => (
              <motion.span
                key={skill.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${getTagStyles()}`}
              >
                {skill.name}
              </motion.span>
            ))}
          </div>
        )}

        {displayType === "grid" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(data.skills || []).map((skill, index) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`p-4 rounded-lg text-center ${styles.cardStyle}`}
              >
                <p className={`font-medium mb-2 ${styles.primary}`}>{skill.name}</p>
                <div className="flex justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-2 h-2 rounded-full ${
                        level <= skill.level ? getBarColor() : data.template === "modern" ? "bg-violet-100" : data.template === "bold" ? "bg-amber-100" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default ResumeSkillsBlock;
