import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';
import { Template, TemplateSelectReq, TemplateDeleteReq } from '../models/template.model';

export class TemplateService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + '/api/Template';
  }

  async entity(): Promise<Template> {
    const resp = await this.http.get<ActionRes<Template>>(this.baseurl + '/Entity');
    return resp.item || new Template();
  }

  async select(req: TemplateSelectReq): Promise<Template[]> {
    const postdata: ActionReq<TemplateSelectReq> = new ActionReq<TemplateSelectReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<Template[]>>(
      this.baseurl + '/Select',
      postdata
    );
    return resp.item || [];
  }

  async insert(req: Template): Promise<Template> {
    const postdata: ActionReq<Template> = new ActionReq<Template>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<Template>>(
      this.baseurl + '/Insert',
      postdata
    );
    return resp.item || new Template();
  }

  async update(req: Template): Promise<Template> {
    const postdata: ActionReq<Template> = new ActionReq<Template>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<Template>>(
      this.baseurl + '/Update',
      postdata
    );
    return resp.item || new Template();
  }

  async save(req: Template): Promise<Template> {
    const postdata: ActionReq<Template> = new ActionReq<Template>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<Template>>(
      this.baseurl + '/Save',
      postdata
    );
    return resp.item || new Template();
  }

  async delete(req: TemplateDeleteReq): Promise<boolean> {
    const postdata: ActionReq<TemplateDeleteReq> = new ActionReq<TemplateDeleteReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/Delete',
      postdata
    );
    return resp.item || false;
  }

  // Helper method to get template by ID
  async getById(id: number, organisationid: number): Promise<Template | null> {
    const templates = await this.select({ id, organisationid, organisationlocationid: null });
    return templates.length > 0 ? templates[0] : null;
  }

  // Helper method to get all templates for an organization
  async getByOrganisation(organisationid: number): Promise<Template[]> {
    return await this.select({ id: 0, organisationid, organisationlocationid: null });
  }

  // Helper method to get templates by organization and location
  async getByOrganisationAndLocation(organisationid: number, organisationlocationid: number): Promise<Template[]> {
    return await this.select({ id: 0, organisationid, organisationlocationid });
  }
}
