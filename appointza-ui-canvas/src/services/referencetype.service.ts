import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  ReferenceType,
  ReferenceTypeDeleteReq,
  ReferenceTypeSelectReq,
} from '../models/referencetype.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class ReferenceTypeService {
    http: AxiosHelperUtils;
    
    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/ReferenceType';
    }

    async select(req: ReferenceTypeSelectReq) {
        let postdata: ActionReq<ReferenceTypeSelectReq> = new ActionReq<ReferenceTypeSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<ReferenceType>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }

    async save(req: ReferenceType) {
        let postdata: ActionReq<ReferenceType> = new ActionReq<ReferenceType>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<ReferenceType>>(
            this.baseurl + '/save',
            postdata
        );
        return resp.item;
    }

    async insert(req: ReferenceType) {
        let postdata: ActionReq<ReferenceType> = new ActionReq<ReferenceType>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<ReferenceType>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item;
    }

    async update(req: ReferenceType) {
        let postdata: ActionReq<ReferenceType> = new ActionReq<ReferenceType>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<ReferenceType>>(
            this.baseurl + '/update',
            postdata
        );
        return resp.item;
    }

    async delete(req: ReferenceTypeDeleteReq) {
        let postdata: ActionReq<ReferenceTypeDeleteReq> = new ActionReq<ReferenceTypeDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item;
    }
}
