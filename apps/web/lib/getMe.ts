import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import type { APIResult, MeReply } from "@repo/types";

export const getMe = cache(async (): Promise<MeReply | null> => {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body: APIResult<MeReply> = await res.json();
  return body.success ? body.data : null;
});