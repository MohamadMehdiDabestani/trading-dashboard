"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldQuestion, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/apiError";
import { deviceLinkApi } from "@/features/account/api/qrLogin";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/lib/i18nNavigation";
import { LandingHeaderControls } from "@/features/landing/components/landingHeaderControls";

type Phase =
  | "ready"
  | "opening"
  | "waiting"
  | "success"
  | "denied"
  | "expired"
  | "invalid";

const POST_LOGIN_PATH = "/dashboard";

export function DeviceLinkView({ token }: { token: string }) {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "fa";

  const t = useTranslations("deviceLink");
  const buttons = useTranslations("common.buttons");
  const open = useMutation({ mutationFn: () => deviceLinkApi.open(token) });
  const requestId = open.data?.requestId;
  const pollSecret = open.data?.pollSecret;

  const poll = useQuery({
    queryKey: ["device-link-status", requestId, pollSecret],
    queryFn: () => deviceLinkApi.status(requestId!, pollSecret),
    enabled: !!requestId,
    // Network errors retry up to 2 times; 4xx errors fail immediately without retry
    retry: (count, e) => !(e instanceof ApiError) && count < 2,
    refetchInterval: (q) => {
      if (q.state.status === "error") return false;
      const s = q.state.data?.status;
      return !s || s === "waiting" ? 2000 : false;
    },
  });

  const s = poll.data?.status;

  const phase: Phase =
    open.isError || poll.isError
      ? "invalid"
      : s === "approved"
        ? "success"
        : s === "denied"
          ? "denied"
          : s === "expired" || s === "consumed"
            ? "expired"
            : open.isSuccess
              ? "waiting"
              : open.isPending
                ? "opening"
                : "ready";

  useEffect(() => {
    if (s !== "approved") return;
    const timer = setTimeout(() => {
      router.replace(POST_LOGIN_PATH);
      router.refresh();
    }, 800);
    return () => clearTimeout(timer);
  }, [s, router]);

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="flex min-h-screen flex-col items-center justify-center bg-dashboard p-4"
    >
      <div className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-end">
          <LandingHeaderControls />
        </div>

        <Card className="w-full text-center shadow-lg border-border/80">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4">
            {(phase === "ready" || phase === "opening") && (
              <>
                <ShieldQuestion className="size-12 text-primary" />
                <p className="text-sm text-muted-foreground">{t("readyHint")}</p>
                <Button
                  className="w-full"
                  disabled={phase === "opening" || !token}
                  onClick={() => open.mutate()}
                >
                  {phase === "opening" && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {buttons("continue")}
                </Button>
              </>
            )}

            {phase === "waiting" && (
              <>
                <p className="text-sm text-muted-foreground">
                  {t("waitingHint")}
                </p>
                <div
                  className="rounded-xl border border-border bg-muted px-8 py-4 text-5xl font-bold tracking-widest tabular-nums"
                  dir="ltr"
                >
                  {open.data?.verificationCode}
                </div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t("waitingStatus")}
                </p>
              </>
            )}

            {phase === "success" && (
              <>
                <CheckCircle2 className="size-12 text-success" />
                <p className="font-medium">{t("success")}</p>
              </>
            )}

            {(phase === "denied" ||
              phase === "expired" ||
              phase === "invalid") && (
              <>
                <XCircle className="size-12 text-destructive" />
                <p className="font-medium">
                  {phase === "denied" && t("denied")}
                  {phase === "expired" && t("expired")}
                  {phase === "invalid" && t("invalid")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("regenerateHint")}
                </p>
                <Link href="/auth" className="w-full mt-2">
                  <Button variant="outline" className="w-full">
                    {buttons("cancel")}
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
