import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutTemplate,
  Type,
  Image,
  Images,
  Grid3X3,
  MessageSquareQuote,
  Sparkles,
  List,
  Mail,
  PlayCircle,
  BarChart3,
  Calendar,
  Star,
  DollarSign,
  Users,
  HelpCircle,
  Layout,
  MapPin,
  Clock,
  Check,
  FileUser,
  User,
  Briefcase,
  GraduationCap,
  FolderOpen,
  Award,
  Globe,
  Video,
  Palette,
  Code,
  ChevronRight,
} from "lucide-react";
import { BlockCategory } from "@/types/builder";
import { fullTemplateOptions, FullTemplateId } from "@/components/blocks/resume/FullResumePreview";

interface BlockPaletteProps {
  onAddBlock: (blockType: string) => void;
  onApplyResumeTemplate?: (templateId: FullTemplateId) => void;
  websiteType: string;
}

const getBlockCategories = (websiteType: string): BlockCategory[] => {
  const baseCategories: BlockCategory[] = [];

  // Only add Layout category for non-resume websites
  if (websiteType !== "resume") {
    baseCategories.push({
      name: "Layout",
      icon: "Layout",
      blocks: [
        { type: "hero", name: "Hero Centered", icon: "LayoutTemplate", description: "Centered hero with gradient" },
        { type: "hero-2", name: "Hero Split", icon: "LayoutTemplate", description: "Split layout with image" },
        { type: "hero-3", name: "Hero Minimal", icon: "LayoutTemplate", description: "Minimal centered design" },
        { type: "hero-4", name: "Hero Image BG", icon: "LayoutTemplate", description: "Full image background" },
        { type: "hero-5", name: "Hero Left Aligned", icon: "LayoutTemplate", description: "Left-aligned content" },
        { type: "hero-6", name: "Hero Video BG", icon: "LayoutTemplate", description: "Video background hero" },
        { type: "section", name: "Section with BG", icon: "Layout", description: "Section with background image" },
        { type: "header", name: "Header", icon: "Layout", description: "Navigation header" },
        { type: "footer", name: "Footer", icon: "Layout", description: "Page footer" },
      ],
    });
  }

  // Add Appointza-specific blocks
  if (websiteType === "appointza") {
    baseCategories.push({
      name: "Appointza",
      icon: "Calendar",
      blocks: [
        { type: "appointza-organization", name: "Organization Info", icon: "LayoutTemplate", description: "Organization details and logo" },
        { type: "appointza-location", name: "Location Details", icon: "MapPin", description: "Address and location information" },
        { type: "appointza-services", name: "Services List", icon: "Sparkles", description: "List of services offered" },
        { type: "appointza-timings", name: "Service Timings", icon: "Clock", description: "Operating hours and schedule" },
        { type: "appointza-events", name: "Events List", icon: "Calendar", description: "Upcoming events and activities" },
        { type: "appointza-reviews", name: "Reviews", icon: "MessageSquareQuote", description: "Customer reviews and ratings" },
        { type: "appointza-facilities", name: "Facilities", icon: "Check", description: "Available facilities list" },
        { type: "appointza-location-images", name: "Location Images", icon: "Images", description: "Gallery of location photos" },
      ],
    });
  }

  // Add Resume-specific blocks
  if (websiteType === "resume") {
    baseCategories.push({
      name: "Resume",
      icon: "FileUser",
      blocks: [
        { type: "resume-profile", name: "Profile Header", icon: "User", description: "Name, photo, title and contact info" },
        { type: "resume-summary", name: "Summary", icon: "Type", description: "Professional summary or objective" },
        { type: "resume-experience", name: "Experience", icon: "Briefcase", description: "Work experience timeline" },
        { type: "resume-education", name: "Education", icon: "GraduationCap", description: "Educational background" },
        { type: "resume-skills", name: "Skills", icon: "Star", description: "Skills and proficiency levels" },
        { type: "resume-projects", name: "Projects", icon: "FolderOpen", description: "Portfolio of projects" },
        { type: "resume-certifications", name: "Certifications", icon: "Award", description: "Certifications and awards" },
        { type: "resume-languages", name: "Languages", icon: "Globe", description: "Language proficiencies" },
        { type: "resume-contact", name: "Contact Section", icon: "Mail", description: "Contact information footer" },
      ],
    });
  }

  // For resume type, only return resume-related categories
  if (websiteType === "resume") {
    return baseCategories;
  }

  return [
    ...baseCategories,
    {
      name: "Content",
      icon: "Type",
      blocks: [
        { type: "text", name: "Text", icon: "Type", description: "Text paragraph" },
        { type: "image", name: "Image", icon: "Image", description: "Single image" },
        { type: "image-carousel", name: "Image Carousel", icon: "Images", description: "Image slider" },
        { type: "gallery", name: "Gallery", icon: "Grid3X3", description: "Image gallery" },
        { type: "video", name: "Video", icon: "PlayCircle", description: "Video embed" },
        { type: "social-video", name: "Social Video", icon: "Video", description: "Instagram/YouTube embed" },
        { type: "custom-html", name: "Custom HTML", icon: "Code", description: "Paste & preview HTML code" },
      ],
    },
    {
      name: "Features",
      icon: "Sparkles",
      blocks: [
        { type: "features", name: "Features", icon: "Sparkles", description: "Feature grid" },
        { type: "benefits", name: "Benefits", icon: "Star", description: "Benefits list" },
        { type: "stats", name: "Statistics", icon: "BarChart3", description: "Stats counters" },
      ],
    },
    {
      name: "Social Proof",
      icon: "Users",
      blocks: [
        { type: "testimonial", name: "Testimonial", icon: "MessageSquareQuote", description: "Single testimonial" },
        { type: "reviews", name: "Reviews", icon: "Star", description: "Review carousel" },
        { type: "logos", name: "Client Logos", icon: "Users", description: "Logo showcase" },
      ],
    },
    {
      name: "Actions",
      icon: "Mail",
      blocks: [
        { type: "cta", name: "CTA", icon: "Sparkles", description: "Call to action" },
        { type: "form", name: "Form", icon: "Mail", description: "Contact form" },
        { type: "pricing", name: "Pricing", icon: "DollarSign", description: "Pricing table" },
      ],
    },
    {
      name: "Info",
      icon: "HelpCircle",
      blocks: [
        { type: "faq", name: "FAQ", icon: "HelpCircle", description: "FAQ accordion" },
        { type: "steps", name: "How It Works", icon: "List", description: "Step-by-step guide" },
        { type: "team", name: "Team", icon: "Users", description: "Team members" },
      ],
    },
  ];
};

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutTemplate,
  Type,
  Image,
  Images,
  Grid3X3,
  MessageSquareQuote,
  Sparkles,
  List,
  Mail,
  PlayCircle,
  BarChart3,
  Calendar,
  Star,
  DollarSign,
  Users,
  HelpCircle,
  Layout,
  MapPin,
  Clock,
  Check,
  FileUser,
  User,
  Briefcase,
  GraduationCap,
  FolderOpen,
  Award,
  Globe,
  Video,
  Palette,
  Code,
};

const templateIcons: Record<FullTemplateId, React.ComponentType<any>> = {
  template1: User,
  template2: Palette,
  template3: Code,
};

const templateColors: Record<FullTemplateId, string> = {
  template1: "from-slate-600 to-slate-800",
  template2: "from-teal-600 to-teal-800",
  template3: "from-emerald-600 to-gray-800",
};

const BlockPalette = ({ onAddBlock, onApplyResumeTemplate, websiteType }: BlockPaletteProps) => {
  const [showTemplates, setShowTemplates] = useState(true);
  const blockCategories = getBlockCategories(websiteType);
  const templates = fullTemplateOptions;
  
  return (
    <div className="space-y-6 pb-6">
      {/* Resume Template Selector - Only show for resume type */}
      {websiteType === "resume" && onApplyResumeTemplate && (
        <div className="border-b border-border pb-6">
          <div 
            className="flex items-center justify-between cursor-pointer mb-3"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <FileUser className="h-3 w-3" />
              Resume Templates
            </h3>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showTemplates ? "rotate-90" : ""}`} />
          </div>
          
          {showTemplates && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Choose a pre-filled template with professional sample data
              </p>
              {templates.map((template) => {
                const Icon = templateIcons[template.id];
                return (
                  <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onApplyResumeTemplate(template.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary hover:bg-primary/5 transition-colors text-left group"
                  >
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${templateColors[template.id]} flex items-center justify-center shrink-0`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground block">{template.name}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{template.category}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {blockCategories.map((category) => (
        <div key={category.name}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {category.name}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {category.blocks.map((block) => {
              const IconComponent = iconMap[block.icon] || Layout;
              return (
                <motion.button
                  key={block.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAddBlock(block.type)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-background hover:border-primary hover:bg-primary/5 transition-colors text-center group"
                >
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{block.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BlockPalette;
