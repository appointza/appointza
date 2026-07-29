
import { UsersGetOtpReq, UsersLoginReq, UsersContext } from '@/models/users.model';

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

export class DummyAuthService {
  static async getOtp(request: UsersGetOtpReq): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('DummyAuthService: OTP sent successfully for:', request.mobile);
  }

  static async verifyOtp(request: UsersLoginReq): Promise<LoginResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('DummyAuthService: Verifying OTP for:', request.mobile);
    
    // Create dummy response that works for both user types
    const loginResponse: LoginResponse = {
      data: {
        id: 123,
        mobile: request.mobile,
        organisationid: 456, // Always provide org ID for potential switching
        locationid: 789,
        firstname: 'Test User',
        lastname: 'Demo',
        email: 'test@example.com'
      }
    };
    
    // Store user data and auth token
    localStorage.setItem('user_data', JSON.stringify(loginResponse.data));
    localStorage.setItem('auth_token', 'dummy_token_' + Date.now());
    
    // Enable switching for all users - this allows anyone to switch between modes
    localStorage.setItem('can_switch_mode', 'true');
    
    // Note: Do NOT set user_type here - let the calling code handle it
    // This ensures the user's selection is respected
    
    console.log('DummyAuthService: User data stored successfully');
    console.log('DummyAuthService: Can switch modes: true (enabled for all users)');
    return loginResponse;
  }

  static getUserType(): 'user' | 'organization' | null {
    return localStorage.getItem('user_type') as 'user' | 'organization' | null;
  }

  static canSwitchMode(): boolean {
    const canSwitch = localStorage.getItem('can_switch_mode') === 'true';
    console.log('DummyAuthService: canSwitchMode check =', canSwitch);
    return canSwitch;
  }

  static isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  static getUserData() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  static logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_data');
    localStorage.removeItem('can_switch_mode');
  }

  // Method to set user type - this is now the primary way to set user type
  static setUserType(userType: 'user' | 'organization'): void {
    localStorage.setItem('user_type', userType);
    console.log('DummyAuthService: User type set to:', userType);
  }
}
