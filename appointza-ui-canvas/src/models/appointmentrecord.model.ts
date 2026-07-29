export class AppointmentRecord {
  id: number = 0;
  userid: number = 0;
  organisationid: number = 0;
  appointmentdate: Date = new Date();
  status: number = 0;
  ishasreschedule: boolean = false;
  imageids: number[] = [];
  record: AppointmentRecord.RecordData = new AppointmentRecord.RecordData();
  fileids: AppointmentRecord.FileIdsData = new AppointmentRecord.FileIdsData();
  createdon: Date = new Date();
  modifiedon: Date = new Date();
  modifiedby: number = 0;
}

export namespace AppointmentRecord {
  export class RecordData {
    report: string = "";
    notes: string = "";
    additionalData: { [key: string]: any } = {};
  }

  export class FileIdsData {
    files: FileIdItem[] = [];
  }

  export class FileIdItem {
    id: number = 0;
    filename: string = "";
    filepath: string = "";
    filetype: string = "";
    filesize: number = 0;
    uploadedon: Date | null = null;
    uploadedby: string = "";
  }
}

export class AppointmentRecordSelectReq {
  id: number = 0;
  organisationid: number = 0;
  userid: number = 0;
  appointmentdate: Date | null = null;
  status: number | null = null;
  ishasreschedule: boolean | null = null;
}

export class AppointmentRecordDeleteReq {
  id: number = 0;
}

