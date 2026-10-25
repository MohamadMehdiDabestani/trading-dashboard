import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const locale = safeNext.split("/")[1] || "fa";
  const loginUrl = new URL(`/${locale}/auth`, req.url);

  const refresh = req.cookies.get("refresh_token")?.value;
  if (!refresh) return NextResponse.redirect(loginUrl);

  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
    method: "POST",
    headers: { cookie: `refresh_token=${refresh}` },
    cache: "no-store",
  });

  if (!r.ok) {
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
    return res;
  }

  const res = NextResponse.redirect(new URL(safeNext, req.url));
  for (const sc of r.headers.getSetCookie()) {
    res.headers.append("set-cookie", sc);
  }
  return res;
}