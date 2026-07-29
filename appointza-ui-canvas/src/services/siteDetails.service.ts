import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';
import { SiteDetailsItem, SiteDetailsSelectReq } from '../models/sitedetail.model';

export class SiteDetailsService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + '/api/OrganisationSite';
  }

  async select(req: number) {
    let postdata: ActionReq<number> = new ActionReq<number>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<SiteDetailsItem>>>(
      this.baseurl + '/GetSiteDetails',
      postdata
    );
    return resp.item;
  }

  async resolveTemplateBySubdomain(req: {
    area: string;
    city: string;
    state: string;
    organizationName: string;
  }) {
    let postdata: ActionReq<any> = new ActionReq<any>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<any>>(
      this.baseurl + '/ResolveTemplateBySubdomain',
      postdata
    );
    return resp.item;
  }

  async save(req: SiteDetailsItem) {
    let postdata: ActionReq<SiteDetailsItem> = new ActionReq<SiteDetailsItem>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<SiteDetailsItem>>(
      this.baseurl + '/save',
      postdata
    );
    return resp.item;
  }

  async insert(req: SiteDetailsItem) {
    let postdata: ActionReq<SiteDetailsItem> = new ActionReq<SiteDetailsItem>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<SiteDetailsItem>>(
      this.baseurl + '/insert',
      postdata
    );
    return resp.item;
  }

  async update(req: SiteDetailsItem) {
    let postdata: ActionReq<SiteDetailsItem> = new ActionReq<SiteDetailsItem>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<SiteDetailsItem>>(
      this.baseurl + '/update',
      postdata
    );
    return resp.item;
  }

  async delete(req: SiteDetailsSelectReq) {
    let postdata: ActionReq<SiteDetailsSelectReq> = new ActionReq<SiteDetailsSelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/delete',
      postdata
    );
    return resp.item;
  }
}
