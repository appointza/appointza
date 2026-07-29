export class LeaveDates {
  id: number = 0
  organizationlocationid: number = 0
  start_time: string = "00:00:00"  // TimeSpan format: HH:mm:ss
  end_time: string = "00:00:00"    // TimeSpan format: HH:mm:ss
  isfullday: boolean = false
  leaveon: Date = new Date()
  organizationid: number = 0
  version: number = 0
  createdby: number = 0
  createdon: Date = new Date()
  modifiedby: number = 0
  modifiedon: Date = new Date()
  attributes: LeaveDates.AttributesData = new LeaveDates.AttributesData()
  isactive: boolean = false
  issuspended: boolean = false
  parentid: number = 0
  isfactory: boolean = false
  notes: string = ""
}

export namespace LeaveDates {
  
                export class AttributesData
                {
                    
                }  
                
}

export class LeaveDatesSelectReq {
  id: number = 0;
  organizationid: number = 0;
  organizationlocationid: number = 0;
  leaveon: Date = new Date();
}

export class LeaveDatesDeleteReq {
  id: number = 0;
  version: number = 0;
}