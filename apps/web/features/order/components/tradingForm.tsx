'use client'
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OpenOrderForm } from "@/features/order/components/openOrderForm";
import {
  DraggableLayout,
  SortablePanel,
} from "@/components/ui/draggableLayout";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
import { OrderBook } from "@/features/order/components/orderBook";
import { cn } from "@/lib/cn";
import { columns, Position } from "@/features/order/utils/columns";
import { DataTable } from "@/components/data-table";
import { TradingViewChart } from "@/features/order/components/tradingViewChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { SYMBOLS, SymbolValue } from "@/features/order/constants/symbols";

const data: Position[] = [
  {
    id: "1",
    pair: "BTC/USDT",
    type: "BUY",
    amount: 0.25,
    entryPrice: "$64,210.00",
    currentPrice: "$65,100.50",
    pnl: "$222.62",
    status: "up",
  },
  {
    id: "2",
    pair: "ETH/USDT",
    type: "SELL",
    amount: 4.5,
    entryPrice: "$3,550.00",
    currentPrice: "$3,420.00",
    pnl: "$585.020",
    status: "up",
  },
];
type TradingFormProps = {
  initialSymbol: SymbolValue;
};
export const TradingForm = ({ initialSymbol }: TradingFormProps) => {
  const [order, setOrder] = useState(["form", "chart", "orderbook"]);
  const [symbol, setSymbol] = useState<SymbolValue>(initialSymbol);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div className="flex flex-col gap-4">
      <DraggableLayout
        items={order}
        onChange={setOrder}
        className="  flex-1
  grid
  grid-cols-1
  md:grid-cols-2
  xl:grid-cols-[384px_1fr_288px]
  gap-4"
      >
        {order.map((id) => (
          <SortablePanel
            key={id}
            id={id}
            className={cn(
              "min-h-0", // خیلی مهم برای جلوگیری از overflow
              id === "chart" && "md:col-span-2 xl:col-span-1",
              id === "form" && "md:col-span-1 xl:col-span-1",
              id === "orderbook" && "md:col-span-1 xl:col-span-1",
            )}
          >
            {({ attributes, listeners }) => {
              switch (id) {
                case "form":
                  return (
                    <Card className="h-full flex flex-col pt-3 ">
                      <CardHeader className="flex items-center flex-row">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-grab active:cursor-grabbing"
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                        <p className="font-bold">باز کردن معامله</p>
                      </CardHeader>
                      <CardContent className="flex flex-col h-full">
                        <OpenOrderForm />
                      </CardContent>
                    </Card>
                  );
                case "chart":
                  return (
                    <Card className="h-full flex flex-col pt-3">
                      <CardHeader className="flex items-center flex-row gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-grab active:cursor-grabbing"
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>

                        <Select
                          value={symbol}
                          onValueChange={(v) => setSymbol(v as SymbolValue)}
                        >
                          <SelectTrigger className="w-40" dir="ltr">
                            <SelectValue placeholder="انتخاب سمبل" />
                          </SelectTrigger>
                          <SelectContent dir="ltr">
                            {SYMBOLS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardHeader>

                      <CardContent className="relative flex-1 min-h-[400px] min-w-0 px-2">
                        {mounted && (
                          <TradingViewChart
                            symbol={symbol}
                            theme={resolvedTheme === "light" ? "light" : "dark"}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );

                case "orderbook":
                  return (
                    <Card className="h-full flex flex-col pt-3 ">
                      <CardHeader className="flex items-center flex-row">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-grab active:cursor-grabbing"
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                        <p className="font-bold">دفتر چه سفاراشات</p>
                      </CardHeader>
                      <CardContent className="h-full px-0">
                        <OrderBook />
                      </CardContent>
                    </Card>
                  );

                default:
                  return null;
              }
            }}
          </SortablePanel>
        ))}
      </DraggableLayout>

      <Card className="h-60 shrink-0">
        <DataTable columns={columns} data={data} />
      </Card>
    </div>
  );
}
