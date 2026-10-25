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

export const deviceLinkApi = {

  create: () => apiFetch<CreatedLink>(BASE, { method: "POST", body: EMPTY_BODY }),
  get: (id: string) => apiFetch<OwnerView>(`${BASE}/${id}`),
  approve: (id: string, code: string) =>
    apiFetch<null>(`${BASE}/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  deny: (id: string) =>
    apiFetch<null>(`${BASE}/${id}/deny`, { method: "POST", body: EMPTY_BODY }),

  // second device
  open: (token: string) =>
    apiFetch<{ requestId: string; verificationCode: string }>(`${BASE}/open`, {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  status: (id: string) => apiFetch<{ status: PollStatus }>(`${BASE}/${id}/status`),
};
