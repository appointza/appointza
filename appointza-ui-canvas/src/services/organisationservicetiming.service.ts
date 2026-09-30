import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  OrganisationServiceTiming,
  OrganisationServiceTimingDeleteReq,
  OrganisationServiceTimingSelectReq,
  OrganisationServiceTimingBulkSaveReq,
  OrganisationServiceTimingHasAnyReq,
  Leavereq,
  CalendarOverviewReq,
  CalendarOverviewRes,
} from '../models/organisationservicetiming.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class OrganisationServiceTimingService {
    http: AxiosHelperUtils;
    
    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/OrganisationServiceTiming';
    }

    async select(req: OrganisationServiceTimingSelectReq) {
        let postdata: ActionReq<OrganisationServiceTimingSelectReq> = new ActionReq<OrganisationServiceTimingSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationServiceTiming>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }

    async save(req: OrganisationServiceTiming) {
        let postdata: ActionReq<OrganisationServiceTiming> = new ActionReq<OrganisationServiceTiming>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServiceTiming>>(
            this.baseurl + '/save',
            postdata
        );
        return resp.item;
    }

    async insert(req: OrganisationServiceTiming) {
        let postdata: ActionReq<OrganisationServiceTiming> = new ActionReq<OrganisationServiceTiming>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServiceTiming>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item;
    }

    async update(req: OrganisationServiceTiming) {
        let postdata: ActionReq<OrganisationServiceTiming> = new ActionReq<OrganisationServiceTiming>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationServiceTiming>>(
            this.baseurl + '/update',
            postdata
        );
        return resp.item;
    }

    async delete(req: OrganisationServiceTimingDeleteReq) {
        let postdata: ActionReq<OrganisationServiceTimingDeleteReq> = new ActionReq<OrganisationServiceTimingDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item;
    }

    async hasAny(req: OrganisationServiceTimingHasAnyReq) {
        const postdata = new ActionReq<OrganisationServiceTimingHasAnyReq>();
        postdata.item = req;
        const resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/HasAny',
            postdata,
        );
        return !!resp.item;
    }

    async saveBulk(req: OrganisationServiceTimingBulkSaveReq) {
        const postdata = new ActionReq<OrganisationServiceTimingBulkSaveReq>();
        postdata.item = req;
        const resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/SaveBulk',
            postdata,
        );
        return !!resp.item;
    }

    async Bookappoinment(req: any) {
        let postdata: ActionReq<any> = new ActionReq<any>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<string>>(
            this.baseurl + '/Bookappoinment',
            postdata
        );
        return resp.item;
    }

    async addLeave(req: any) {
        let postdata: ActionReq<any> = new ActionReq<any>();
        postdata.item = req;
        console.log('📤 Service sending:', JSON.stringify(postdata, null, 2));
        let resp = await this.http.post<ActionRes<string>>(
            this.baseurl + '/BookLeave',
            postdata
        );
        return resp.item;
    }

    async selecttimingslot(req: OrganisationServiceTimingSelectReq) {
        let postdata: ActionReq<OrganisationServiceTimingSelectReq> = new ActionReq<OrganisationServiceTimingSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<any>>>(
            this.baseurl + '/selecttimingslot',
            postdata
        );
        return resp.item;
    }

    async selectCalendarOverview(req: CalendarOverviewReq) {
        const postdata = new ActionReq<CalendarOverviewReq>();
        postdata.item = req;
        const resp = await this.http.post<ActionRes<CalendarOverviewRes>>(
            this.baseurl + '/SelectCalendarOverview',
            postdata
        );
        return resp.item;
    }

    async getLeaveRequests(req: { organisationid: number; organisationlocationid: number; appointmentdate?: Date }) {
        let postdata: ActionReq<any> = new ActionReq<any>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<any>>>(
            this.baseurl + '/getLeaveRequests',
            postdata
        );
        return resp.item;
    }

    async cancelLeave(req: { id: number; organisationid: number; organisationlocationid: number; version: number }) {
        let postdata: ActionReq<any> = new ActionReq<any>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<string>>(
            this.baseurl + '/CancelLeave',
            postdata
        );
        return resp.item;
    }

    async editLeave(req: any) {
        let postdata: ActionReq<any> = new ActionReq<any>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<string>>(
            this.baseurl + '/EditLeave',
            postdata
        );
        return resp.item;
    }
}
