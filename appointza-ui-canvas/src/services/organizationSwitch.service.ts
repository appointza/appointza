import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { AppointmentRecord } from '../models/appointmentrecord.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export interface OrganizationInfo {
  organizationId: string;
  organizationName: string;
  organizationDomain: string;
  isCurrent: boolean;
  hasAppointments: boolean;
  isAdmin: boolean;
}

export interface GetOrganizationsRequest {
  mobileNumber: string;
}

export interface GetAppointmentsRequest {
  organizationId: string;
  mobileNumber?: string;
  isAdmin: boolean;
}

export class OrganizationSwitchService {
  http: AxiosHelperUtils;
  
  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + '/api/OrganizationSwitch';
  }

  async getAvailableOrganizations(mobileNumber: string): Promise<OrganizationInfo[]> {
    const request: GetOrganizationsRequest = {
      mobileNumber
    };
    
    const response = await this.http.post<ActionRes<OrganizationInfo[]>>(
      this.baseurl + '/available-organizations',
      request
    );

    return response.item || [];
  }

  async getAppointments(organizationId: string, mobileNumber?: string, isAdmin: boolean = false): Promise<AppointmentRecord[]> {
    const request: GetAppointmentsRequest = {
      organizationId,
      mobileNumber,
      isAdmin
    };
    
    const response = await this.http.post<ActionRes<AppointmentRecord[]>>(
      this.baseurl + '/appointments',
      request
    );

    return response.item || [];
  }
}
