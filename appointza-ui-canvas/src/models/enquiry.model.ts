export interface Enquiry {
  id: number;
  name: string;
  email: string;
  mobile: string;
  message: string;
  organisation_id: number;
  created_by: number;
  notes: string;
  status: string;
  source: string;
  is_active: boolean;
  ip_address: string;
  created_at: string;
  updated_at: string;
}

export interface EnquirySelectReq {
  id: number;
  organisation_id: number;
  status: string;
  source: string;
  is_active: boolean | null;
}

export interface EnquiryDeleteReq {
  id: number;
}

