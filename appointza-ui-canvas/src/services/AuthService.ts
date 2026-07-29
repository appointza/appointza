
import { DummyAuthService } from './DummyAuthService';
import { UsersGetOtpReq, UsersLoginReq } from '@/models/users.model';

export interface LoginResponse {
  data: {
    id: number;
    mobile: string;
    organisationid: number;
    locationid: number;
    firstname?: string;
    lastname?: string;
    email?: string;
  };
}

export class AuthService {
  static async getOtp(request: UsersGetOtpReq): Promise<void> {
    return DummyAuthService.getOtp(request);
  }

  static async verifyOtp(request: UsersLoginReq): Promise<LoginResponse> {
    return DummyAuthService.verifyOtp(request);
  }

  static getUserType(): 'user' | 'organization' | null {
    return DummyAuthService.getUserType();
  }

  static canSwitchMode(): boolean {
    return DummyAuthService.canSwitchMode();
  }

  static isLoggedIn(): boolean {
    return DummyAuthService.isLoggedIn();
  }

  static getUserData() {
    return DummyAuthService.getUserData();
  }

  static logout(): void {
    DummyAuthService.logout();
  }

  static setUserType(userType: 'user' | 'organization'): void {
    DummyAuthService.setUserType(userType);
  }
}
