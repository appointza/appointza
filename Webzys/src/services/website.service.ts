import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Website,
  WebsiteSelectReq,
  WebsiteDeleteReq,
  WebsiteExportPaymentSuccessReq,
  WebsiteExportHtmlSaveReq,
} from '../models/website.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class WebsiteService {
  baseurl: string;
  http: AxiosHelperUtils;
  
  constructor() {
    this.baseurl = environment.baseurl + '/api/Website';
    this.http = new AxiosHelperUtils();
  }

  async select(req: WebsiteSelectReq) {
    let postdata: ActionReq<WebsiteSelectReq> = new ActionReq<WebsiteSelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Website[]>>(
      this.baseurl + '/Select',
      postdata,
    );
    return resp.item || [];
  }

  async insert(website: Website) {
    let postdata: ActionReq<Website> = new ActionReq<Website>();
    postdata.item = website;
    let resp = await this.http.post<ActionRes<Website>>(
      this.baseurl + '/Insert',
      postdata,
    );
    return resp.item!;
  }

  async update(website: Website) {
    let postdata: ActionReq<Website> = new ActionReq<Website>();
    postdata.item = website;
    let resp = await this.http.post<ActionRes<Website>>(
      this.baseurl + '/Update',
      postdata,
    );
    return resp.item!;
  }

  async save(website: Website) {
    let postdata: ActionReq<Website> = new ActionReq<Website>();
    postdata.item = website;
    let resp = await this.http.post<ActionRes<Website>>(
      this.baseurl + '/Save',
      postdata,
    );
    return resp.item!;
  }

  async delete(req: WebsiteDeleteReq) {
    let postdata: ActionReq<WebsiteDeleteReq> = new ActionReq<WebsiteDeleteReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/Delete',
      postdata,
    );
    return resp.item!;
  }

  async markExportPaymentSuccess(req: WebsiteExportPaymentSuccessReq) {
    let postdata: ActionReq<WebsiteExportPaymentSuccessReq> = new ActionReq<WebsiteExportPaymentSuccessReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Website>>(
      this.baseurl + '/MarkExportPaymentSuccess',
      postdata,
      false, // Requires authentication
    );
    return resp.item!;
  }

  async saveExportedHtml(req: WebsiteExportHtmlSaveReq) {
    let postdata: ActionReq<WebsiteExportHtmlSaveReq> = new ActionReq<WebsiteExportHtmlSaveReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<any>>(
      this.baseurl + '/SaveExportedHtml',
      postdata,
      false, // Requires authentication
    );
    return resp.item!;
  }
}

