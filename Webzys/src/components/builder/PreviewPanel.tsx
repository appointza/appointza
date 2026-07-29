import { motion } from "framer-motion";
import { GripVertical, Trash2, Copy, Eye, EyeOff, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Block } from "@/types/builder";
import HeroBlock from "@/components/blocks/HeroBlock";
import HeaderBlock from "@/components/blocks/HeaderBlock";
import FooterBlock from "@/components/blocks/FooterBlock";
import SectionBlock from "@/components/blocks/SectionBlock";
import FeaturesBlock from "@/components/blocks/FeaturesBlock";
import BenefitsBlock from "@/components/blocks/BenefitsBlock";
import StatsBlock from "@/components/blocks/StatsBlock";
import TextBlock from "@/components/blocks/TextBlock";
import ImageBlock from "@/components/blocks/ImageBlock";
import ImageCarouselBlock from "@/components/blocks/ImageCarouselBlock";
import GalleryBlock from "@/components/blocks/GalleryBlock";
import VideoBlock from "@/components/blocks/VideoBlock";
import SocialMediaVideoBlock from "@/components/blocks/SocialMediaVideoBlock";
import CTABlock from "@/components/blocks/CTABlock";
import FormBlock from "@/components/blocks/FormBlock";
import PricingBlock from "@/components/blocks/PricingBlock";
import TestimonialBlock from "@/components/blocks/TestimonialBlock";
import ReviewsBlock from "@/components/blocks/ReviewsBlock";
import LogosBlock from "@/components/blocks/LogosBlock";
import FAQBlock from "@/components/blocks/FAQBlock";
import StepsBlock from "@/components/blocks/StepsBlock";
import TeamBlock from "@/components/blocks/TeamBlock";
import OrganizationInfoBlock from "@/components/blocks/appointza/OrganizationInfoBlock";
import LocationDetailsBlock from "@/components/blocks/appointza/LocationDetailsBlock";
import ServicesListBlock from "@/components/blocks/appointza/ServicesListBlock";
import ServiceTimingsBlock from "@/components/blocks/appointza/ServiceTimingsBlock";
import EventsListBlock from "@/components/blocks/appointza/EventsListBlock";
import ReviewsListBlock from "@/components/blocks/appointza/ReviewsListBlock";
import FacilitiesListBlock from "@/components/blocks/appointza/FacilitiesListBlock";
import LocationImagesBlock from "@/components/blocks/appointza/LocationImagesBlock";
// Resume blocks
import ResumeProfileBlock from "@/components/blocks/resume/ResumeProfileBlock";
import ResumeSummaryBlock from "@/components/blocks/resume/ResumeSummaryBlock";
import ResumeExperienceBlock from "@/components/blocks/resume/ResumeExperienceBlock";
import ResumeEducationBlock from "@/components/blocks/resume/ResumeEducationBlock";
import ResumeSkillsBlock from "@/components/blocks/resume/ResumeSkillsBlock";
import ResumeProjectsBlock from "@/components/blocks/resume/ResumeProjectsBlock";
import ResumeCertificationsBlock from "@/components/blocks/resume/ResumeCertificationsBlock";
import ResumeLanguagesBlock from "@/components/blocks/resume/ResumeLanguagesBlock";
import ResumeContactBlock from "@/components/blocks/resume/ResumeContactBlock";
import CustomHtmlBlock from "@/components/blocks/CustomHtmlBlock";
// Full Resume Templates
import FullResumePreview, { FullTemplateId } from "@/components/blocks/resume/FullResumePreview";

interface PreviewPanelProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  isPreviewMode: boolean;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onPageLinkClick?: (pageId: string) => void;
  pages?: Record<string, { id: string; name: string }>;
  // Full resume template support
  fullResumeTemplate?: FullTemplateId;
  fullResumeData?: any;
  onFullResumeDataChange?: (data: any) => void;
}

const PreviewPanel = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  isPreviewMode,
  onDeleteBlock,
  onDuplicateBlock,
  onToggleVisibility,
  onPageLinkClick,
  pages = {},
  fullResumeTemplate,
  fullResumeData,
  onFullResumeDataChange,
}: PreviewPanelProps) => {
  const renderBlock = (block: Block) => {
    if (!block.visible && isPreviewMode) return null;

    const blockContent = (() => {
      switch (block.type) {
        case "hero":
        case "hero-2":
        case "hero-3":
        case "hero-4":
        case "hero-5":
        case "hero-6":
          return <HeroBlock data={block.data} variant={block.type} onPageLinkClick={onPageLinkClick} pages={pages} />;
        case "section":
          return <SectionBlock data={block.data} onPageLinkClick={onPageLinkClick} pages={pages} />;
        case "header":
          return <HeaderBlock data={block.data} onPageLinkClick={onPageLinkClick} pages={pages} />;
        case "footer":
          return <FooterBlock data={block.data} onPageLinkClick={onPageLinkClick} pages={pages} />;
        case "features":
          return <FeaturesBlock data={block.data} />;
        case "benefits":
          return <BenefitsBlock data={block.data} />;
        case "stats":
          return <StatsBlock data={block.data} />;
        case "text":
          return <TextBlock data={block.data} />;
        case "image":
          return <ImageBlock data={block.data} />;
        case "image-carousel":
          return <ImageCarouselBlock data={block.data} />;
        case "gallery":
          return <GalleryBlock data={block.data} />;
        case "video":
          return <VideoBlock data={block.data} />;
        case "social-video":
          return <SocialMediaVideoBlock data={block.data} />;
        case "cta":
          return <CTABlock data={block.data} onPageLinkClick={onPageLinkClick} pages={pages} />;
        case "form":
          return <FormBlock data={block.data} />;
        case "pricing":
          return <PricingBlock data={block.data} />;
        case "testimonial":
          return <TestimonialBlock data={block.data} />;
        case "reviews":
          return <ReviewsBlock data={block.data} />;
        case "logos":
          return <LogosBlock data={block.data} />;
        case "faq":
          return <FAQBlock data={block.data} />;
        case "steps":
          return <StepsBlock data={block.data} />;
        case "team":
          return <TeamBlock data={block.data} />;
        case "appointza-organization":
          return <OrganizationInfoBlock data={block.data} />;
        case "appointza-location":
          return <LocationDetailsBlock data={block.data} />;
        case "appointza-services":
          return <ServicesListBlock data={block.data} />;
        case "appointza-timings":
          return <ServiceTimingsBlock data={block.data} />;
        case "appointza-events":
          return <EventsListBlock data={block.data} />;
        case "appointza-reviews":
          return <ReviewsListBlock data={block.data} />;
        case "appointza-facilities":
          return <FacilitiesListBlock data={block.data} />;
        case "appointza-location-images":
          return <LocationImagesBlock data={block.data} />;
        // Resume blocks
        case "resume-profile":
          return <ResumeProfileBlock data={block.data as any} />;
        case "resume-summary":
          return <ResumeSummaryBlock data={block.data as any} />;
        case "resume-experience":
          return <ResumeExperienceBlock data={block.data as any} />;
        case "resume-education":
          return <ResumeEducationBlock data={block.data as any} />;
        case "resume-skills":
          return <ResumeSkillsBlock data={block.data as any} />;
        case "resume-projects":
          return <ResumeProjectsBlock data={block.data as any} />;
        case "resume-certifications":
          return <ResumeCertificationsBlock data={block.data as any} />;
        case "resume-languages":
          return <ResumeLanguagesBlock data={block.data as any} />;
        case "resume-contact":
          return <ResumeContactBlock data={block.data as any} />;
        case "custom-html":
          return <CustomHtmlBlock data={block.data} />;
        // Full Resume Templates
        case "full-resume-template":
          return (
            <div id="resume-preview-container">
              <FullResumePreview templateId={block.data.templateId || "template1"} data={block.data.resumeData} />
            </div>
          );
        default:
          return (
            <div className="p-8 text-center text-muted-foreground bg-muted/50 rounded-lg">
              <p className="font-medium capitalize">{block.type} Block</p>
              <p className="text-sm">Click to edit</p>
            </div>
          );
      }
    })();

    if (isPreviewMode) {
      return blockContent;
    }

    return (
      <motion.div
        key={block.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: block.visible ? 1 : 0.5, y: 0 }}
        className={`group relative ${
          selectedBlockId === block.id
            ? "ring-2 ring-primary ring-offset-2"
            : "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2"
        } transition-all cursor-pointer`}
        onClick={() => onSelectBlock(block.id)}
      >
        {/* Block Controls */}
        <div className={`absolute -top-3 left-4 z-[100] flex items-center gap-1 transition-opacity ${
          selectedBlockId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg shadow-lg p-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-grab">
              <GripVertical className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground px-2 capitalize">
              {block.type}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(block.id);
              }}
            >
              {block.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateBlock(block.id);
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBlock(block.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {blockContent}
      </motion.div>
    );
  };

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            ➕
          </motion.div>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Start Building</h3>
        <p className="text-muted-foreground max-w-sm">
          Add blocks from the left sidebar to start building your page
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-full ${isPreviewMode ? "" : "py-8 px-4"}`}>
      <div
        className={`mx-auto ${
          isPreviewMode ? "" : "max-w-5xl bg-background rounded-xl shadow-xl overflow-hidden"
        }`}
      >
        <div className="space-y-0">{blocks.map((block) => renderBlock(block))}</div>
      </div>
    </div>
  );
};

export default PreviewPanel;
