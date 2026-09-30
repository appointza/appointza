export class OrganisationServices {
  id: number = 0
  prize: number = 0
  weekday_price: number = 0
  weekend_price: number = 0
  is_price_different: boolean = false
  timetaken: number = 0
  servicesids: OrganisationServices.ServicesidsData = new OrganisationServices.ServicesidsData()
  Iscombo: boolean = false
  offerprize: number = 0
  Servicename: string = ""
  code: string = ""
  version: number = 0
  show_price: boolean = true
  createdby: number = 0
  createdon: Date = new Date()
  modifiedby: number = 0
  modifiedon: Date = new Date()
  attributes: OrganisationServices.AttributesData = new OrganisationServices.AttributesData()
  isactive: boolean = false
  issuspended: boolean = false
  organisationid: number = 0
  organisationlocationid: number = 0
  isfactory: boolean = false
  rating: number | null = null
  notes: string = ""
}

export namespace OrganisationServices {
  
                export class ServicesidsData
                {
                  combolist: comboids[]=[];
                }  
                

                export class AttributesData
                {
                  ImageIds?: number[] = [];
                }  
                
}

export class comboids{
  id:number=0;
  servicename:string=""
}

export class OrganisationServicesSelectReq {
  id: number = 0;
  organisationid:number =0
  organisationlocationid: number = 0
  public_catalogue: boolean = false
  search: string = ""
  skip: number = 0
  take: number = 0
}

export class PublicServiceCatalogueItem extends OrganisationServices {
  organisationName: string = ""
  organisationLocationCity: string = ""
  organisationLocationState: string = ""
  organisationImageId: number = 0
}

export class OrganisationServicesDeleteReq {
  id: number = 0;
  version: number = 0;
}

export class OrganisationServicesHasAnyReq {
  organisationid: number = 0;
}