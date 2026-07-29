export class AdminGetAllOrganisationsReq {
  PageNumber: number = 1;
  PageSize: number = 10;
  SearchTerm: string = '';
  IsActive: boolean | null = null;
  IsVerified: boolean | null = null;
}

export class AdminOrganisationLocation {
  id: number = 0;
  name: string = '';
  addressline1: string = '';
  addressline2: string = '';
  city: string = '';
  state: string = '';
  country: string = '';
  pincode: string = '';
  latitude: number = 0;
  longitude: number = 0;
  googlelocation: string = '';
  createdon: Date = new Date();
  isactive: boolean = false;
  isverified: boolean = false;
  organisationid: number = 0;
  organisationname: string = '';
  organisationgstnumber: string = '';
  organisationprimarytypecode: string = '';
  organisationsecondarytypecode: string = '';
  organisationmobile: string = '';
  usermobile: string = '';
}

export class AdminToggleLocationVerificationReq {
  LocationId: number = 0;
  IsVerified: boolean = false;
}

export class AdminDeleteLocationReq {
  LocationId: number = 0;
}

export class AdminActivateLocationReq {
  LocationId: number = 0;
}

export class AdminOrganizationLocationStats {
  TotalOrganizations: number = 0;
  TotalLocations: number = 0;
  VerifiedLocations: number = 0;
  NotVerifiedLocations: number = 0;
  RejectedLocations: number = 0;
}

export class AppointmentStatusCount {
  StatusCode: string = '';
  Count: number = 0;
}

export class AdminAppointmentStats {
  TotalAppointments: number = 0;
  StatusCounts: AppointmentStatusCount[] = [];
}

export class AdminAppointmentStatsReq {
  FromDate?: Date | null = null;
  ToDate?: Date | null = null;
  SingleDate?: Date | null = null;
  OrganisationLocationId?: number | null = null;
}

export class AdminGetAllUsersReq {
  PageNumber: number = 1;
  PageSize: number = 1000;
  SearchTerm: string = '';
  IsActive: boolean | null = null;
  OrganisationId?: number | null = null;
}

export class User {
  id: number = 0;
  name: string = '';
  email: string = '';
  mobile: string = '';
  mobilecountrycode: string = '';
  designation: string = '';
  organisationid: number = 0;
  locationid: number = 0;
  profileimage: number = 0;
  version: number = 0;
  createdby: number = 0;
  createdon: Date = new Date();
  modifiedby: number = 0;
  modifiedon: Date = new Date();
  isactive: boolean = false;
  issuspended: boolean = false;
  parentid: number = 0;
  isfactory: boolean = false;
  notes: string = '';
  isverified: boolean = false;
  accountactive: boolean = false;
  push_token: string = '';
}

