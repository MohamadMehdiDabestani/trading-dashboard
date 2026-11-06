import { useWalletBalances } from "../hooks/useDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Pulse } from "@/components/pulse";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { DepositDialog } from "@/components/dashboard-navbar/depositDialog";

export const BalanceCard = () => {
  const { data: balances, isLoading } = useWalletBalances();
  const t = useTranslations("dashboard.cards.balance");
  const usdt = balances?.find((b) => b.asset === "USDT");

  return (
    <Card className="overflow-hidden border border-border bg-card transition-all hover:shadow-sm sm:col-span-2 lg:col-span-1">
      <CardContent className="p-6 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t("title")}
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
        <DepositDialog
          asset="USDT"
          trigger={
            <Button variant="outline" size="sm" color="primary">
              <Plus className="size-4" />
              {t("deposit")}
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
};
