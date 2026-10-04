import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, Landmark, Wallet } from "lucide-react";

export const ConnectedAccounts = () => (
  <div className="space-y-3">
    <div className="flex justify-between items-center px-1">
      <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
        مؤسسات و حساب‌های متصل
      </h3>
      <Button
        variant="ghost"
        className="text-primary text-xs hover:bg-primary/5"
      >
        + افزودن حساب جدید
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-card border-border/60 hover:border-primary/40 transition-colors">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="text-start">
              <p className="font-bold text-sm">بانک ملت</p>
              <p
                className="text-xs text-muted-foreground font-mono mt-0.5"
                dir="ltr"
              >
                6037 **** **** 2948
              </p>
              <Badge className="mt-1.5 text-[9px] bg-success/5 text-success border-success/20">
                'تایید شده'
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
          >
            •••
          </Button>
        </CardContent>
      </Card>

      {/* کارت ولت ارز دیجیتال */}
      <Card className="bg-card border-border/60 hover:border-primary/40 transition-colors">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="text-start">
              <p className="font-bold text-sm">کیف پول متامسک</p>
              <p
                className="text-xs text-muted-foreground font-mono mt-0.5"
                dir="ltr"
              >
                0x12...4fA3
              </p>
              <Badge className="mt-1.5 text-[9px] bg-success/5 text-success border-success/20">
                تایید شده
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
          >
            •••
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);
