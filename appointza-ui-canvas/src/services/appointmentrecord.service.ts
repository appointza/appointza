import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { AppointmentRecord, AppointmentRecordSelectReq, AppointmentRecordDeleteReq } from '../models/appointmentrecord.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class AppointmentRecordService {
  http: AxiosHelperUtils;
  
  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + '/api/AppointmentRecord';
  }

  async select(req: AppointmentRecordSelectReq): Promise<AppointmentRecord[]> {
    const actionReq = new ActionReq<AppointmentRecordSelectReq>();
    actionReq.item = req;
    
    const response = await this.http.post<ActionRes<AppointmentRecord[]>>(
      this.baseurl + '/Select',
      actionReq
    );

    return response.item || [];
  }

  async insert(appointmentRecord: AppointmentRecord): Promise<AppointmentRecord> {
    const actionReq = new ActionReq<AppointmentRecord>();
    actionReq.item = appointmentRecord;

    const response = await this.http.post<ActionRes<AppointmentRecord>>(
      this.baseurl + '/Insert',
      actionReq
    );

    return response.item;
  }

  async update(appointmentRecord: AppointmentRecord): Promise<AppointmentRecord> {
    const actionReq = new ActionReq<AppointmentRecord>();
    actionReq.item = appointmentRecord;

    const response = await this.http.post<ActionRes<AppointmentRecord>>(
      this.baseurl + '/Update',
      actionReq
    );

    return response.item;
  }

  async save(appointmentRecord: AppointmentRecord): Promise<AppointmentRecord> {
    const actionReq = new ActionReq<AppointmentRecord>();
    actionReq.item = appointmentRecord;

    const response = await this.http.post<ActionRes<AppointmentRecord>>(
      this.baseurl + '/Save',
      actionReq
    );

    return response.item;
  }

  async delete(req: AppointmentRecordDeleteReq): Promise<boolean> {
    const actionReq = new ActionReq<AppointmentRecordDeleteReq>();
    actionReq.item = req;

    const response = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/Delete',
      actionReq
    );

    return response.item || false;
  }
}

