import { motion } from "framer-motion";
import { Check, User, Palette, Code } from "lucide-react";
import { FullResumeTemplate, getTemplateOptions, resumeTemplateConfigs } from "./ResumeTemplateData";

interface ResumeTemplateSelectorProps {
  selectedTemplate: FullResumeTemplate;
  onSelectTemplate: (template: FullResumeTemplate) => void;
}

const templateIcons = {
  template1: User,
  template2: Palette,
  template3: Code,
};

const templateColors = {
  template1: "from-slate-600 to-blue-600",
  template2: "from-violet-500 to-fuchsia-500",
  template3: "from-emerald-500 to-teal-500",
};

const ResumeTemplateSelector = ({ selectedTemplate, onSelectTemplate }: ResumeTemplateSelectorProps) => {
  const templates = getTemplateOptions();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Choose Resume Template</h3>
        <span className="text-sm text-muted-foreground">Select a template to get started</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => {
          const Icon = templateIcons[template.id];
          const isSelected = selectedTemplate === template.id;
          const config = resumeTemplateConfigs[template.id];
          
          return (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectTemplate(template.id)}
              className={`
                relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200
                ${isSelected 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                }
              `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-primary-foreground" />
                </motion.div>
              )}
              
              {/* Template preview */}
              <div className={`
                h-24 rounded-lg mb-3 flex items-center justify-center
                bg-gradient-to-br ${templateColors[template.id]}
              `}>
                <Icon className="w-10 h-10 text-white" />
              </div>
              
              {/* Template info */}
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground">{template.name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {config.layout}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {template.preview.split(" / ")[0]}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ResumeTemplateSelector;
