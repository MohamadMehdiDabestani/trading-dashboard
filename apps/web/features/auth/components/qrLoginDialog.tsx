"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import {
  CheckCircle2,
  Loader2,
  QrCode,
  ShieldAlert,
  Smartphone,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { ApiError } from "@/lib/apiError";
import { deviceLinkApi } from "@/features/account/api/qrLogin";
import {  zodField, zodForm } from "@/lib/tanstackValidation";
import { deviceLinkCodeSchema } from "../schema/schema";
import { fourDigitCode } from "@/lib/primitivesValidations";

const OtpInput = dynamic(() => import("@/components/ui/otp"), {
  ssr: false,
});

type Phase =
  | "creating"
  | "waiting"
  | "opened"
  | "approving"
  | "done"
  | "denied"
  | "expired"
  | "error";

const TERMINAL = ["approved", "consumed", "denied"];

function describeUA(ua?: string | null) {
  // ... بدون تغییر
  if (!ua) return "دستگاه ناشناس";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "مرورگر ناشناس";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iOS/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "سیستمعامل ناشناس";
  return `${browser} روی ${os}`;
}

export function QrLoginDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const create = useMutation({ mutationFn: deviceLinkApi.create });
  const link = create.data ?? null;

  const owner = useQuery({
    queryKey: ["device-link", link?.id],
    queryFn: () => deviceLinkApi.get(link!.id),
    enabled: !!link && !rejected,
    retry: false,
    refetchInterval: (q) => {
      const d = q.state.data;
      if (d && TERMINAL.includes(d.status)) return false;
      const end = Date.parse(d?.expiresAt ?? link?.expiresAt ?? "");
      return Number.isFinite(end) && Date.now() >= end ? false : 2000;
    },
  });

  const codeForm = useForm({
    defaultValues: { code: "" },
    validators: { onSubmit: zodForm(deviceLinkCodeSchema) },
    onSubmit: async ({ value }) => {
      try {
        await approve.mutateAsync(value.code);
      } catch {
        /* in onError */
      }
    },
  });

  const approve = useMutation({
    mutationFn: (c: string) => deviceLinkApi.approve(link!.id, c),
    onSuccess: () => toast.success("دستگاه جدید وارد حساب شما شد"),
    onError: (e) => {
      codeForm.reset();
      void qc.invalidateQueries({ queryKey: ["device-link", link?.id] });
      toast.error(
        e instanceof ApiError && String(e.code) === "DEVICE_LINK_CODE_INVALID"
          ? "کد اشتباه است"
          : "تایید ناموفق بود",
      );
    },
  });

  const reject = useMutation({
    mutationFn: () => deviceLinkApi.deny(link!.id),
    onSettled: () => setRejected(true),
  });

  useEffect(() => {
    if (!open || !link) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open, link]);

  const status = owner.data?.status;
  const expiresAt = owner.data?.expiresAt ?? link?.expiresAt;
  const secondsLeft = expiresAt
    ? Math.max(0, Math.round((Date.parse(expiresAt) - now) / 1000))
    : 0;
  const expired = !!expiresAt && secondsLeft === 0;

  const phase: Phase = !link
    ? create.isError
      ? "error"
      : "creating"
    : approve.isPending
      ? "approving"
      : approve.isSuccess || status === "approved" || status === "consumed"
        ? "done"
        : rejected || status === "denied"
          ? "denied"
          : expired
            ? "expired"
            : status === "opened"
              ? "opened"
              : "waiting";

  function start() {
    create.reset();
    approve.reset();
    codeForm.reset();
    setRejected(false);
    create.mutate();
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) start();
    else if (link && (phase === "waiting" || phase === "opened")) {
      void deviceLinkApi.deny(link.id).catch(() => {});
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-6 w-full gap-2">
          <QrCode className="size-4" />
          ورود دستگاه دیگر با QR
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm [&>button]:inset-e-4 rtl:[&>button]:right-[unset]">
        <DialogHeader>
          <DialogTitle>ورود دستگاه دیگر</DialogTitle>
          <DialogDescription>
            با دستگاهی که وارد حساب نشده، QR را اسکن کنید.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2 text-center">
          {phase === "creating" && (
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          )}

          {phase === "waiting" && link && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="QR code ورود"
                className="size-52 rounded-lg border border-border/50 bg-white p-2"
                src={`data:image/svg+xml;utf8,${encodeURIComponent(link.qrSvg)}`}
              />
              <p className="text-sm text-muted-foreground">
                منتظر اسکن... این کد تا{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {secondsLeft}
                </span>{" "}
                ثانیه دیگر معتبر است.
              </p>
            </>
          )}

          {(phase === "opened" || phase === "approving") && (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
                <ShieldAlert className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">
                  یک دستگاه جدید میخواهد وارد حساب شما شود
                </p>
                <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <Smartphone className="size-4" />
                  {describeUA(owner.data?.openerUserAgent)}
                </p>
                <p
                  className="text-xs text-muted-foreground tabular-nums"
                  dir="ltr"
                >
                  IP: {owner.data?.openerIp ?? "—"}
                </p>
              </div>

              <div className="w-full space-y-2">
                <p className="text-sm">
                  کد ۴ رقمی نمایشدادهشده روی دستگاه جدید را وارد کنید:
                </p>

                <codeForm.Field
                  name="code"
                  validators={{ onChange: zodField(fourDigitCode) }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    const isComplete = field.state.value.length === 4;

                    return (
                      <>
                        <Field data-invalid={isInvalid || approve.isError}>
                          <OtpInput
                            length={4}
                            value={field.state.value}
                            onChange={(v) => {
                              approve.reset(); // با هر تایپ، خطای سرور پاک شود
                              field.handleChange(v);
                            }}
                            onBlur={field.handleBlur}
                            onComplete={() => codeForm.handleSubmit()}
                            disabled={phase === "approving"}
                            error={isInvalid || approve.isError}
                            aria-label="کد تایید دستگاه جدید"
                          />
                          {/* <FieldError
                            errors={fieldMessages(field.state.meta.errors)}
                          /> */}
                          {approve.isError && !isInvalid && (
                            <p className="text-xs text-destructive">
                              کد اشتباه بود. دوباره تلاش کنید.
                            </p>
                          )}
                        </Field>

                        <Button
                          className="w-full"
                          disabled={!isComplete || phase === "approving"}
                          onClick={() => codeForm.handleSubmit()}
                        >
                          {phase === "approving" && (
                            <Loader2 className="size-4 animate-spin" />
                          )}
                          تایید ورود
                        </Button>
                      </>
                    );
                  }}
                />
              </div>

              <Button
                variant="ghost"
                className="text-destructive w-full"
                color="destructive"
                disabled={phase === "approving" || reject.isPending}
                onClick={() => reject.mutate()}
              >
                این من نیستم
              </Button>
              <p className="text-xs text-muted-foreground">
                {secondsLeft} ثانیه برای تصمیم باقی مانده است.
              </p>
            </>
          )}

          {phase === "done" && (
            <>
              <CheckCircle2 className="size-12 text-success" />
              <p className="font-medium">دستگاه جدید وارد شد.</p>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                بستن
              </Button>
            </>
          )}

          {(phase === "denied" || phase === "expired" || phase === "error") && (
            <>
              <XCircle className="size-12 text-destructive" />
              <p className="font-medium">
                {phase === "denied" && "درخواست لغو شد."}
                {phase === "expired" && "زمان این QR تمام شد."}
                {phase === "error" && "ساخت QR ناموفق بود."}
              </p>
              <Button onClick={start}>ساخت QR جدید</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
