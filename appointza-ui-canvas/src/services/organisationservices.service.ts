import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  OrganisationServices,
  OrganisationServicesDeleteReq,
  OrganisationServicesSelectReq,
  PublicServiceCatalogueItem,
} from '../models/organisationservices.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class OrganisationServicesService {
    http: AxiosHelperUtils;
    
    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/OrganisationServices';
    }

    async select(req: OrganisationServicesSelectReq) {
        let postdata: ActionReq<OrganisationServicesSelectReq> = new ActionReq<OrganisationServicesSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationServices>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }

    async selectPublicCatalogue(req: OrganisationServicesSelectReq) {
        const postdata: ActionReq<OrganisationServicesSelectReq> = new ActionReq<OrganisationServicesSelectReq>();
        postdata.item = req;
        const resp = await this.http.post<ActionRes<Array<PublicServiceCatalogueItem>>>(
            this.baseurl + '/SelectPublicCatalogue',
            postdata
        );
        return resp.item;
    }

    async save(req: OrganisationServices) {
        let postdata: ActionReq<OrganisationServices> = new ActionReq<OrganisationServices>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServices>>(
            this.baseurl + '/save',
            postdata
        );
        return resp.item;
    }

    async insert(req: OrganisationServices) {
        let postdata: ActionReq<OrganisationServices> = new ActionReq<OrganisationServices>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServices>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item;
    }

    async update(req: OrganisationServices) {
        let postdata: ActionReq<OrganisationServices> = new ActionReq<OrganisationServices>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServices>>(
            this.baseurl + '/update',
            postdata
        );
        return resp.item;
    }

    async delete(req: OrganisationServicesDeleteReq) {
        let postdata: ActionReq<OrganisationServicesDeleteReq> = new ActionReq<OrganisationServicesDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item;
    }
}
