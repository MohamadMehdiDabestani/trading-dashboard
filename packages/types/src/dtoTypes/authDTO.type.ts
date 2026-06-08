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