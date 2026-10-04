import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldCheck, Monitor, Smartphone, AlertCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/cn";

// داده‌های نمونه (در حالت واقعی از API می‌آید)
const loginHistory = [
  {
    id: 1,
    date: "2023-10-27 14:32",
    device: "Chrome / Win11",
    deviceType: "desktop",
    ip: "188.158.xx.xx",
    status: "success",
    isCurrent: true,
  },
  {
    id: 2,
    date: "2023-10-26 09:15",
    device: "App / iOS 16.5",
    deviceType: "mobile",
    ip: "37.129.xx.xx",
    status: "success",
    isCurrent: false,
  },
  {
    id: 3,
    date: "2023-10-25 22:10",
    device: "Firefox / Ubuntu",
    deviceType: "desktop",
    ip: "45.12.xx.xx",
    status: "failed",
    isCurrent: false,
  },
];

export const SecuritySettings = () => {

  return (
    <Card className="bg-card border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          تنظیمات امنیتی
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 2FA */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-muted/10">
          <div className="text-start">
            <p className="text-sm font-bold">تایید دو مرحله‌ای (2FA)</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              استفاده از Google Authenticator جهت افزایش امنیت ورود.
            </p>
          </div>
          <Switch dir="ltr" />
        </div>

        {/* SMS Alert */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-muted/10">
          <div className="text-start">
            <p className="text-sm font-bold">هشدارهای پیامکی تراکنش</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              ارسال سریع پیامک به محض ورود یا برداشت دارایی.
            </p>
          </div>
          <Switch dir="ltr" defaultChecked />
        </div>

        {/* جدول تاریخچه نشست‌ها */}
        <div className="pt-4">
          <p className="text-xs font-bold text-muted-foreground mb-3 text-start">
            تاریخچه ورودهای اخیر به حساب
          </p>
          <div className="rounded-lg border border-border/50 overflow-hidden bg-card">
            {/* اضافه کردن overflow-x-auto برای ریسپانسیو شدن در موبایل */}
            <div className="overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-start text-xs font-bold">
                      تاریخ و زمان
                    </TableHead>
                    <TableHead className="text-start text-xs font-bold">
                      مرورگر / دستگاه
                    </TableHead>
                    <TableHead className="text-start text-xs font-bold">
                      آدرس IP
                    </TableHead>
                    <TableHead className="text-start text-xs font-bold">
                      وضعیت
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((session) => (
                    <TableRow
                      key={session.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="text-xs font-mono" dir="ltr">
                        {session.date}
                      </TableCell>
                      <TableCell className="text-xs flex items-center gap-2">
                        {session.deviceType === "mobile" ? (
                          <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {session.device}
                      </TableCell>
                      <TableCell className="text-xs font-mono" dir="ltr">
                        {session.ip}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 w-fit",
                            session.status === "success"
                              ? "text-success border-success/30 bg-success/10"
                              : "text-destructive border-destructive/30 bg-destructive/10"
                          )}
                        >
                          {session.status === "failed" && (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {session.status === "success"
                            ? session.isCurrent
                              ? "موفق (نشست فعلی)"
                              : "موفق"
                            : "ناموفق"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};