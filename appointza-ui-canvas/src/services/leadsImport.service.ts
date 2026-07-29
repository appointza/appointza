import { ActionReq } from "../models/actionreq.model";
import { ActionRes } from "../models/actionres.model";
import type { LeadsImportReq, LeadsImportRes } from "../models/leadsImport.model";
import { AxiosHelperUtils } from "../utils/axioshelper.utils";
import { environment } from "../utils/environment";

export class LeadsImportService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + "/api/Leads";
  }

  async importFromAppointza(req: LeadsImportReq) {
    const postdata: ActionReq<LeadsImportReq> = new ActionReq<LeadsImportReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<LeadsImportRes>>(
      this.baseurl + "/ImportFromAppointza",
      postdata,
    );
    return resp.item!;
  }
}
