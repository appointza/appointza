import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  ReferenceValue,
  ReferenceValueDeleteReq,
  ReferenceValueSelectReq,
} from '../models/referencevalue.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class ReferenceValueService {
    http: AxiosHelperUtils;
    
    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/ReferenceValue';
    }

    async select(req: ReferenceValueSelectReq) {
        let postdata: ActionReq<ReferenceValueSelectReq> = new ActionReq<ReferenceValueSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<ReferenceValue>>>(
            this.baseurl + '/Select', 
            postdata
        );
        return resp.item;
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
        
        console.log('ReferenceValueService.insert - sending data:', JSON.stringify(postdata));
        console.log('ReferenceValueService.insert - referencetypeid:', req.referencetypeid);
        
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
