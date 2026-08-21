import { ActionReq } from "../models/actionreq.model";
import { ActionRes } from "../models/actionres.model";
import {
  HospitalityContentSaveReq,
  HospitalityProfileSelectReq,
  HospitalityProfileSettingsReq,
  OrganisationHospitalityProfile,
  OrganisationRoom,
  OrganisationRoomDeleteReq,
  OrganisationRoomIdReq,
  OrganisationRoomSelectReq,
  OrganisationRoomStatusBoardRes,
  OrganisationRoomStatusReq,
  OrganisationRoomStatusUpdateReq,
  OrganisationRoomStatusEvent,
  OrganisationRoomStatusEventSelectReq,
} from "../models/hospitality.model";
import { AxiosHelperUtils } from "../utils/axioshelper.utils";
import { environment } from "../utils/environment";

export class HospitalityService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get contentBase(): string {
    return `${environment.baseurl}/api/OrganisationHospitalityContent`;
  }

  get roomBase(): string {
    return `${environment.baseurl}/api/OrganisationRoom`;
  }

  async getProfile(organisationId: number) {
    const postdata = new ActionReq<HospitalityProfileSelectReq>();
    postdata.item = { organisation_id: organisationId };
    const resp = await this.http.post<ActionRes<OrganisationHospitalityProfile>>(
      `${this.contentBase}/GetProfile`,
      postdata,
    );
    return resp.item ?? new OrganisationHospitalityProfile();
  }

  async saveSettings(req: HospitalityProfileSettingsReq) {
    const postdata = new ActionReq<HospitalityProfileSettingsReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<OrganisationHospitalityProfile>>(
      `${this.contentBase}/SaveSettings`,
      postdata,
    );
    return resp.item ?? new OrganisationHospitalityProfile();
  }

  async saveContent(req: HospitalityContentSaveReq) {
    const postdata = new ActionReq<HospitalityContentSaveReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<OrganisationHospitalityProfile>>(
      `${this.contentBase}/SaveContent`,
      postdata,
    );
    return resp.item ?? new OrganisationHospitalityProfile();
  }

  async selectRooms(req: OrganisationRoomSelectReq) {
    const postdata = new ActionReq<OrganisationRoomSelectReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<OrganisationRoom[]>>(
      `${this.roomBase}/Select`,
      postdata,
    );
    return resp.item ?? [];
  }

  async saveRoom(room: OrganisationRoom) {
    const postdata = new ActionReq<OrganisationRoom>();
    postdata.item = room;
    const resp = await this.http.post<ActionRes<OrganisationRoom>>(
      `${this.roomBase}/Save`,
      postdata,
    );
    return resp.item;
  }

  async deleteRoom(req: OrganisationRoomDeleteReq) {
    const postdata = new ActionReq<OrganisationRoomDeleteReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<boolean>>(
      `${this.roomBase}/Delete`,
      postdata,
    );
    return resp.item ?? false;
  }

  async getStatusBoard(req: OrganisationRoomStatusReq) {
    const postdata = new ActionReq<OrganisationRoomStatusReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<OrganisationRoomStatusBoardRes>>(
      `${this.roomBase}/GetStatusBoard`,
      postdata,
    );
    return resp.item ?? null;
  }

  async updateRoomStatus(req: OrganisationRoomStatusUpdateReq) {
    const postdata = new ActionReq<OrganisationRoomStatusUpdateReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<boolean>>(
      `${this.roomBase}/UpdateStatus`,
      postdata,
    );
    return resp.item ?? false;
  }

  async checkoutRoom(req: OrganisationRoomIdReq) {
    const postdata = new ActionReq<OrganisationRoomIdReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<boolean>>(
      `${this.roomBase}/Checkout`,
      postdata,
    );
    return resp.item ?? false;
  }

  async markRoomClean(req: OrganisationRoomIdReq) {
    const postdata = new ActionReq<OrganisationRoomIdReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<boolean>>(
      `${this.roomBase}/MarkClean`,
      postdata,
    );
    return resp.item ?? false;
  }

  async selectRoomStatusEvents(req: OrganisationRoomStatusEventSelectReq) {
    const postdata = new ActionReq<OrganisationRoomStatusEventSelectReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<OrganisationRoomStatusEvent[]>>(
      `${this.roomBase}/SelectStatusEvents`,
      postdata,
    );
    return resp.item ?? [];
  }
}

export const hospitalityService = new HospitalityService();
