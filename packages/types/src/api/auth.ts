export interface JwtPayload {
  sub: string; // userId
  phone: string;
  iat?: number;
  exp?: number;
}


export type OtpSentReply = undefined;

export interface OtpVerifyReply {
  isNew: boolean;
}

export type LogoutReply = undefined