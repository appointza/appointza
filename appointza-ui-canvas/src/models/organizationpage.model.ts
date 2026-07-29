export interface OrganizationPageLocationDetail {
  id: number;
  organisationid: number;
  name: string;
  addressline1: string;
  addressline2: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  googlelocation: string;
  pincode: string;
  version: number;
  createdby: number;
  createdon: string;
  modifiedby: number;
  modifiedon: string;
  images: number[];
  attributes: Record<string, any>;
  isactive: boolean;
  issuspended: boolean;
  parentid: number;
  isfactory: boolean;
  notes: string;
}

export interface OrganizationPageOrganisationDetail {
  id: number;
  name: string;
  gstnumber: string;
  secondarytypecode: string;
  secondarytype: number;
  primarytype: number;
  imageid: number;
  organisationlogo: number;
  tagline: string;
  primarytypecode: string;
  version: number;
  createdby: number;
  createdon: string;
  modifiedby: number;
  modifiedon: string;
  attributes: Record<string, any>;
  isactive: boolean;
  issuspended: boolean;
  parentid: number;
  isfactory: boolean;
  notes: string;
}

export interface ServiceComboItem {
  id: number;
  servicename: string;
}

export interface OrganizationPageService {
  id: number;
  prize: number;
  timetaken: number;
  servicesids: {
    combolist: ServiceComboItem[];
  };
  Iscombo: boolean;
  offerprize: number;
  Servicename: string;
  code: string;
  version: number;
  createdby: number;
  createdon: string;
  modifiedby: number;
  modifiedon: string;
  attributes: Record<string, any>;
  isactive: boolean;
  issuspended: boolean;
  organisationid: number;
  isfactory: boolean;
  notes: string;
}

export interface TimeSpan {
  Ticks: number;
  Days: number;
  Hours: number;
  Milliseconds: number;
  Minutes: number;
  Seconds: number;
  TotalDays: number;
  TotalHours: number;
  TotalMilliseconds: number;
  TotalMinutes: number;
  TotalSeconds: number;
}

export interface OrganizationPageServiceTiming {
  id: number;
  organisationid: number;
  day_of_week: number;
  start_time: TimeSpan;
  end_time: TimeSpan;
  version: number;
  createdby: number;
  createdon: string;
  modifiedby: number;
  modifiedon: string;
  counter: number;
  openbefore: number;
  attributes: Record<string, any>;
  isactive: boolean;
  issuspended: boolean;
  organisationlocationid: number;
  isfactory: boolean;
  notes: string;
}

export interface OrganizationPageData {
  locationdetail: OrganizationPageLocationDetail;
  organisationdetail: OrganizationPageOrganisationDetail;
  orgnaisatinservice: OrganizationPageService[];
  OrganisationServiceTiming: OrganizationPageServiceTiming[];
}

export interface OrganizationPageResponse {
  item: OrganizationPageData[];
}