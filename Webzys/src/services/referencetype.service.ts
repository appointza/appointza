import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  ReferenceType,
  ReferenceTypeSelectReq,
  ReferenceTypeDeleteReq,
} from '../models/referencetype.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class ReferenceTypeService {
  baseurl: string;
  http: AxiosHelperUtils;
  
  constructor() {
    this.baseurl = environment.baseurl + '/api/ReferenceType';
    this.http = new AxiosHelperUtils();
  }

  async select(req: ReferenceTypeSelectReq) {
    let postdata: ActionReq<ReferenceTypeSelectReq> = new ActionReq<ReferenceTypeSelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<ReferenceType[]>>(
      this.baseurl + '/Select',
      postdata,
      false, // Requires authentication
    );
    return resp.item || [];
  }
}

