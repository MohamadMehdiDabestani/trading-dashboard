import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AccountLimitsCard = () => (
  <Card className="bg-card border-border/60">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-bold">محدودیت‌های حساب</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          برداشت روزانه کریپتو
          <span className="font-bold font-mono">1,000 USDT</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="w-[45%] h-full bg-primary rounded-full" />
        </div>
      </div>

      {/* برداشت ریالی */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">برداشت روزانه ریالی</span>
          <span className="font-bold font-mono">500M IRR</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="w-[85%] h-full bg-primary rounded-full" />
        </div>
      </div>

      {/* نرخ کارمزد تراکنش‌ها */}
      <div className="pt-3 border-t border-border/40 flex justify-between items-center text-xs">
        <span className="text-muted-foreground">
          کارمزد معاملات (Maker/Taker)
        </span>

        <span className="font-mono font-bold text-foreground">
          0.15% / 0.20%
        </span>
      </div>
    </CardContent>
  </Card>
);
