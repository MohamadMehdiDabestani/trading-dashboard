import { apiFetch } from "@/lib/apiClient";

const BASE = "auth/device-link";

const EMPTY_BODY = JSON.stringify({});

export type LinkStatus =
  | "pending"
  | "opened"
  | "approved"
  | "denied"
  | "consumed";

export type CreatedLink = {
  id: string;
  url: string;
  qrSvg: string;
  expiresAt: string;
};

export type OwnerView = {
  id: string;
  status: LinkStatus;
  openerIp: string | null;
  openerUserAgent: string | null;
  openedAt: string | null;
  expiresAt: string;
};

export type PollStatus =
  | "waiting"
  | "approved"
  | "denied"
  | "expired"
  | "consumed";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch<T>(path, init);
  if (!res.success) throw new Error(res.error.code ?? "UNEXPECTED_RESPONSE");
  return res.data as T;
}

export const deviceLinkApi = {

  create: () => call<CreatedLink>(BASE, { method: "POST", body: EMPTY_BODY }),
  get: (id: string) => call<OwnerView>(`${BASE}/${id}`),
  approve: (id: string, code: string) =>
    call<null>(`${BASE}/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  deny: (id: string) =>
    call<null>(`${BASE}/${id}/deny`, { method: "POST", body: EMPTY_BODY }),

  // second device
  open: (token: string) =>
    call<{ requestId: string; verificationCode: string }>(`${BASE}/open`, {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  status: (id: string) => call<{ status: PollStatus }>(`${BASE}/${id}/status`),
};
