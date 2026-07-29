export interface TemplateData {
  organizationName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  services: ServiceData[];
  businessHours: BusinessHour[];
  description: string;
  gstNumber: string;
  website: string;
  socialMedia: SocialMediaLinks;
}

export interface ServiceData {
  name: string;
  description: string;
  price: number;
  offerPrice?: number;
  duration: number;
  isCombo: boolean;
  comboServices?: string[];
}

export interface BusinessHour {
  day: string;
  startTime: string;
  endTime: string;
  isClosed: boolean;
}

export interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export interface TemplateResponse {
  templateHtml: string;
  data: TemplateData;
}