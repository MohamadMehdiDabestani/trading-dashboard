import { useState } from "react";
import { useDeposit, useWalletBalances } from "../hooks/useDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Pulse } from "@/components/pulse";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

export const BalanceCard = () => {
  const { data: balances, isLoading } = useWalletBalances();
  const deposit = useDeposit();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const t = useTranslations('dashboard.cards.balance');
  const usdt = balances?.find((b) => b.asset === "USDT");
  const valid = /^\d+(\.\d{1,18})?$/.test(amount) && Number(amount) > 0;

  const submit = () =>
    deposit.mutate(amount, {
      onSuccess: () => {
        setOpen(false);
        setAmount("");
      },
    });

  return (
    <Card className="overflow-hidden border border-border bg-card transition-all hover:shadow-sm sm:col-span-2 lg:col-span-1">
      <CardContent className="p-6 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t('title')}
          </span>
          {isLoading ? (
            <Pulse className="h-8 w-32" />
          ) : (
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                USDT
              </span>
              <span dir="ltr" className="text-2xl font-bold tracking-tight">
                {Number(usdt?.available ?? 0).toLocaleString("en-US", {
                  maximumFractionDigits: 4,
                })}
              </span>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          color="primary"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" />
          {t('deposit')}
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogTitle')}</DialogTitle>
          </DialogHeader>
          <Input
            dir="ltr"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.trim())}
          />
          <DialogFooter>
            <Button onClick={submit} disabled={!valid || deposit.isPending}>
              {deposit.isPending ? t('submitting') : t('confirmDeposit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
