import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Files,
  FilesDeleteReq,
  FilesSelectReq,
} from '../models/files.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class FilesService {
    http: AxiosHelperUtils;
    
    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/Files';
    }

    async select(req: FilesSelectReq) {
        let postdata: ActionReq<FilesSelectReq> = new ActionReq<FilesSelectReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Array<Files>>>(
            this.baseurl + '/select', 
            postdata
        );
        return resp.item!;
    }

    async save(req: Files) {
        let postdata: ActionReq<Files> = new ActionReq<Files>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Files>>(
            this.baseurl + '/save',
            postdata
        );
        return resp.item!;
    }

    async insert(req: Files) {
        let postdata: ActionReq<Files> = new ActionReq<Files>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Files>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item!;
    }

    async update(req: Files) {
        let postdata: ActionReq<Files> = new ActionReq<Files>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Files>>(
            this.baseurl + '/update',
            postdata
        );
        return resp.item!;
    }

    async delete(req: FilesDeleteReq) {
        let postdata: ActionReq<FilesDeleteReq> = new ActionReq<FilesDeleteReq>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item!;
    }

    async upload(files: File[]) {
        const formData = new FormData();
        
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        // For FormData, don't set Content-Type - let axios set it automatically with boundary
        let resp = await this.http.post<ActionRes<number[]>>(
            this.baseurl + '/upload',
            formData,
            true,
            {} // Empty headers - axios will set Content-Type automatically for FormData
        );
        
        return resp.item!;
    }

    get(id: number) {
        return this.baseurl + `/get?id=${id}`;
    }

    getImageUrl(id: number) {
        return this.baseurl + `/get?id=${id}`;
    }
}
