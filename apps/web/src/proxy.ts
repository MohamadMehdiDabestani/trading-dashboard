import { routing } from "@/i18n/routing";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
function isExpired(token?: string, skew = 30) {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;

    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(b64)) as { exp?: number };
    if (typeof exp !== "number") return true;

    return exp * 1000 - skew * 1000 < Date.now();
  } catch {
    return true;
  }
}
const handleI18nRouting = createMiddleware(routing);
export default function proxy(request: NextRequest) {
  console.log("proxy ===");
  const access = request.cookies.get("access_token")?.value;
  const refresh = request.cookies.get("refresh_token")?.value;
  console.log("proxy", request.nextUrl.pathname, {
    hasAccess: !!access,
    hasRefresh: !!refresh,
    expired: isExpired(access),
  });
  const isPrefetch =
  request.headers.get("next-router-prefetch") ||
  request.headers.get("purpose") === "prefetch" ||
  request.headers.has("rsc");
  if (isExpired(access) && refresh && !isPrefetch) {
    console.log("expired");
    const url = new URL("/api/auth/refresh-redirect", request.url);
    url.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(url);
  }

  const res = handleI18nRouting(request);
  res.headers.set(
    "x-pathname",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|.*/opengraph-image|.*\\..*).*)", "/"],
};
