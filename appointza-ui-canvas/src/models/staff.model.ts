export class Staff {
  id: number = 0
  userid: number = 0
  organisationid: number = 0
  roles: UsersPermissionData = new UsersPermissionData();
  image: number = 0
  version: number = 0
  createdby: number = 0
  createdon: Date = new Date()
  modifiedby: number = 0
  modifiedon: Date = new Date()
  attributes: Staff.AttributesData = new Staff.AttributesData()
  isactive: boolean = false
  issuspended: boolean = false
  organisationlocationid: number = 0
  isfactory: boolean = false
  notes: string = ""
}

export namespace Staff {
  
                export class RolesData
                {
                    
                }  
                

                export class AttributesData
                {
                    
                }  
                
}

export class UsersPermissionData {
  // New editandview privileges (single boolean for each)
  editandviewDashboard: boolean = false;
  editandviewAppointments: boolean = false;
  editandviewEvents: boolean = false;
  editandviewCreateService: boolean = false;
  editandviewCreateEvent: boolean = false;
  editandviewClients: boolean = false;
  editandviewBusinessHours: boolean = false;
  editandviewStaffManagement: boolean = false;
  editandviewLocationManagement: boolean = false;
  editandviewTemplates: boolean = false;
  editandviewPaymentSettings: boolean = false;
  editandviewBusinessvalues: boolean = false;
}

export class UsersPermissionGroupData {
  view: boolean = false;
  manage: boolean = false;
}

export class StaffSelectReq {
  id: number = 0;
  userid: number = 0;
  organisationid: number = 0;
  organisationlocationid: number = 0;
}

export class StaffDeleteReq {
  id: number = 0;
  version: number = 0;
}

export class StaffUser extends Staff {
 name : string = ""
 email : string = ""
 mobile : string = ""
 mobilecountrycode : string = ""
 designation : string = ""

 locationname : string = ""
 addressline1 : string = ""
 addressline2 : string = ""
 city : string = ""
 state: string = "" 
 country : string = ""
}