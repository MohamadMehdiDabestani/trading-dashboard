import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";

export const OpenOrderForm = () => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<string>("limit");
  const [percent, setPercent] = useState([0]);
  return (
    <Fragment>
      <div className="flex-grow space-y-4">
        <Tabs value={side} onValueChange={(v) => setSide(v as "buy" | "sell")}>
          <TabsList className="w-full grid grid-cols-2 h-18">
            <TabsTrigger
              value="sell"
              className="data-[state=active]:bg-destructive data-[state=active]:text-white h-full"
            >
              فروش (Sell)
            </TabsTrigger>
            <TabsTrigger
              value="buy"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white h-full"
            >
              خرید (Buy)
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          {["limit", "market"].map((t) => (
            <Button
              key={t}
              variant="ghost"
              color="secondary"
              size="sm"
              className={cn(
                "flex-1 text-xs h-8",
                orderType === t && "bg-primary/10",
              )}
              onClick={() => setOrderType(t)}
            >
              {t === "limit" ? "لیمیت" : t === "market" ? "مارکت" : "استاپ"}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">قیمت (USD)</Label>
            <Input value="64,235.00" className="text-left font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">مقدار (BTC)</Label>
            <Input placeholder="0.00" className="text-left font-mono" />
          </div>
        </div>

        <div className="pt-2 pb-4 space-y-4">
          <Slider
            value={percent}
            onValueChange={setPercent}
            max={100}
            variant="success"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            <span
              className="text-xs cursor-pointer hover:text-success"
              onClick={() => setPercent([0])}
            >
              0%
            </span>
            <span
              className="text-xs cursor-pointer hover:text-success"
              onClick={() => setPercent([25])}
            >
              25%
            </span>
            <span
              className="text-xs cursor-pointer hover:text-success"
              onClick={() => setPercent([50])}
            >
              50%
            </span>
            <span
              className="text-xs cursor-pointer hover:text-success"
              onClick={() => setPercent([75])}
            >
              75%
            </span>
            <span
              className="text-xs cursor-pointer hover:text-success"
              onClick={() => setPercent([100])}
            >
              100%
            </span>
          </div>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <Button
          className={cn(
            "w-full h-18",
            side === "buy"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-destructive hover:bg-red-700",
          )}
          // size="lg"
        >
          {side === "buy" ? "خرید BTC" : "فروش BTC"}
        </Button>
      </div>
    </Fragment>
  );
};
