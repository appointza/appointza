export class ReferenceValue {
  id: number = 0;
  identifier: string = '';
  displaytext: string = '';
  description: string = '';
  langcode: string = '';
  organizationid: number = 0;
  referencetypeid: number = 0;
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

export class ReferenceValueSelectReq {
  id: number = 0;
  parentid: number = 0;
  referencetypeid: number = 0;
  organisationid: number = 0;
  identifier: string = '';
}

export class ReferenceValueDeleteReq {
  id: number = 0;
  version: number = 0;
}

