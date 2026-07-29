
export interface UsersGetOtpReq {
  mobile: string;
}

export interface UsersLoginReq {
  mobile: string;
  otp: string;
}
