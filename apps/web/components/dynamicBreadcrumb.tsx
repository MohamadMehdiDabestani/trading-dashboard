"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const labelMap: Record<string, string> = {
  dashboard: "داشبورد",
  wallet: "کیف پول",
  settings: "تنظیمات",
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const locale = useLocale();

  // حذف locale prefix و split کردن
  const segments = pathname
    .replace(/^\/(fa|en)/, "")
    .split("/")
    .filter(Boolean);

  // اگه فقط dashboard هست یا هیچی، نشون نده
  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href =
            "/" +
            locale +
            "/" +
            segments.slice(0, index + 1).join("/");
          const label = labelMap[segment] ?? segment;

          return (
            <span key={segment} className="flex items-center gap-1.5">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
