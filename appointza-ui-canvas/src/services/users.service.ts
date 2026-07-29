import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import {
  Organisationdeletereq,
  Users,
  UsersAcceptConnectionRequestReq,
  UsersAddColourSetToCartReq,
  UsersConnectionRequestReq,
  UsersContext,
  UsersDeleteReq,
  UsersGetOtpReq,
  UsersGetOtpRes,
  UsersLoginReq,
  UsersMergeDesign,
  UsersRegisterReq,
  UsersRegisterRes,
  UsersSelectReq,
  UsersSupplierInviteScreenReq,
  UsersSupplierInviteScreenRes,
  UserUpdateOrderStatusReq,
} from '../models/users.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class UsersService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + '/api/Users';
  }

  async select(req: UsersSelectReq) {
    let postdata: ActionReq<UsersSelectReq> = new ActionReq<UsersSelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<Users>>>(
      this.baseurl + '/select',
      postdata,
    );
    return resp.item!;
  }

  async save(req: Users) {
    let postdata: ActionReq<Users> = new ActionReq<Users>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Users>>(
      this.baseurl + '/save',
      postdata,
    );
    return resp.item!;
  }

  async insert(req: Users) {
    let postdata: ActionReq<Users> = new ActionReq<Users>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Users>>(
      this.baseurl + '/insert',
      postdata,
    );
    return resp.item!;
  }

  async update(req: Users) {
    let postdata: ActionReq<Users> = new ActionReq<Users>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Users>>(
      this.baseurl + '/update',
      postdata,
    );
    return resp.item!;
  }

  async delete(req: UsersDeleteReq) {
    let postdata: ActionReq<UsersDeleteReq> = new ActionReq<UsersDeleteReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/delete',
      postdata,
    );
    return resp.item!;
  }

  // NOTE: register, login, and getotp have been moved to AuthService
  // These methods are kept for backward compatibility but will redirect to AuthService
  // TODO: Update all callers to use AuthService directly
  
  async register(req: UsersRegisterReq) {
    // Redirect to AuthService
    const { AuthService } = await import('./auth.service');
    const authService = new AuthService();
    return authService.register(req);
  }

  async login(req: UsersLoginReq) {
    // Redirect to AuthService
    const { AuthService } = await import('./auth.service');
    const authService = new AuthService();
    return authService.login(req);
  }

  async SelectUser(req: UsersLoginReq) {
    let postdata: ActionReq<UsersLoginReq> = new ActionReq<UsersLoginReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/SelectUser',
      postdata,
    );
    return resp.item!;
  }

  async getotp(req: UsersGetOtpReq) {
    // Redirect to AuthService
    const { AuthService } = await import('./auth.service');
    const authService = new AuthService();
    return authService.getOtp(req);
  }

  async verifyotp(req: UsersLoginReq) {
    // verifyotp is the same as login - redirect to AuthService
    const { AuthService } = await import('./auth.service');
    const authService = new AuthService();
    return authService.login(req);
  }

  async getSupplierInviteScreen(req: UsersSupplierInviteScreenReq) {
    let postdata: ActionReq<UsersSupplierInviteScreenReq> = new ActionReq<UsersSupplierInviteScreenReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<UsersSupplierInviteScreenRes>>>(
      this.baseurl + '/getSupplierInviteScreen',
      postdata,
    );
    return resp.item!;
  }

  async sendConnectionRequest(req: UsersConnectionRequestReq) {
    let postdata: ActionReq<UsersConnectionRequestReq> = new ActionReq<UsersConnectionRequestReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/sendConnectionRequest',
      postdata,
    );
    return resp.item!;
  }

  async acceptConnectionRequest(req: UsersAcceptConnectionRequestReq) {
    let postdata: ActionReq<UsersAcceptConnectionRequestReq> = new ActionReq<UsersAcceptConnectionRequestReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/acceptConnectionRequest',
      postdata,
    );
    return resp.item!;
  }

  async addColourSetToCart(req: UsersAddColourSetToCartReq) {
    let postdata: ActionReq<UsersAddColourSetToCartReq> = new ActionReq<UsersAddColourSetToCartReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/addColourSetToCart',
      postdata,
    );
    return resp.item!;
  }

  async updateOrderStatus(req: UserUpdateOrderStatusReq) {
    let postdata: ActionReq<UserUpdateOrderStatusReq> = new ActionReq<UserUpdateOrderStatusReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/updateOrderStatus',
      postdata,
    );
    return resp.item!;
  }

  async mergeDesign(req: UsersMergeDesign) {
    let postdata: ActionReq<UsersMergeDesign> = new ActionReq<UsersMergeDesign>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/mergeDesign',
      postdata,
    );
    return resp.item!;
  }

  async deleteOrganisation(req: Organisationdeletereq) {
    let postdata: ActionReq<Organisationdeletereq> = new ActionReq<Organisationdeletereq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/deleteOrganisation',
      postdata,
    );
    return resp.item!;
  }

  async DeleteOrganisationPermananet(req: Organisationdeletereq) {
    let postdata: ActionReq<Organisationdeletereq> = new ActionReq<Organisationdeletereq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/DeleteOrganisationPermananet',
      postdata,
    );
    return resp.item!;
  }

  async Deleteuserpermanent(req: Organisationdeletereq) {
    let postdata: ActionReq<Organisationdeletereq> = new ActionReq<Organisationdeletereq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/Deleteuserpermanent',
      postdata,
    );
    return resp.item!;
  }

  async UpdatePushToken(userId: number, pushToken: string, platform: string = 'android'): Promise<boolean> {
    try {
      console.log('📡 Calling UpdatePushToken API...', {
        userId,
        pushTokenLength: pushToken.length,
        platform,
        endpoint: this.baseurl + '/UpdatePushToken'
      });
      
      // Backend expects UpdatePushTokenRequest directly (not wrapped in ActionReq)
      const requestData = {
        UserId: userId,
        PushToken: pushToken,
        Platform: platform
      };
      
      const resp = await this.http.post<ActionRes<boolean>>(
        this.baseurl + '/UpdatePushToken',
        requestData,
      );
      
      console.log('📡 UpdatePushToken API response:', {
        success: resp.item || false,
        hasResponse: !!resp,
        responseItem: resp.item
      });
      
      return resp.item || false;
    } catch (error: any) {
      console.error('❌ Error updating push token API call:', error);
      console.error('❌ API Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        url: error?.config?.url,
        requestData: error?.config?.data
      });
      return false;
    }
  }
}
