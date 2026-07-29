
export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  isactive: boolean;
  previewImage?: string;
}

export type TemplateType = "appointza-booking" | "medical-clinic" | "beauty-salon" | "restaurant" | "fitness-center" | "legal-services" | "educational-services" | "classic" | "modern" | "minimalist";
