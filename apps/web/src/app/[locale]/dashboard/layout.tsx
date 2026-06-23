import { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useLocale } from "next-intl";

export default function Layout({ children , breadcrumb}: { children: ReactNode , breadcrumb: ReactNode; }) {
  const locale = useLocale();
  return (
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
        <div className="p-4 pt-0">

        {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
