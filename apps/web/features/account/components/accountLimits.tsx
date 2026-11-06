import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AccountLimitsCard = () => {
  const t = useTranslations("account.limits");

  return (
    <Card className="bg-card border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            {t("dailyCrypto")}
            <span className="font-bold font-mono">1,000 USDT</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="w-[45%] h-full bg-primary rounded-full" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t("dailyFiat")}</span>
            <span className="font-bold font-mono">500M IRR</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="w-[85%] h-full bg-primary rounded-full" />
          </div>
        </div>

        <div className="pt-3 border-t border-border/40 flex justify-between items-center text-xs">
          <span className="text-muted-foreground">{t("tradingFee")}</span>
          <span className="font-mono font-bold text-foreground">
            0.15% / 0.20%
          </span>
        </div>
      </CardContent>
    </Card>
  );
};