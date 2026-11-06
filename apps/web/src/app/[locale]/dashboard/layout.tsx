import { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardNavbar } from "@/components/dashboard-navbar";
import {
  SidebarInset,
  SidebarProvider,
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
import { AssistantWidget } from "@/components/assistanceWidget";

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
        <SidebarInset className="min-w-0">
          <DashboardNavbar breadcrumb={breadcrumb} />
          <div className="p-4 flex-1 min-w-0 w-full">{children}</div>
          <Footer />
        </SidebarInset>
        <AssistantWidget />
      </SidebarProvider>
    </HydrationBoundary>
  );
}
