
export class Task {
  id: number = 0;
  title: string = "";
  description: string = "";
  status: string = "";
  priority: string = "";
  duedate: Date = new Date();
  assignedto: number = 0;
  createdby: number = 0;
  createdon: Date = new Date();
  modifiedby: number = 0;
  modifiedon: Date = new Date();
  isactive: boolean = true;
  organizationid: number = 0;
  userid: number = 0;
}

export class TaskSelectReq {
  id?: number;
  organizationid?: number;
  userid?: number;
  status?: string;
}

export class TaskDeleteReq {
  id: number = 0;
  version: number = 0;
}
