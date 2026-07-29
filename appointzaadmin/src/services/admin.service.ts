import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { Organisation } from '../models/organisation.model';
import { AdminGetAllOrganisationsReq, AdminOrganisationLocation, AdminToggleLocationVerificationReq, AdminDeleteLocationReq, AdminActivateLocationReq, AdminOrganizationLocationStats, AdminAppointmentStats, AdminAppointmentStatsReq, AdminGetAllUsersReq, User } from '../models/admin.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class AdminService {
  baseurl: string;
  http: AxiosHelperUtils;
  
  constructor() {
    this.baseurl = environment.baseurl + '/api/Admin';
    this.http = new AxiosHelperUtils();
  }

  async GetAllOrganisations(req: AdminGetAllOrganisationsReq) {
    let postdata: ActionReq<AdminGetAllOrganisationsReq> = new ActionReq<AdminGetAllOrganisationsReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<Organisation>>>(
      this.baseurl + '/GetAllOrganisations',
      postdata
    );
    return resp.item;
  }

  async GetAllOrganisationLocations() {
    let resp = await this.http.get<ActionRes<Array<AdminOrganisationLocation>>>(
      this.baseurl + '/GetAllOrganisationLocations'
    );
    return resp.item;
  }

  async ToggleLocationVerification(locationId: number, isVerified: boolean) {
    let req: AdminToggleLocationVerificationReq = new AdminToggleLocationVerificationReq();
    req.LocationId = locationId;
    req.IsVerified = isVerified;
    let postdata: ActionReq<AdminToggleLocationVerificationReq> = new ActionReq<AdminToggleLocationVerificationReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/ToggleLocationVerification',
      postdata
    );
    return resp.item;
  }

  async DeleteLocation(locationId: number) {
    let req: AdminDeleteLocationReq = new AdminDeleteLocationReq();
    req.LocationId = locationId;
    let postdata: ActionReq<AdminDeleteLocationReq> = new ActionReq<AdminDeleteLocationReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/DeleteLocation',
      postdata
    );
    return resp.item;
  }

  async ActivateLocation(locationId: number) {
    let req: AdminActivateLocationReq = new AdminActivateLocationReq();
    req.LocationId = locationId;
    let postdata: ActionReq<AdminActivateLocationReq> = new ActionReq<AdminActivateLocationReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/ActivateLocation',
      postdata
    );
    return resp.item;
  }

  async GetOrganizationLocationStats() {
    let resp = await this.http.get<ActionRes<AdminOrganizationLocationStats>>(
      this.baseurl + '/GetOrganizationLocationStats'
    );
    return resp.item;
  }

  async GetAppointmentStats(req: AdminAppointmentStatsReq) {
    let postdata: ActionReq<AdminAppointmentStatsReq> = new ActionReq<AdminAppointmentStatsReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<AdminAppointmentStats>>(
      this.baseurl + '/GetAppointmentStats',
      postdata
    );
    return resp.item;
  }

  async GetAllUsers(req: AdminGetAllUsersReq) {
    let postdata: ActionReq<AdminGetAllUsersReq> = new ActionReq<AdminGetAllUsersReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<User>>>(
      this.baseurl + '/GetAllUsers',
      postdata
    );
    return resp.item;
  }
}

