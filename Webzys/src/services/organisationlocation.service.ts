import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { UpdateLocationTemplateIdReq } from '../models/organisationlocation.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class OrganisationLocationService {
  baseurl: string;
  http: AxiosHelperUtils;
  
  constructor() {
    this.baseurl = environment.baseurl + '/api/OrganisationLocation';
    this.http = new AxiosHelperUtils();
  }

  async updateLocationTemplateId(req: UpdateLocationTemplateIdReq): Promise<number> {
    let postdata: ActionReq<UpdateLocationTemplateIdReq> = new ActionReq<UpdateLocationTemplateIdReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<number>>(
      this.baseurl + '/UpdateLocationTemplateId',
      postdata,
      false, // Requires authentication
    );
    return resp.item || 0;
  }
}

