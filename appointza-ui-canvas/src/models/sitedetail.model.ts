
  export class LocationDetail {
    id: number = 0;
    organisationid: number = 0;
    name: string = "";
    addressline1: string = "";
    addressline2: string = "";
    city: string = "";
    state: string = "";
    country: string = "";
    latitude: number = 0;
    longitude: number = 0;
    googlelocation: string = "";
    pincode: string = "";
    customurl: string = "";
    whatsapp_mobile: string = "";
    templateid: number = 0;
    version: number = 0;
    createdby: number = 0;
    createdon: Date = new Date();
    modifiedby: number = 0;
    modifiedon: Date = new Date();
    images: number[] = [];
    attributes: any = {};
    isactive: boolean = false;
    issuspended: boolean = false;
    parentid: number = 0;
    isfactory: boolean = false;
    notes: string = "";
  }
  
  export class OrganisationDetail {
    id: number = 0;
    name: string = "";
    gstnumber: string = "";
    secondarytypecode: string = "";
    secondarytype: number = 0;
    primarytype: number = 0;
    imageid: number = 0;
    organisationlogo: number = 0;
    tagline: string = "";
    primarytypecode: string = "";
    version: number = 0;
    createdby: number = 0;
    createdon: Date = new Date();
    modifiedby: number = 0;
    modifiedon: Date = new Date();
    attributes: any = {};
    isactive: boolean = false;
    issuspended: boolean = false;
    parentid: number = 0;
    isfactory: boolean = false;
    notes: string = "";
  }
  
  export class OrganisationService {
    id: number = 0;
    prize: number = 0;
    timetaken: number = 0;
    servicesids: {
      combolist: any[];
    } = { combolist: [] };
    Iscombo: boolean = false;
    offerprize: number = 0;
    Servicename: string = "";
    code: string = "";
    version: number = 0;
    createdby: number = 0;
    createdon: Date = new Date();
    modifiedby: number = 0;
    modifiedon: Date = new Date();
    attributes: any = {};
    isactive: boolean = false;
    issuspended: boolean = false;
    organisationid: number = 0;
    isfactory: boolean = false;
    notes: string = "";
  }
  
  export class OrganisationServiceTiming {
    id: number = 0;
    organisationid: number = 0;
    day_of_week: number = 0;
    start_time: string = "";
    end_time: string = "";
    version: number = 0;
    createdby: number = 0;
    createdon: Date = new Date();
    modifiedby: number = 0;
    modifiedon: Date = new Date();
    counter: number = 0;
    openbefore: number = 0;
    attributes: any = {};
    isactive: boolean = false;
    issuspended: boolean = false;
    organisationlocationid: number = 0;
    isfactory: boolean = false;
    notes: string = "";
  }
  
  export class SiteDetailsItem {
    locationdetail: LocationDetail = new LocationDetail();
    organisationdetail: OrganisationDetail = new OrganisationDetail();
    orgnaisatinservice: OrganisationService[] = [];
    OrganisationServiceTiming: OrganisationServiceTiming[] = [];
    template_html: string = "";
  }
  
  export class SiteDetailsSelectReq {
    id: number = 0;
    organisationid: number = 0;
    locationid: number = 0;
  }
  