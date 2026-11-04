"use client";

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
import type { LoginMethod } from "@repo/types";
import { cn } from "@/lib/cn";
import { useLoginHistory } from "@/features/auth/hooks/useAuthMutations";

const METHOD_LABEL: Record<LoginMethod, string> = {
  otp: "کد پیامکی",
  password: "رمز عبور",
  qr: "QR کد",
};

function parseUserAgent(ua: string | null) {
  if (!ua) return { label: "نامشخص", mobile: false };

  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  // order matters: Android UAs contain "Linux", iOS UAs contain "Mac OS X"
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";

  return { label: os ? `${browser} / ${os}` : browser, mobile };
}

/** 188.158.12.34 -> 188.158.xx.xx ; IPv6 -> first 2 groups */
function maskIp(ip: string | null) {
  if (!ip) return "—";
  if (ip.includes(".")) {
    const p = ip.split(".");
    return p.length === 4 ? `${p[0]}.${p[1]}.xx.xx` : ip;
  }
  return `${ip.split(":").slice(0, 2).join(":")}:xx`;
}

export const SecuritySettings = () => {
  const locale = useLocale();
  const { data, isLoading, isError, refetch } = useLoginHistory();

  const fmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });

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

        {/* تاریخچه ورودها */}
        <div className="pt-4">
          <p className="text-xs font-bold text-muted-foreground mb-3 text-start">
            تاریخچه ورودهای اخیر به حساب
          </p>
          <div className="rounded-lg border border-border/50 overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-start text-xs font-bold">
                      تاریخ و زمان
                    </TableHead>
                    <TableHead className="text-start text-xs font-bold">
                      مرورگر / دستگاه
                    </TableHead>
                    <TableHead className="text-start text-xs font-bold">
                      روش ورود
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
                  {isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-xs text-muted-foreground py-6"
                      >
                        در حال بارگذاری...
                      </TableCell>
                    </TableRow>
                  )}

                  {isError && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs py-6">
                        <span className="text-destructive">
                          دریافت تاریخچه ناموفق بود.
                        </span>{" "}
                        <button
                          type="button"
                          onClick={() => refetch()}
                          className="underline text-primary"
                        >
                          تلاش مجدد
                        </button>
                      </TableCell>
                    </TableRow>
                  )}

                  {data?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-xs text-muted-foreground py-6"
                      >
                        هنوز ورودی ثبت نشده است.
                      </TableCell>
                    </TableRow>
                  )}

                  {data?.map((item) => {
                    const ua = parseUserAgent(item.userAgent);
                    const success = item.status === "success";
                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-xs " dir="ltr">
                          {fmt.format(new Date(item.createdAt))}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="flex items-center gap-2">
                            {ua.mobile ? (
                              <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            {ua.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {METHOD_LABEL[item.method]}
                          {item.isNewUser && (
                            <span className="text-muted-foreground"> (ثبت‌نام)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono" dir="ltr">
                          {maskIp(item.ip)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 w-fit",
                              success
                                ? "text-success border-success/30 bg-success/10"
                                : "text-destructive border-destructive/30 bg-destructive/10",
                            )}
                          >
                            {!success && <AlertCircle className="h-3 w-3" />}
                            {success ? "موفق" : "ناموفق"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};