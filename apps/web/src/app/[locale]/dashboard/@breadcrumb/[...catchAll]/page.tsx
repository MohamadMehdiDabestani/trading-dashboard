
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage as UIBreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getBreadcrumbLabel } from "@/lib/breadcrumbs";


type Props = {
  params: Promise<{
    catchAll?: string[];
  }>;
};

export default async function BreadcrumbPage({ params }: Props) {
  const { catchAll = [] } = await params;
  const segments = catchAll;
  const allSegments = ["dashboard", ...segments];
  const items = await Promise.all(
    allSegments.map(async (segment) => ({
      segment,
      label: await getBreadcrumbLabel(segment),
    }))
  );

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const href =
            index === 0
              ? "/dashboard"
              : "/dashboard/" + segments.slice(0, index).join("/");

          const isLast = index === items.length - 1;

          return (
            <div key={`${item.segment}-${index}`} className="flex items-center gap-2">
              <BreadcrumbItem>
                {isLast ? (
                  <UIBreadcrumbPage>{item.label}</UIBreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
