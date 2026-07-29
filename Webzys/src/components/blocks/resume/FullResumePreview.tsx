// Full Resume Preview - Renders complete resume templates
import FullResumeTemplate1, { template1SampleData, ResumeTemplate1Data } from "./FullResumeTemplate1";
import FullResumeTemplate2, { template2SampleData, ResumeTemplate2Data } from "./FullResumeTemplate2";
import FullResumeTemplate3, { template3SampleData, ResumeTemplate3Data } from "./FullResumeTemplate3";

export type FullTemplateId = "template1" | "template2" | "template3";

export interface FullTemplateOption {
  id: FullTemplateId;
  name: string;
  description: string;
  category: string;
  previewColor: string;
}

export const fullTemplateOptions: FullTemplateOption[] = [
  {
    id: "template1",
    name: "Classic Professional",
    description: "Traditional single-column layout, ATS-friendly, ideal for corporate roles",
    category: "Corporate / Executive / Traditional",
    previewColor: "from-slate-600 to-slate-800",
  },
  {
    id: "template2",
    name: "Creative Sidebar",
    description: "Modern two-column with photo sidebar, great for designers & creatives",
    category: "Designer / Creative / Marketing",
    previewColor: "from-teal-600 to-teal-800",
  },
  {
    id: "template3",
    name: "Tech Minimal",
    description: "Code-inspired layout with project focus, perfect for developers",
    category: "Developer / Engineer / Technical",
    previewColor: "from-emerald-600 to-gray-800",
  },
];

export const getFullTemplateSampleData = (templateId: FullTemplateId) => {
  switch (templateId) {
    case "template1":
      return template1SampleData;
    case "template2":
      return template2SampleData;
    case "template3":
      return template3SampleData;
    default:
      return template1SampleData;
  }
};

interface FullResumePreviewProps {
  templateId: FullTemplateId;
  data?: ResumeTemplate1Data | ResumeTemplate2Data | ResumeTemplate3Data;
  isEditing?: boolean;
  onFieldChange?: (path: string, value: any) => void;
}

const FullResumePreview = ({ templateId, data, isEditing, onFieldChange }: FullResumePreviewProps) => {
  const templateData = data || getFullTemplateSampleData(templateId);

  switch (templateId) {
    case "template1":
      return (
        <FullResumeTemplate1 
          data={templateData as ResumeTemplate1Data} 
          isEditing={isEditing}
          onFieldChange={onFieldChange}
        />
      );
    case "template2":
      return (
        <FullResumeTemplate2 
          data={templateData as ResumeTemplate2Data} 
          isEditing={isEditing}
          onFieldChange={onFieldChange}
        />
      );
    case "template3":
      return (
        <FullResumeTemplate3 
          data={templateData as ResumeTemplate3Data} 
          isEditing={isEditing}
          onFieldChange={onFieldChange}
        />
      );
    default:
      return (
        <FullResumeTemplate1 
          data={templateData as ResumeTemplate1Data} 
          isEditing={isEditing}
          onFieldChange={onFieldChange}
        />
      );
  }
};

export default FullResumePreview;
