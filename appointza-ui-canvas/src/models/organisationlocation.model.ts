export class OrganisationLocation {
  id: number = 0;
  name: string = '';
  address: string = '';
  organisationid: number = 0;
  isactive: boolean = true;
  version: number = 0;
  createdby: number = 0;
  createdon: Date = new Date();
  modifiedby: number = 0;
  modifiedon: Date = new Date();
  attributes: {
    video_urls?: string[];
    [key: string]: unknown;
  } = {};
  issuspended: boolean = false;
  isfactory: boolean = false;
  notes: string = '';
  images?: number[] = [];
  facility_list?: number[] = [];
  addressline1?: string = '';
  addressline2?: string = '';
  city?: string = '';
  state?: string = '';
  country?: string = '';
  pincode?: string = '';
  latitude?: number = 0;
  longitude?: number = 0;
  googlelocation?: string = '';
  geolocation_url?: string = '';
  customurl?: string = '';
  orgloctempid?: string = '';
  templateid?: number = 0;
  isverified?: boolean = false;
  isPaymentRequired?: boolean = false;
  email?: string = '';
  whatsapp_mobile?: string = '';
}

export class OrganisationLocationSelectReq {
  id: number = 0;
  organisationid: number = 0;
  organisationlocationid: number = 0;
  orgloctempid: string = '';
}

export class OrganisationLocationDeleteReq {
  id: number = 0;
  organisationid: number = 0;
}

export class OrganisationLocationStaffReq {
  organisationid: number = 0;
  organisationlocationid: number = 0;
}

export class OrganisationLocationStaffRes {
  id: number = 0;
  name: string = '';
  email: string = '';
  mobile: string = '';
}

export class OrgLocationStaffRequest {
  organisationid: number = 0;
  organisationlocationid: number = 0;
}

export class OrgLocationStaffResponse {
  BusinessName: string = '';
  StreetName: string = '';
  Area: string = '';
  City: string = '';
  State: string = '';
  PostalCode: string = '';
  Services: Service[] = [];
  Timings: Timing[] = [];
}

export class Service {
  ServiceName: string = '';
  Price: number = 0;
  OfferPrice: number = 0;
  Duration: number = 0; // Duration in minutes
}

export class Timing {
  Day: number = 0; // Day of the week (1 = Monday, 2 = Tuesday, etc.)
  StartTime: string = ''; // Changed from TimeSpan to string for TypeScript
  EndTime: string = ''; // Changed from TimeSpan to string for TypeScript
}

export class UsersGenerateQRCodeReq {
  organisationid: number = 0;
  organisationlocationid: number = 0;
}

export class UsersGenerateQRCodeRes {
  qrcode: string = '';
  qrcodeurl: string = '';
}

export class OrgLocationReq {
  orglocid: number = 0;
}

export class PaymentSummary {
  paymentmodetype: string = '';
  totalamount: number = 0;
}

export class AppointmentPaymentsummary {
  totalappointments: number = 0;
  confirmedcount: number = 0;
  completedcount: number = 0;
  paymentsummary: PaymentSummary[] = [];
}

export class OrganisationDashboardTrendPoint {
  name: string = '';
  date: string = '';
  appointments: number = 0;
}

export class OrganisationDashboardStatusPoint {
  name: string = '';
  value: number = 0;
}

export class OrganisationDashboardRevenueWeekPoint {
  name: string = '';
  revenue: number = 0;
}

export class OrganisationDashboardStats {
  totalappointments: number = 0;
  confirmedcount: number = 0;
  completedcount: number = 0;
  pendingcount: number = 0;
  cancelledcount: number = 0;
  totalrevenue: number = 0;
  trend_last_7_days: OrganisationDashboardTrendPoint[] = [];
  status_breakdown: OrganisationDashboardStatusPoint[] = [];
  revenue_by_week_this_month: OrganisationDashboardRevenueWeekPoint[] = [];
}

export class UpdateLocationTemplateIdReq {
  organisationlocationid: number = 0;
  templateid: number = 0;
}

export class UpdateLocationMediaReq {
  organisationid: number = 0;
  organisationlocationid: number = 0;
  images: number[] = [];
  video_urls: string[] = [];
}

export class CustomUrlAvailabilityReq {
  customurl: string = '';
  organisationlocationid: number = 0;
}

export class CustomUrlAvailabilityRes {
  available: boolean = false;
  normalized_slug: string = '';
  message: string = '';
}