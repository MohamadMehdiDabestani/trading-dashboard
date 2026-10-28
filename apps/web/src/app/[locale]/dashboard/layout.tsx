// dashboard layout
import { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Footer } from "@/features/components/footer";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { getMe } from "@/lib/getMe";
import { authKeys } from "@/features/auth/api/auth.keys";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

export default async function Layout({
  children,
  breadcrumb,
}: {
  children: ReactNode;
  breadcrumb: ReactNode;
}) {
  const locale = await getLocale();
  const qc = new QueryClient();
  const me = await getMe();
  if (!me) {
    const h = await headers();
    const path = h.get("x-pathname") ?? `/${locale}`;
    const hasRefresh = (await cookies()).has("refresh_token");
    if (hasRefresh) {
      redirect(`/api/auth/refresh-redirect?next=${encodeURIComponent(path)}`);
    }
    redirect(`/${locale}/auth`);
  } else qc.setQueryData(authKeys.me(), me);
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <SidebarProvider>
        <AppSidebar side={locale === "fa" ? "right" : "left"} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
              {breadcrumb}
            </div>
          </header>
          <div className="p-4 pt-0">{children}</div>
          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
