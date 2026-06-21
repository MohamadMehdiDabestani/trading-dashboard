import { routing } from "@/i18n/routing";
import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  const handleI18nRouting = createMiddleware(routing);
  let response = handleI18nRouting(request);

  return response;
}

export const config = {
  matcher: [
    // Skip all paths that should not be internationalized
    "/((?!_next|.*/opengraph-image|.*\\..*).*)",

    // Necessary for base path to work
    "/",
  ],
};
