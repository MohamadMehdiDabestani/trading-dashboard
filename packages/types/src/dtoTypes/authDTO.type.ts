export interface EditProfileDto {
  userName?: string;
  email?: string;
}

export interface OtpSendDto {
  phone : string
}

export interface OtpVerifyDto {
  phone : string,
  code : string
}
export interface PasswordLoginDto {
  phone: string;
  password: string;
}

export interface RegisterDto {
  phone: string;
  userName: string;
  password: string;
}