import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  ReferenceValue,
  ReferenceValueDeleteReq,
  ReferenceValueSelectReq,
} from '../models/referencevalue.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

/** Server JSON uses lowercase names with PropertyNamingPolicy=null; ReferenceValueSelectReq only binds `organisationid` (UK). */
function toReferenceValueSelectBody(req: ReferenceValueSelectReq): ReferenceValueSelectReq {
    const organisationid =
        req.organisationid > 0
            ? req.organisationid
            : req.organizationid > 0
              ? req.organizationid
              : 0;
    return {
        id: req.id ?? 0,
        parentid: req.parentid ?? 0,
        referencetypeid: req.referencetypeid ?? 0,
        organisationid,
        organizationid: req.organizationid ?? organisationid,
        identifier: req.identifier ?? '',
    };
}

export class ReferenceValueService {
    baseurl: string;
    http: AxiosHelperUtils;
    constructor() {
        this.baseurl = environment.baseurl + '/api/ReferenceValue';
        this.http = new AxiosHelperUtils();
    }
    async select(req: ReferenceValueSelectReq) {
        let postdata: ActionReq<ReferenceValueSelectReq> =
            new ActionReq<ReferenceValueSelectReq>();
        postdata.item = toReferenceValueSelectBody(req);
        let resp = await this.http.post<ActionRes<Array<ReferenceValue>>>(
            this.baseurl + '/select', 
            postdata
        );
        const raw = resp as unknown as { item?: ReferenceValue[]; Item?: ReferenceValue[] };
        const list = raw?.item ?? raw?.Item;
        return Array.isArray(list) ? list : [];
    }
    async save(req: ReferenceValue) {
        let postdata: ActionReq<ReferenceValue> = new ActionReq<ReferenceValue>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<ReferenceValue>>(
            this.baseurl + '/save',
            postdata
        );
                
        return resp.item;
    }
    async insert(req: ReferenceValue) {
        let postdata: ActionReq<ReferenceValue> = new ActionReq<ReferenceValue>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<ReferenceValue>>(
            this.baseurl + '/insert',
            postdata
        );
                
        return resp.item;
    }
    async update(req: ReferenceValue) {
        let postdata: ActionReq<ReferenceValue> = new ActionReq<ReferenceValue>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<ReferenceValue>>(
            this.baseurl + '/update',
            postdata
        );
                
        return resp.item;
    }
    async delete(req: ReferenceValueDeleteReq) {
        let postdata: ActionReq<ReferenceValueDeleteReq> = new ActionReq<ReferenceValueDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
                
        return resp.item;
    }
}
