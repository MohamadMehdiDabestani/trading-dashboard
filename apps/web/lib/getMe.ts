import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import type { APIResult, MeReply } from "@repo/types";

export const getMe = cache(async (): Promise<MeReply | null> => {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.API_URL}/me`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("ME_FAILED");
  const body: APIResult<MeReply> = await res.json();
  return body.success ? body.data : null;
});