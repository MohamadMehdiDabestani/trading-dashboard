import {

  type MongoAbility,
  type RawRuleOf,
} from "@casl/ability";
import type { ForcedSubject } from "@casl/ability";
import { OrderStatus } from "../trading/order";
import { Role } from "../entities/user";

export type QrLoginStatus = "pending" | "approved" | "consumed" | "expired";

export interface SubjectMap {
  Order: { userId: string; status: OrderStatus };
  Trade: { userId: string };
  Wallet: { userId: string };
  Deposit: { userId: string };
  Market: { symbol?: string };
  User: { id: string };
  Session: { userId: string };
  QrLogin: { status: QrLoginStatus };
}

export type SubjectType = keyof SubjectMap;

export type TaggedSubject = {
  [K in SubjectType]: SubjectMap[K] & ForcedSubject<K>;
}[SubjectType];

export type AppAction =
  | "read"
  | "create"
  | "update"
  | "cancel" 
  | "approve"
  | "revoke";

export type AppAbility = MongoAbility<[AppAction, SubjectType | TaggedSubject]>;
export type AppRawRule = RawRuleOf<AppAbility>;

export type AbilityUser = {
  id: string;
  role: Role;
};
