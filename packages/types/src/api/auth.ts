import { AppRawRule } from "../casl";
import { Role } from "../entities/user";
export interface JwtPayload {
  sub: string; // userId
  phone: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export type OtpSentReply = undefined;

export interface OtpVerifyReply {
  isNew: boolean;
}

export type LogoutReply = undefined;
export interface MeUser {
  id: string;
  phone: string;
  role: string;
  username: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string; // ISO
}
export type MeReply = {
  userId: string | null;
  user: MeUser;
  rules: AppRawRule[];
};

export type LoginMethod = "otp" | "password" | "qr";
export type LoginStatus = "success" | "failed";

export interface LoginHistoryItem {
  id: string;
  method: LoginMethod;
  status: LoginStatus;
  isNewUser: boolean;
  ip: string | null;
  userAgent: string | null;
  createdAt: string; // ISO
}

export type LoginHistoryReply = LoginHistoryItem[];