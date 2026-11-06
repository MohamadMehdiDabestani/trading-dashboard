"use client";

import { useLocale, useTranslations } from "next-intl";
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
import type { LoginMethod } from "@repo/types";
import { cn } from "@/lib/cn";
import { useLoginHistory } from "@/features/auth/hooks/useAuthMutations";

function parseUserAgent(ua: string | null) {
  if (!ua) return { label: null, mobile: false };

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
  const t = useTranslations("account.security");
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
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-muted/10">
          <div className="text-start">
            <p className="text-sm font-bold">{t("twoFactor.title")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("twoFactor.description")}
            </p>
          </div>
          <Switch dir="ltr" />
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-muted/10">
          <div className="text-start">
            <p className="text-sm font-bold">{t("smsAlerts.title")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("smsAlerts.description")}
            </p>
          </div>
          <Switch dir="ltr" defaultChecked />
        </div>

        <div className="pt-4">
          <p className="text-xs font-bold text-muted-foreground mb-3 text-start">
            {t("loginHistory.title")}
          </p>
          <div className="rounded-lg border border-border/50 overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-start text-xs font-bold">
                      {t("loginHistory.columns.date")}
                    </TableHead>
                    <TableHead className="text-start text-xs font-bold">
                      {t("loginHistory.columns.device")}
                    </TableHead>
                    <TableHead className="text-start text-xs font-bold">
                      {t("loginHistory.columns.method")}
                    </TableHead>
                    <TableHead className="text-start text-xs font-bold">
                      {t("loginHistory.columns.ip")}
                    </TableHead>
                    <TableHead className="text-start text-xs font-bold">
                      {t("loginHistory.columns.status")}
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
                        {t("loginHistory.loading")}
                      </TableCell>
                    </TableRow>
                  )}

                  {isError && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs py-6">
                        <span className="text-destructive">
                          {t("loginHistory.error")}
                        </span>{" "}
                        <button
                          type="button"
                          onClick={() => refetch()}
                          className="underline text-primary"
                        >
                          {t("loginHistory.retry")}
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
                        {t("loginHistory.empty")}
                      </TableCell>
                    </TableRow>
                  )}

                  {data?.map((item) => {
                    const ua = parseUserAgent(item.userAgent);
                    const success = item.status === "success";
                    const methodLabel = t(
                      `loginMethods.${item.method as LoginMethod}`,
                    );

                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-xs" dir="ltr">
                          {fmt.format(new Date(item.createdAt))}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="flex items-center gap-2">
                            {ua.mobile ? (
                              <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            {ua.label ?? t("unknownDevice")}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {methodLabel}
                          {item.isNewUser && (
                            <span className="text-muted-foreground">
                              {" "}
                              {t("loginHistory.newUserSuffix")}
                            </span>
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
                            {success
                              ? t("loginHistory.statusSuccess")
                              : t("loginHistory.statusFailed")}
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