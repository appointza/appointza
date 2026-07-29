export class Appoinment {
  id: number = 0
  userid: number = 0
  organizationid: number = 0
  fromtime: Date = new Date()
  totime: Date = new Date()
  appoinmentdate: Date = new Date()
  status: number = 0
  statuscode: string = ""
  version: number = 0
  createdby: number = 0
  createdon: Date = new Date()
  modifiedby: number = 0
  modifiedon: Date = new Date()
  attributes: Appoinment.AttributesData = new Appoinment.AttributesData()
  isactive: boolean = false
  issuspended: boolean = false
  organisationlocationid: number = 0
  isfactory: boolean = false
  notes: string = ""
  staffid: number = 0;
  staffname: string = "";
  ispaid: boolean = false;
  fileid: { files: FileItem[] } = { files: [] };     // File references
  tasklist: { tasks: TaskItem[] } = { tasks: [] };  // List of tasks with TaskItem structure
  resheduledate: Date = new Date();                  // Rescheduled date
  ishasreshedule: boolean = false;                   // Has reschedule flag
}

export namespace Appoinment {
  
                export class AttributesData
                {

                   servicelist: SelectedSerivice[]=[];
                    
                }  
                
}

export class AppoinmentFinal {
  id: number = 0
  userid: number = 0
  organizationid: number = 0
  fromtime: string = ""
  totime: string = ""
  appoinmentdate: Date = new Date()
  status: number = 0
  statuscode: string = ""
  version: number = 0
  createdby: number = 0
  createdon: Date = new Date()
  modifiedby: number = 0
  modifiedon: Date = new Date()
  attributes: Appoinment.AttributesData = new Appoinment.AttributesData()
  isactive: boolean = false
  issuspended: boolean = false
  organisationlocationid: number = 0
  isfactory: boolean = false
  notes: string = ""
  staffid: number = 0;
  staffname: string = "";
  ispaid: boolean = false;
  fileid: { files: FileItem[] } = { files: [] };     // File references
  tasklist: { tasks: TaskItem[] } = { tasks: [] };  // List of tasks with TaskItem structure
  resheduledate: Date = new Date();                  // Rescheduled date
  ishasreshedule: boolean = false;                   // Has reschedule flag
}

export class SelectedSerivice{
  id:number=0;
  servicename:string=""
  serviceprice:number=0
  servicetimetaken:number =0
  iscombo:boolean=false
}

export class TaskItem {
  id: number = 0;
  taskname: string = "";
  description: string = "";
  iscompleted: boolean = false;
  completedon: Date | null = null;
  completedby: string = "";
  priority: number = 0;
  datatype: string = "";  // Data type from reference value (string, number, boolean, etc.)
  value: any = null;      // Actual value based on data type
}

export class FileItem {
  id: number = 0;
  filename: string = "";
  filepath: string = "";
  filetype: string = "";
  filesize: number = 0;
  uploadedon: Date = new Date();
  uploadedby: string = "";
}

export class AppoinmentSelectReq {
  id: number = 0;
  organisationid: number = 0
  organisationlocationid: number = 0
  userid:number =0
  appointmentdate ?:Date ;
}

export class AppoinmentDeleteReq {
  id: number = 0;
  version: number = 0;
}

export class BookedAppoinmentRes extends Appoinment {
  // From joined users table
  username: string = '';
  mobile: string = '';

  // From joined organisation table
  organisationname: string = '';
  secondarytypecode: string = '';
  primarytypecode: string = '';

  // From joined organisationlocation table
  city: string = '';
}

export class AddStaffReq {
  appoinmentid: number=0;
  staffname: string='';
  staffid: number=0;
  organisationid: number=0;
  organisationlocationid: number=0;
}

export class UpdateStatusReq {
  appoinmentid: number =0;
  statuscode: string ='';
  statustype: string ='';
  statusid: number =0;
  organisationid: number =0;
  organisationlocationid: number =0;
}

export class UpdatePaymentReq {
  appoinmentid: number=0;
  paymentname: string = '';
  paymentcode: string = '';
  paymenttype: string = '';
  paymenttypeid: number=0;
  statusid: number=0;
  customername: string = '';
  customerid: number=0;
  amount: number=0;
  organisationid: number=0;
  organisationlocationid: number=0;
}

export class SearchAppointmentByMobileReq {
  organisationid: number = 0;
  mobilenumber: string = "";
}

export class ClientsSelectReq {
  organisationid: number = 0;
  organisationlocationid: number = 0;
  mobilenumber: string = "";
}

export class ClientInfoRes {
  userid: number = 0;
  username: string = "";
  mobile: string = "";
  city: string = "";
}