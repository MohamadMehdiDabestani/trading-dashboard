"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useWalletDeposit } from "@/features/wallet/hooks/useWalletDeposit";
import { useWalletBalance } from "@/features/wallet/hooks/useWalletBalance";
import { useAppForm } from "@/components/form";
import {
  fieldValidators,
  validationLogic,
} from "@/lib/validation/fieldValidator";
import { applyApiFieldErrors } from "@/lib/validation/applyFieldErrors";
import { depositAmountSchema } from "@/features/wallet/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, ArrowDownCircle } from "lucide-react";

const QUICK_AMOUNTS = ["50", "100", "500", "1000"];

const amountValidator = fieldValidators(depositAmountSchema);

export interface DepositDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  asset?: string;
  onSuccess?: () => void;
}

export function DepositDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  asset = "USDT",
  onSuccess,
}: DepositDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const t = useTranslations("navbar.depositDialog");
  const actionsT = useTranslations("navbar.actions");

  const deposit = useWalletDeposit();
  const { data: balances } = useWalletBalance();

  const currentAsset = (asset || "USDT").toUpperCase();

  const assetBalance = useMemo(() => {
    return balances?.find((b) => b.asset.toUpperCase() === currentAsset);
  }, [balances, currentAsset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
    if (!nextOpen) {
      form.reset();
    }
  };

  const form = useAppForm({
    defaultValues: { amount: "" },
    validationLogic,
    onSubmit: async ({ value }) => {
      if (deposit.isPending) return;
      try {
        await deposit.mutateAsync({
          asset: currentAsset,
          amount: value.amount.trim(),
        });
        toast.success(t("success"));
        handleOpenChange(false);
        form.reset();
        onSuccess?.();
      } catch (err) {
        applyApiFieldErrors(err, form);
      }
    },
  });

  const addPreset = (val: string) => {
    const current = Number(form.getFieldValue("amount")) || 0;
    const next = String(current + Number(val));
    form.setFieldValue("amount", next);
    form.validateField("amount", "change");
  };

  const formattedBalance = Number(assetBalance?.available ?? 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: currentAsset === "USDT" ? 2 : 8,
    },
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button
            variant="default"
            color="primary"
            size="sm"
            className="h-8 gap-1.5 px-2.5 sm:px-3 font-semibold text-xs shadow-xs shrink-0"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">{actionsT("deposit")}</span>
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-md [&>button]:inset-e-4 rtl:[&>button]:right-[unset]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ArrowDownCircle className="size-4" />
            </div>
            <DialogTitle className="text-base font-bold">
              {t("title", { asset: currentAsset })}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {t("description", { asset: currentAsset })}
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-4 py-2">
            {/* Balance info pill */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/60 text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Wallet className="size-3.5" />
                <span>{t("balance", { asset: currentAsset })}</span>
              </span>
              <span dir="ltr" className="font-mono font-bold text-foreground">
                {formattedBalance} {currentAsset}
              </span>
            </div>

            {/* Global Structured Form Field */}
            <form.AppField name="amount" validators={amountValidator}>
              {(field) => (
                <field.TextField
                  label={t("amount")}
                  dir="ltr"
                  inputMode="decimal"
                  placeholder={t("placeholder")}
                  className="font-mono text-sm focus-visible:ring-primary"
                  hint={
                    <span className="text-[11px] text-muted-foreground block mt-1">
                      {t("asset")}: {currentAsset}
                    </span>
                  }
                />
              )}
            </form.AppField>

            {/* Quick preset amounts (for USDT) */}
            {currentAsset === "USDT" && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {t("quickAdd")}
                </span>
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {QUICK_AMOUNTS.map((val) => (
                    <Button
                      key={val}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPreset(val)}
                      className="h-7 text-xs font-mono font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                    >
                      +{val}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <form.AppForm>
              <form.SubmitButton
                className="w-full h-9 font-semibold text-xs"
                color="primary"
                label={deposit.isPending ? t("submitting") : t("confirm")}
              />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
