import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Review,
  ReviewDeleteReq,
  ReviewSelectReq,
} from '../models/review.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class ReviewService {
    http: AxiosHelperUtils;
    
    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/Review';
    }

    async select(req: ReviewSelectReq) {
        let postdata: ActionReq<ReviewSelectReq> = new ActionReq<ReviewSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Review>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item!;
    }

    async save(req: Review) {
        let postdata: ActionReq<Review> = new ActionReq<Review>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Review>>(
            this.baseurl + '/save',
            postdata
        );
        return resp.item!;
    }

    async insert(req: Review) {
        let postdata: ActionReq<Review> = new ActionReq<Review>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Review>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item!;
    }

    async update(req: Review) {
        let postdata: ActionReq<Review> = new ActionReq<Review>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Review>>(
            this.baseurl + '/update',
            postdata
        );
        return resp.item!;
    }

    async delete(req: ReviewDeleteReq) {
        let postdata: ActionReq<ReviewDeleteReq> = new ActionReq<ReviewDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item!;
    }
}

