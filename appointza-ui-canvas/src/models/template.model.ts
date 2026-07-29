export class Template {
  id: number = 0;
  organisationid: number = 0;
  organisationlocationid: number | null = null;
  htmltemplate: string = "";
  created_on: Date = new Date();
  modified_on: Date | null = null;
}

export class TemplateSelectReq {
  id: number = 0;
  organisationid: number = 0;
  organisationlocationid: number | null = null;
}

export class TemplateDeleteReq {
  id: number = 0;
  organisationid: number = 0;
}
