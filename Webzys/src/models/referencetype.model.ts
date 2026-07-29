export class ReferenceType {
  id: number = 0;
  identifier: string = '';
  displaytext: string = '';
  langcode: string = '';
  organizationid: number = 0;
  version: number = 0;
  createdby: number = 0;
  createdon: string = '';
  modifiedby: number = 0;
  modifiedon: string = '';
  attributes: any = null;
  isactive: boolean = true;
  issuspended: boolean = false;
  parentid: number = 0;
  isfactory: boolean = false;
  notes: string = '';
}

export class ReferenceTypeSelectReq {
  id: number = 0;
  referencetypeid: number = 0;
  parentid: number = 0;
  identifier: string = '';
}

export class ReferenceTypeDeleteReq {
  id: number = 0;
  version: number = 0;
}

