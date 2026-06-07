export interface JwtPayload {
  sub: string; // userId
  phone: string;
  iat?: number;
  exp?: number;
}

export interface RefreshBody {
  accessToken: string;
}

export type OtpSentBody = undefined;

export interface OtpVerifyBody {
  accessToken: string;
  isNew: boolean;
}

export type LogoutBody = undefined