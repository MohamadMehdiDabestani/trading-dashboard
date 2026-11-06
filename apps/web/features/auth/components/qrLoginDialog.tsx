"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { FieldGroup } from "@/components/ui/field";
import { ApiError } from "@/lib/apiError";
import { deviceLinkApi } from "@/features/account/api/qrLogin";
import { fieldValidators, validationLogic } from "@/lib/validation/fieldValidator";
import { fourDigitCode } from "@/lib/validation/primitivesValidations";
import { useAppForm } from "@/components/form";
import { setFieldError } from "@/lib/validation/applyFieldErrors";
import { useLocale, useTranslations } from "next-intl";

const codeValidators = fieldValidators(fourDigitCode);

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

function describeUA(
  ua: string | null | undefined,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (!ua) return t("ua.unknownDevice");
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
            : t("ua.unknownBrowser");
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
            : t("ua.unknownOs");
  return t("ua.deviceOnOs", { browser, os });
}

export function QrLoginDialog() {
  const t = useTranslations("auth.qrDialog");
  const locale = useLocale();
  const isRtl = locale === "fa";

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

  const codeForm = useAppForm({
    validationLogic,
    defaultValues: { code: "" },
    onSubmit: async ({ value }) => {
      try {
        await approve.mutateAsync(value.code);
      } catch {
        /* handled in onError */
      }
    },
  });

  const approve = useMutation({
    mutationFn: (c: string) => deviceLinkApi.approve(link!.id, c),
    onSuccess: () => toast.success(t("toastSuccess")),
    onError: (e) => {
      void qc.invalidateQueries({ queryKey: ["device-link", link?.id] });

      if (e instanceof ApiError && String(e.code) === "DEVICE_LINK_CODE_INVALID") {
        codeForm.setFieldValue("code", "", { dontValidate: true });
        setFieldError(codeForm, "code", { key: "deviceLinkCodeInvalid" });
      } else {
        toast.error(t("toastFailed"));
      }
    },
  });

  const reject = useMutation({
    mutationFn: () => deviceLinkApi.deny(link!.id),
    onSettled: () => setRejected(true),
  });

  useEffect(() => {
    if (!open || !link) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
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
          {t("trigger")}
        </Button>
      </DialogTrigger>

      <DialogContent
        dir={isRtl ? "rtl" : "ltr"}
        className="sm:max-w-sm [&>button]:inset-e-4 rtl:[&>button]:right-[unset]"
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2 text-center">
          {phase === "creating" && (
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          )}

          {phase === "waiting" && link && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={t("qrAlt")}
                className="size-52 rounded-lg border border-border/50 bg-white p-2"
                src={`data:image/svg+xml;utf8,${encodeURIComponent(link.qrSvg)}`}
              />
              <p className="text-sm text-muted-foreground">
                {t("waitingScan", { seconds: secondsLeft })}
              </p>
            </>
          )}

          {(phase === "opened" || phase === "approving") && (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
                <ShieldAlert className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">{t("incomingTitle")}</p>
                <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <Smartphone className="size-4" />
                  {describeUA(owner.data?.openerUserAgent, t)}
                </p>
                <p
                  className="text-xs text-muted-foreground tabular-nums"
                  dir="ltr"
                >
                  IP: {owner.data?.openerIp ?? "—"}
                </p>
              </div>

              <form
                id="device-code-form"
                noValidate
                className="w-full space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  codeForm.handleSubmit();
                }}
              >
                <p className="text-sm">{t("codePrompt")}</p>

                <FieldGroup>
                  <codeForm.AppField name="code" validators={codeValidators}>
                    {(field) => (
                      <field.OtpField
                        length={4}
                        ariaLabel={t("otpAriaLabel")}
                      />
                    )}
                  </codeForm.AppField>
                </FieldGroup>

                <codeForm.AppForm>
                  <codeForm.Subscribe selector={(s) => s.values.code.length === 4}>
                    {(isComplete) => (
                      <codeForm.SubmitButton
                        form="device-code-form"
                        className="w-full"
                        label={t("submitButton")}
                        disabled={!isComplete}
                      />
                    )}
                  </codeForm.Subscribe>
                </codeForm.AppForm>
              </form>

              <Button
                variant="ghost"
                className="text-destructive w-full"
                color="destructive"
                disabled={phase === "approving" || reject.isPending}
                onClick={() => reject.mutate()}
              >
                {t("rejectButton")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("countdown", { seconds: secondsLeft })}
              </p>
            </>
          )}

          {phase === "done" && (
            <>
              <CheckCircle2 className="size-12 text-success" />
              <p className="font-medium">{t("successTitle")}</p>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t("closeButton")}
              </Button>
            </>
          )}

          {(phase === "denied" || phase === "expired" || phase === "error") && (
            <>
              <XCircle className="size-12 text-destructive" />
              <p className="font-medium">
                {phase === "denied" && t("denied")}
                {phase === "expired" && t("expired")}
                {phase === "error" && t("error")}
              </p>
              <Button onClick={start}>{t("retryButton")}</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
