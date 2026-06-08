export interface JwtPayload {
  sub: string; // userId
  phone: string;
  iat?: number;
  exp?: number;
}

export interface RefreshReply {
  accessToken: string;
}

export type OtpSentReply = undefined;

export interface OtpVerifyReply {
  accessToken: string;
  isNew: boolean;
}

export type LogoutReply = undefined