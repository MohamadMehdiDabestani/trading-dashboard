import type { ForcedSubject } from "@casl/ability";
import { OrderStatus } from "@repo/types";

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
