import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  OrganisationLocation,
  OrganisationLocationDeleteReq,
  OrganisationLocationSelectReq,
  OrganisationLocationStaffReq,
  OrganisationLocationStaffRes,
  OrgLocationStaffRequest,
  OrgLocationStaffResponse,
  UsersGenerateQRCodeReq,
  UsersGenerateQRCodeRes,
  OrgLocationReq,
  AppointmentPaymentsummary,
  OrganisationDashboardStats,
  UpdateLocationTemplateIdReq,
  UpdateLocationMediaReq,
  CustomUrlAvailabilityReq,
  CustomUrlAvailabilityRes,
} from '../models/organisationlocation.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class OrganisationLocationService {
    http: AxiosHelperUtils;
    
    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/OrganisationLocation';
    }

    async select(req: OrganisationLocationSelectReq) {
        let postdata: ActionReq<OrganisationLocationSelectReq> = new ActionReq<OrganisationLocationSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationLocation>>>(
            this.baseurl + '/Select', 
            postdata
        );
        return resp.item;
    }

    /** Public booking: no auth required on server. Pass organisationid and id (location id). */
    async selectPublic(req: OrganisationLocationSelectReq) {
        let postdata: ActionReq<OrganisationLocationSelectReq> = new ActionReq<OrganisationLocationSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationLocation>>>(
            this.baseurl + '/SelectPublic',
            postdata
        );
        return resp.item;
    }

    async save(req: OrganisationLocation) {
        let postdata: ActionReq<OrganisationLocation> = new ActionReq<OrganisationLocation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationLocation>>(
            this.baseurl + '/Save',
            postdata
        );
        return resp.item;
    }

    async insert(req: OrganisationLocation) {
        let postdata: ActionReq<OrganisationLocation> = new ActionReq<OrganisationLocation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationLocation>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item;
    }

    async update(req: OrganisationLocation) {
        let postdata: ActionReq<OrganisationLocation> = new ActionReq<OrganisationLocation>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<OrganisationLocation>>(
            this.baseurl + '/update',
            postdata
        );
        return resp.item;
    }

    async delete(req: OrganisationLocationDeleteReq) {
        let postdata: ActionReq<OrganisationLocationDeleteReq> = new ActionReq<OrganisationLocationDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item;
    }

    async getOrganisationLocationStaff(req: OrganisationLocationStaffReq) {
        let postdata: ActionReq<OrganisationLocationStaffReq> = new ActionReq<OrganisationLocationStaffReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrganisationLocationStaffRes>>>(
            this.baseurl + '/getOrganisationLocationStaff',
            postdata
        );
        return resp.item;
    }

    async getOrgLocationStaff(req: OrgLocationStaffRequest) {
        let postdata: ActionReq<OrgLocationStaffRequest> = new ActionReq<OrgLocationStaffRequest>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<OrgLocationStaffResponse>>>(
            this.baseurl + '/getOrgLocationStaff',
            postdata
        );
        return resp.item;
    }

    async generateQRCode(req: UsersGenerateQRCodeReq) {
        let postdata: ActionReq<UsersGenerateQRCodeReq> = new ActionReq<UsersGenerateQRCodeReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<UsersGenerateQRCodeRes>>(
            this.baseurl + '/generateQRCode',
            postdata
        );
        return resp.item;
    }

    async SelectlocationDetail(req: OrgLocationReq) {
        let postdata: ActionReq<OrgLocationReq> = new ActionReq<OrgLocationReq>();
        postdata.item = req;
        console.log("🔍 Calling SelectlocationDetail API:", this.baseurl + '/SelectlocationDetail');
        
        let resp = await this.http.post<ActionRes<Array<OrgLocationStaffResponse>>>(
            this.baseurl + '/SelectlocationDetail', 
            postdata
        );
        console.log("✅ SelectlocationDetail API response:", resp);
        return resp.item;
    }

    async SelectAppointmentPaymentsummary(req: OrgLocationReq) {
        let postdata: ActionReq<OrgLocationReq> = new ActionReq<OrgLocationReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<AppointmentPaymentsummary>>(
            this.baseurl + '/SelectAppointmentPaymentsummary',
            postdata
        );
        return resp.item;
    }

    async selectOrganisationDashboardStats(req: OrgLocationReq) {
        const postdata = new ActionReq<OrgLocationReq>();
        postdata.item = req;
        const resp = await this.http.post<ActionRes<OrganisationDashboardStats>>(
            this.baseurl + '/SelectOrganisationDashboardStats',
            postdata
        );
        return resp.item;
    }

    async updateLocationTemplateId(req: UpdateLocationTemplateIdReq) {
        let postdata: ActionReq<UpdateLocationTemplateIdReq> = new ActionReq<UpdateLocationTemplateIdReq>();
        postdata.item = req;
        console.log('🔗 Calling UpdateLocationTemplateId API:', this.baseurl + '/UpdateLocationTemplateId');
        console.log('🔗 Request data:', postdata);
        
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/UpdateLocationTemplateId',
            postdata
        );
        console.log('✅ UpdateLocationTemplateId API response:', resp);
        
        if (resp.item) {
            console.log(`✅ Template ID ${req.templateid} successfully assigned to location ${req.organisationlocationid}`);
        } else {
            console.log(`❌ Failed to update template for location ${req.organisationlocationid}`);
        }
        
        return resp.item;
    }

    async updateLocationMedia(req: UpdateLocationMediaReq) {
        const postdata = new ActionReq<UpdateLocationMediaReq>();
        postdata.item = req;
        const resp = await this.http.post<ActionRes<OrganisationLocation>>(
            this.baseurl + '/UpdateLocationMedia',
            postdata
        );
        return resp.item;
    }

    async checkCustomUrlAvailability(customUrl: string, organisationLocationId?: number) {
        const postdata = new ActionReq<CustomUrlAvailabilityReq>();
        postdata.item = new CustomUrlAvailabilityReq();
        postdata.item.customurl = customUrl.trim();
        if (organisationLocationId && organisationLocationId > 0) {
            postdata.item.organisationlocationid = organisationLocationId;
        }
        const resp = await this.http.post<ActionRes<CustomUrlAvailabilityRes>>(
            this.baseurl + '/CheckCustomUrlAvailability',
            postdata
        );
        return resp.item;
    }
}
