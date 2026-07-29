export class UsersLoginReq {
  mobile: string = '';
  otp: string = '';
}

export class UsersGetOtpReq {
  mobile: string = '';
}

export class UsersGetOtpRes {
  mobile: string = '';
  name: string = '';
}

export class UsersContext {
  userid: number = 0;
  usermobile: string = '';
  username: string = '';
  useremail: string = '';
  userimageid: number = 0;
  userpermission: UsersPermissionData = new UsersPermissionData();
  organisationid: number = 0;
  organisationname: string = '';
  organisationlocationid: number = 0;
  organisationlocationname: string = '';
  refreshtoken: string = '';
  accesstoken: string = '';
}

export class UsersPermissionData {
  createstaff: UsersPermissionGroupData = new UsersPermissionGroupData();
  creategroup: UsersPermissionGroupData = new UsersPermissionGroupData();
  approveusersingroup: UsersPermissionGroupData = new UsersPermissionGroupData();
  createmessage: UsersPermissionGroupData = new UsersPermissionGroupData();
  createtask: UsersPermissionGroupData = new UsersPermissionGroupData();
  dashboard: UsersPermissionGroupData = new UsersPermissionGroupData();
  approveappoinment: UsersPermissionGroupData = new UsersPermissionGroupData();
  manageservices: UsersPermissionGroupData = new UsersPermissionGroupData();
  managelocations: UsersPermissionGroupData = new UsersPermissionGroupData();
  viewcustomers: UsersPermissionGroupData = new UsersPermissionGroupData();
  managecustomers: UsersPermissionGroupData = new UsersPermissionGroupData();
  viewreports: UsersPermissionGroupData = new UsersPermissionGroupData();
  viewpayments: UsersPermissionGroupData = new UsersPermissionGroupData();
  processrefunds: UsersPermissionGroupData = new UsersPermissionGroupData();
}

export class UsersPermissionGroupData {
  view: boolean = false;
  manage: boolean = false;
}

export class Organisation {
  id: number = 0;
  name: string = '';
  gstnumber: string = '';
  tagline: string = '';
  imageid: number = 0;
  organisationlogo: number = 0;
  isactive: boolean = false;
  issuspended: boolean = false;
}

export class OrganisationLocation {
  id: number = 0;
  organisationid: number = 0;
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
}

export class UserDetailsWithOrganisationRes {
  user: Users = new Users();
  organisation: Organisation | null = null;
  locations: OrganisationLocation[] = [];
}

export class Users {
  id: number = 0;
  name: string = '';
  email: string = '';
  mobile: string = '';
  mobilecountrycode: string = '';
  designation: string = '';
  organisationid: number = 0;
  locationid: number = 0;
  profileimage: number = 0;
  isactive: boolean = false;
  issuspended: boolean = false;
  isverified: boolean = false;
  accountactive: boolean = false;
  // List of media IDs associated with the user
  media: number[] = [];
}

