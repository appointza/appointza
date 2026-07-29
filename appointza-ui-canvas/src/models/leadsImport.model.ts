import type { Enquiry } from "./enquiry.model";

export interface LeadsImportReq {
  email?: string;
  organisation_id?: number;
}

export interface OrganisationResolveRes {
  organisation_id: number;
  organisation_name: string;
  location_id: number;
  location_name: string;
  owner_user_id: number;
  owner_email: string;
  owner_name: string;
}

export interface ClientInfoRes {
  userid: number;
  username: string;
  mobile: string;
  city: string;
}

export interface LeadsImportRes {
  organisation: OrganisationResolveRes;
  leads: Enquiry[];
  customers: ClientInfoRes[];
}
