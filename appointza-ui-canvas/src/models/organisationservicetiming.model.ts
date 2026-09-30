export class OrganisationServiceTiming {
  id: number = 0;
  start_time: string | Date = '';
  end_time: string | Date = '';
  day_of_week: number = 0;
  organisationid: number = 0;
  organisationlocationid: number = 0;
  counter: number = 0;
  openbefore: number = 0;
  version: number = 0;
  createdby: number = 0;
  createdon: Date = new Date();
  modifiedby: number = 0;
  modifiedon: Date = new Date();
  attributes: any = {};
  isactive: boolean = true;
  issuspended: boolean = false;
  isfactory: boolean = false;
  notes: string = '';
  localid?: number; // For local state management
}

export class OrganisationServiceTimingSelectReq {
  id: number = 0;
  organisationid: number = 0;
  organisationlocationid: number = 0;
  day_of_week: number = 0;
  appointmentdate: Date = new Date();
}

export class OrganisationServiceTimingDeleteReq {
  id: number = 0;
  organisationid: number = 0;
  organizationlocationid: number = 0;
}

export class OrganisationServiceTimingSlotReq {
  day_of_week: number = 0;
  start_time: string = "";
  end_time: string = "";
}

export class OrganisationServiceTimingBulkSaveReq {
  organisationid: number = 0;
  organisationlocationid: number = 0;
  counter: number = 0;
  openbefore: number = 0;
  slots: OrganisationServiceTimingSlotReq[] = [];
}

export class OrganisationServiceTimingHasAnyReq {
  organisationid: number = 0;
}

export class OrganisationServiceTimingFinal {
  id: number = 0;
  localid: number = 0;
  start_time: string = '';
  end_time: string = '';
  day_of_week: number = 0;
  organisationid: number = 0;
  organisationlocationid: number = 0;
  counter: number = 0;
  openbefore: number = 0;
  version: number = 0;
  createdby: number = 0;
  createdon: Date = new Date();
  modifiedby: number = 0;
  modifiedon: Date = new Date();
  attributes: any = {};
  isactive: boolean = true;
  issuspended: boolean = false;
  isfactory: boolean = false;
  notes: string = '';
}

export class Leavereq {
  id: number = 0;
  organisationid: number = 0;
  organisationlocationid: number = 0;
  appointmentdate: Date | null = null;
  start_time: string = ''; // TimeSpan as string (HH:mm:ss format)
  end_time: string = ''; // TimeSpan as string (HH:mm:ss format)
  isfullday: boolean = false;
  isforce: boolean = false;
}

export enum Weeks {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7
}

export class CalendarOverviewReq {
  organisationid: number = 0;
  organisationlocationid: number = 0;
  year: number = 0;
  month: number = 0;
}

export class CalendarSlotOverviewItem {
  fromtime: string = "";
  totime: string = "";
  statuscode: string = "";
  notes: string = "";
  remaining: number = 0;
  capacity: number = 0;
  is_within_booking_window: boolean = true;
}

export class CalendarBookingOverviewItem {
  id: number = 0;
  username: string = "";
  mobile: string = "";
  fromtime: string = "";
  totime: string = "";
  statuscode: string = "";
  servicenames: string = "";
}

export class CalendarDayOverview {
  date: Date | string = new Date();
  slots: CalendarSlotOverviewItem[] = [];
  bookings: CalendarBookingOverviewItem[] = [];
  available_count: number = 0;
  booked_slot_count: number = 0;
}

export class CalendarOverviewRes {
  days: CalendarDayOverview[] = [];
}