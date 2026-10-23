"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

type Phase =
  | "ready"
  | "opening"
  | "waiting"
  | "success"
  | "denied"
  | "expired"
  | "invalid";

const POST_LOGIN_PATH = "/"; 

export default function DeviceLinkPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  // لینک فقط با کلیک کاربر مصرف می‌شود (نه موقع لود صفحه)،
  // تا پیش‌نمایش‌سازهای لینک آن را نسوزانند.
  const open = useMutation({ mutationFn: () => deviceLinkApi.open(token) });
  const requestId = open.data?.requestId;

  const poll = useQuery({
    queryKey: ["device-link-status", requestId],
    queryFn: () => deviceLinkApi.status(requestId!),
    enabled: !!requestId,
    // خطای ۴xx (کوکی/درخواست نامعتبر) retry ندارد؛ خطای شبکه ۲ بار
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
    const t = setTimeout(() => {
      router.replace(POST_LOGIN_PATH);
      router.refresh();
    }, 800);
    return () => clearTimeout(t);
  }, [s, router]);

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-dashboard p-4"
    >
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>ورود با QR</CardTitle>
          <CardDescription>
            ورود به حساب با تایید یک دستگاه دیگر
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          {(phase === "ready" || phase === "opening") && (
            <>
              <ShieldQuestion className="size-12 text-primary" />
              <p className="text-sm text-muted-foreground">
                برای ادامه، روی دکمه زیر بزنید. سپس یک کد ۴ رقمی نمایش داده
                می‌شود که باید روی دستگاه لاگین‌شده وارد کنید.
              </p>
              <Button
                className="w-full"
                disabled={phase === "opening"}
                onClick={() => open.mutate()}
              >
                {phase === "opening" && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                ادامه
              </Button>
            </>
          )}

          {phase === "waiting" && (
            <>
              <p className="text-sm text-muted-foreground">
                این کد را روی دستگاه لاگین‌شده وارد و تایید کنید:
              </p>
              <div
                className="rounded-xl border border-border bg-muted px-8 py-4 text-5xl font-bold tracking-widest tabular-nums"
                dir="ltr"
              >
                {open.data?.verificationCode}
              </div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                منتظر تایید...
              </p>
            </>
          )}

          {phase === "success" && (
            <>
              <CheckCircle2 className="size-12 text-success" />
              <p className="font-medium">با موفقیت وارد شدید.</p>
            </>
          )}

          {(phase === "denied" ||
            phase === "expired" ||
            phase === "invalid") && (
            <>
              <XCircle className="size-12 text-destructive" />
              <p className="font-medium">
                {phase === "denied" && "درخواست رد شد."}
                {phase === "expired" && "زمان درخواست تمام شد."}
                {phase === "invalid" &&
                  "این لینک معتبر نیست یا قبلاً استفاده شده."}
              </p>
              <p className="text-sm text-muted-foreground">
                از دستگاه لاگین‌شده یک QR جدید بسازید.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}