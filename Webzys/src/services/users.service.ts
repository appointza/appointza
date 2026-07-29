import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  UsersGetOtpReq,
  UsersGetOtpRes,
  UsersLoginReq,
  UsersContext,
  UserDetailsWithOrganisationRes,
} from '../models/users.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class UsersService {
  baseurl: string;
  http: AxiosHelperUtils;
  
  constructor() {
    this.baseurl = environment.baseurl + '/api/Users';
    this.http = new AxiosHelperUtils();
  }

  async login(req: UsersLoginReq) {
    let postdata: ActionReq<UsersLoginReq> = new ActionReq<UsersLoginReq>();
    postdata.item = req;
    // Login endpoint is in AuthController, not UsersController
    let resp = await this.http.post<ActionRes<UsersContext>>(
      environment.baseurl + '/api/Auth/Login',
      postdata,
      true,
    );
    const userContext = resp.item!;
    return userContext;
  }

  async getotp(req: UsersGetOtpReq) {
    let postdata: ActionReq<UsersGetOtpReq> = new ActionReq<UsersGetOtpReq>();
    postdata.item = req;
    // GetOtp endpoint is in AuthController, not UsersController
    let resp = await this.http.post<ActionRes<UsersGetOtpRes>>(
      environment.baseurl + '/api/Auth/GetOtp',
      postdata,
    );
    return resp.item!;
  }

  async getUserDetailsWithOrganisation() {
    let resp = await this.http.post<ActionRes<UserDetailsWithOrganisationRes>>(
      this.baseurl + '/GetUserDetailsWithOrganisation',
      new ActionReq<any>(),
      false, // Don't skip authorization - this endpoint requires authentication
    );
    return resp.item!;
  }
}

