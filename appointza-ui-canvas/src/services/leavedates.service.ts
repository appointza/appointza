import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  LeaveDates,
  LeaveDatesDeleteReq,
  LeaveDatesSelectReq,
} from '../models/leavedates.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class LeaveDatesService {
    http: AxiosHelperUtils;
    
    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/LeaveDates';
    }

    async select(req: LeaveDatesSelectReq) {
        let postdata: ActionReq<LeaveDatesSelectReq> = new ActionReq<LeaveDatesSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<LeaveDates>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }

    async save(req: LeaveDates) {
        let postdata: ActionReq<LeaveDates> = new ActionReq<LeaveDates>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<LeaveDates>>(
            this.baseurl + '/save',
            postdata
        );
        return resp.item;
    }

    async insert(req: LeaveDates) {
        let postdata: ActionReq<LeaveDates> = new ActionReq<LeaveDates>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<LeaveDates>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item;
    }

    async update(req: LeaveDates) {
        try {
            let postdata: ActionReq<LeaveDates> = new ActionReq<LeaveDates>();
            postdata.item = req;
            console.log('📤 LeaveDatesService Update - Sending to API:', JSON.stringify(postdata, null, 2));
            console.log('📤 API URL:', this.baseurl + '/update');
            
            let resp = await this.http.post<ActionRes<LeaveDates>>(
                this.baseurl + '/update',
                postdata
            );
            console.log('📥 LeaveDatesService Update - API Response:', resp);
            return resp.item;
        } catch (error) {
            console.error('❌ LeaveDatesService Update Error:', error);
            console.error('❌ Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.config?.data
                }
            });
            throw error;
        }
    }

    async delete(req: LeaveDatesDeleteReq) {
        let postdata: ActionReq<LeaveDatesDeleteReq> = new ActionReq<LeaveDatesDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item;
    }
}
