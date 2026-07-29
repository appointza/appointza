import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { WebsiteExportOrderReq, WebsiteExportOrderRes } from '../models/payment.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class PaymentService {
  baseurl: string;
  http: AxiosHelperUtils;
  
  constructor() {
    this.baseurl = environment.baseurl + '/api/Razorpay';
    this.http = new AxiosHelperUtils();
  }

  async createWebsiteExportOrder(req: WebsiteExportOrderReq): Promise<WebsiteExportOrderRes> {
    let postdata: ActionReq<WebsiteExportOrderReq> = new ActionReq<WebsiteExportOrderReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<WebsiteExportOrderRes>>(
      this.baseurl + '/CreateWebsiteExportOrder',
      postdata,
      false, // Requires authentication
    );
    return resp.item!;
  }
}

