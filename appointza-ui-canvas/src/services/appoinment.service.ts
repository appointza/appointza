import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
    AddStaffReq,
  Appoinment,
  AppoinmentDeleteReq,
  AppoinmentFinal,
  AppoinmentSelectReq,
  BookedAppoinmentRes,
  SearchAppointmentByMobileReq,
  ClientsSelectReq,
  ClientInfoRes,
  UpdatePaymentReq,
  UpdateStatusReq,
} from '../models/appoinment.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class AppoinmentService {
    http: AxiosHelperUtils;
    
    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/Appoinment';
    }

    async select(req: AppoinmentSelectReq) {
        let postdata: ActionReq<AppoinmentSelectReq> = new ActionReq<AppoinmentSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Appoinment>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item;
    }

    async save(req: Appoinment) {
        let postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Appoinment>>(
            this.baseurl + '/save',
            postdata
        );
        return resp.item;
    }

    async insert(req: Appoinment) {
        let postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Appoinment>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item;
    }

    async update(req: Appoinment) {
        let postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Appoinment>>(
            this.baseurl + '/update',
            postdata
        );
        return resp.item;
    }

    async delete(req: AppoinmentDeleteReq) {
        let postdata: ActionReq<AppoinmentDeleteReq> = new ActionReq<AppoinmentDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item;
    }

    async SelectBookedAppoinment(req: AppoinmentSelectReq) {
        let postdata: ActionReq<AppoinmentSelectReq> = new ActionReq<AppoinmentSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<BookedAppoinmentRes>>>(
            this.baseurl + '/SelectBookedAppoinment',
            postdata
        );
        return resp.item;
    }

    async Assignstaff(req: AddStaffReq) {
        let postdata: ActionReq<AddStaffReq> = new ActionReq<AddStaffReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/Assignstaff',
            postdata
        );
        return resp.item;
    }

    async UpdateStatus(req: UpdateStatusReq) {
        let postdata: ActionReq<UpdateStatusReq> = new ActionReq<UpdateStatusReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/UpdateStatus',
            postdata
        );
        return resp.item;
    }

    async UpdatePayment(req: UpdatePaymentReq) {
        let postdata: ActionReq<UpdatePaymentReq> = new ActionReq<UpdatePaymentReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/UpdatePayment',
            postdata
        );
        return resp.item;
    }

    async searchByMobile(req: SearchAppointmentByMobileReq) {
        let postdata: ActionReq<SearchAppointmentByMobileReq> = new ActionReq<SearchAppointmentByMobileReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<BookedAppoinmentRes>>>(
            this.baseurl + '/searchbymobile',
            postdata
        );
        return resp.item!;
    }

  async SelectUniqueClients(req: ClientsSelectReq) {
    let postdata: ActionReq<ClientsSelectReq> = new ActionReq<ClientsSelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<ClientInfoRes>>>(
      this.baseurl + '/SelectUniqueClients',
      postdata
    );
    return resp.item!;
  }

  /** Unique customers who booked with this organisation (all locations). */
  async selectUniqueClientsByOrganisation(organisationId: number) {
    const req = new ClientsSelectReq();
    req.organisationid = organisationId;
    req.organisationlocationid = 0;
    req.mobilenumber = "";
    return this.SelectUniqueClients(req);
  }
}
