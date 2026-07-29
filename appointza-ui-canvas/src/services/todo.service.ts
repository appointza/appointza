import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Todo,
  TodoGetRes,
} from '../models/todo.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class TodoService {
    http: AxiosHelperUtils;
    
    constructor() {
        this.http = new AxiosHelperUtils();
    }

    get baseurl(): string {
        return environment.baseurl + '/api/Todo';
    }

    async getTodos(userId: number) {
        let postdata: ActionReq<{ userId: number }> = new ActionReq<{ userId: number }>();
        postdata.item = { userId };
        let resp = await this.http.post<ActionRes<TodoGetRes>>(
            this.baseurl + '/getTodos', 
            postdata
        );
        return resp.item;
    }

    async save(req: Todo) {
        let postdata: ActionReq<Todo> = new ActionReq<Todo>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Todo>>(
            this.baseurl + '/save',
            postdata
        );
        return resp.item;
    }

    async insert(req: Todo) {
        let postdata: ActionReq<Todo> = new ActionReq<Todo>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Todo>>(
            this.baseurl + '/insert',
            postdata
        );
        return resp.item;
    }

    async update(req: Todo) {
        let postdata: ActionReq<Todo> = new ActionReq<Todo>();
        postdata.item = req;
        let resp = await this.http.post<ActionRes<Todo>>(
            this.baseurl + '/update',
            postdata
        );
        return resp.item;
    }

    async delete(todoId: number) {
        let postdata: ActionReq<{ id: number }> = new ActionReq<{ id: number }>();
        postdata.item = { id: todoId };
        let resp = await this.http.post<ActionRes<boolean>>(
            this.baseurl + '/delete',
            postdata
        );
        return resp.item;
    }
}
