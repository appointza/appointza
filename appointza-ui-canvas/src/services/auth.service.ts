import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { UsersContext, UsersRegisterReq, UsersLoginReq, UsersGetOtpReq, UsersGetOtpRes } from '../models/users.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class AuthService {
  http: AxiosHelperUtils;
  
  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + '/api/Auth';
  }

  /**
   * Register a new user or organization
   */
  async register(req: UsersRegisterReq) {
    // Convert UsersRegisterReq to RegisterRequest format expected by backend
    const registerRequest = {
      organisationimageid: req.organisationimageid || 0,
      organisationname: req.organisationname || '',
      organisationgstnumber: req.organisationgstnumber || '',
      organisationtype: req.organisationtype || 0,
      secondarytypecode: req.secondarytypecode || '',
      secondarytype: req.secondarytype || 0,
      primarytype: req.primarytype || 0,
      primarytypecode: req.primarytypecode || '',
      locationname: req.locationname || '',
      locationaddressline1: req.locationaddressline1 || '',
      locationaddressline2: req.locationaddressline2 || '',
      locationcity: req.locationcity || '',
      locationstate: req.locationstate || '',
      locationcountry: req.locationcountry || '',
      locationpincode: req.locationpincode || '',
      latitude: req.latitude || 0,
      longitude: req.longitude || 0,
      googlelocation: req.googlelocation || '',
      username: req.username || '',
      useremail: req.useremail || '',
      usermobile: req.usermobile || '',
      usermobilecountrycode: req.usermobilecountrycode || '',
      userdesignation: req.userdesignation || '',
      profileimage: req.profileimage || 0,
      plan_code: req.plan_code || '',
      referral_code: (req.referral_code || '').trim(),
    };

    let postdata: ActionReq<any> = new ActionReq<any>();
    postdata.item = registerRequest;
    
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/Register',
      postdata,
      true,
    );
    const userContext = resp.item!;
    return userContext;
  }

  /**
   * Login with mobile and OTP
   */
  async login(req: UsersLoginReq) {
    const loginRequest = {
      mobile: req.mobile,
      otp: req.otp,
    };

    let postdata: ActionReq<any> = new ActionReq<any>();
    postdata.item = loginRequest;
    
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/Login',
      postdata,
      true,
    );
    const userContext = resp.item!;
    return userContext;
  }

  /**
   * Get OTP for mobile number
   */
  async getOtp(req: UsersGetOtpReq) {
    const getOtpRequest = {
      mobile: req.mobile,
      organisationtype: 0, // Default to 0, can be updated if needed
    };

    let postdata: ActionReq<any> = new ActionReq<any>();
    postdata.item = getOtpRequest;
    
    let resp = await this.http.post<ActionRes<UsersGetOtpRes>>(
      this.baseurl + '/GetOtp',
      postdata,
    );
    return resp.item!;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(userId: number, refreshToken: string) {
    const refreshTokenRequest = {
      userid: userId,
      refreshtoken: refreshToken,
    };

    let postdata: ActionReq<any> = new ActionReq<any>();
    postdata.item = refreshTokenRequest;
    
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/RefreshToken',
      postdata,
    );
    return resp.item!;
  }

  /**
   * Validate current token
   */
  async validateToken() {
    let resp = await this.http.get<ActionRes<UsersContext>>(
      this.baseurl + '/ValidateToken',
    );
    return resp.item!;
  }

  /**
   * Login with Google OAuth
   */
  async googleLogin(idToken: string, email: string, name: string, picture?: string) {
    const googleLoginRequest = {
      idToken: idToken,
      email: email,
      name: name,
      picture: picture || '',
    };

    let postdata: ActionReq<any> = new ActionReq<any>();
    postdata.item = googleLoginRequest;
    
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/GoogleLogin',
      postdata,
      true,
    );
    const userContext = resp.item!;
    return userContext;
  }
}

