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

  /** Resolve public booking page by orgloctempid GUID. */
  async selectByOrgLocTempId(orgloctempid: string) {
    const resp = await this.http.get<ActionRes<Array<SiteDetailsItem>>>(
      `${this.baseurl}/GetSiteDetailsByOrgLocTempId/${encodeURIComponent(orgloctempid)}`,
      true,
    );
    return resp.item;
  }

  /**
   * Single public API: server resolves GUID, loads site + events, binds template, returns HTML.
   */
  async getPublicHtml(orgloctempid: string) {
    const resp = await this.http.get<
      ActionRes<{
        organisationid?: number;
        organisationlocationid?: number;
        orgloctempid?: string;
        templateid?: number;
        html?: string;
        versionKey?: string;
      }>
    >(`${this.baseurl}/GetPublicHtml/${encodeURIComponent(orgloctempid)}`, true);
    return resp.item;
  }

  async getPublicHtmlByLocation(locationId: number) {
    const resp = await this.http.get<
      ActionRes<{
        organisationid?: number;
        organisationlocationid?: number;
        orgloctempid?: string;
        templateid?: number;
        html?: string;
        versionKey?: string;
      }>
    >(`${this.baseurl}/GetPublicHtmlByLocation/${locationId}`, true);
    return resp.item;
  }

  async resolveTemplateByCustomUrl(customUrl: string) {
    let postdata: ActionReq<{ customUrl: string }> = new ActionReq<{ customUrl: string }>();
    postdata.item = { customUrl };
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
