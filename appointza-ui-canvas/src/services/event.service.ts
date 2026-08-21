import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Event,
  EventDeleteReq,
  EventSelectReq,
} from '../models/event.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';
import {
  normalizeEventDatesForApi,
  normalizeEventDatesFromApi,
} from '../utils/eventDate.util';

export class EventService {
    http: AxiosHelperUtils;
    
    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/Event';
    }

    async select(req: EventSelectReq, skipAuthorization: boolean = false) {
        let postdata: ActionReq<EventSelectReq> = new ActionReq<EventSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Event>>>(
            this.baseurl + '/select',
            postdata,
            skipAuthorization,
        );
        return (resp.item ?? []).map((event) => normalizeEventDatesFromApi(event));
    }

    /** Public browsing: active, public, upcoming/ongoing events only (same as Explore events tab). */
    async selectPublicBrowse(): Promise<Array<Event> | undefined> {
        const req = new EventSelectReq();
        req.id = 0;
        req.organisation_id = 0;
        req.organisation_location_id = 0;
        req.status = "active";
        req.is_public = true;
        req.include_past = false;
        return this.select(req);
    }

    async save(req: Event) {
        let postdata: ActionReq<Event> = new ActionReq<Event>();
        postdata.item = normalizeEventDatesForApi(req);
        let resp = await this.http.post<ActionRes<Event>>(
            this.baseurl + '/save',
            postdata
        );
        return resp.item ? normalizeEventDatesFromApi(resp.item) : resp.item;
    }

    async insert(req: Event) {
        let postdata: ActionReq<Event> = new ActionReq<Event>();
        postdata.item = normalizeEventDatesForApi(req);
        let resp = await this.http.post<ActionRes<Event>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item ? normalizeEventDatesFromApi(resp.item) : resp.item;
    }

    async update(req: Event) {
        let postdata: ActionReq<Event> = new ActionReq<Event>();
        postdata.item = normalizeEventDatesForApi(req);
        let resp = await this.http.post<ActionRes<Event>>(
            this.baseurl + '/update',
            postdata
        );
        return resp.item ? normalizeEventDatesFromApi(resp.item) : resp.item;
    }

    async delete(req: EventDeleteReq) {
        let postdata: ActionReq<EventDeleteReq> = new ActionReq<EventDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item;
    }
}

