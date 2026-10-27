"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/components/form";
import { cn } from "@/lib/cn";
import { applyApiFieldErrors } from "@/lib/validation/applyFieldErrors";
import {
  fieldValidators,
  validationLogic,
} from "@/lib/validation/fieldValidator";
import { amountSchema, priceSchema, stripCommas } from "../schema";
import { useCreateOrder } from "../hooks/useTradeMutations";
import { CreateOrderDTO } from "@repo/types";
import { SymbolValue } from "../constants/symbols";

const priceValidators = fieldValidators(priceSchema);
const amountValidators = fieldValidators(amountSchema);

type OpenOrderFormProps = {
  symbol: SymbolValue;
  baseAsset: string;
  quoteAsset: string;
};

export const OpenOrderForm = ({
  symbol: SYMBOL,
  baseAsset: BASE_ASSET,
  quoteAsset: QUOTE_ASSET,
}: OpenOrderFormProps) => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [percent, setPercent] = useState([0]);

  const createOrder = useCreateOrder();

  const form = useAppForm({
    defaultValues: {
      price: "64,235.00",
      amount: "",
    },
    validationLogic,
    onSubmit: async ({ value }) => {
      if (createOrder.isPending) return;

      const payload : CreateOrderDTO = {
        symbol: SYMBOL,
        baseAsset: BASE_ASSET,
        quoteAsset: QUOTE_ASSET,
        side,
        type: orderType,
        quantity: value.amount,
        price: stripCommas(value.price)
      };

      try {
        await createOrder.mutateAsync(payload);
        form.reset();
        setPercent([0]);
      } catch (err) {
        applyApiFieldErrors(err, form);
      }
    },
  });

  const isBuy = side === "buy";
  const isMarket = orderType === "market";

  return (
    <Fragment>
      <form
        id="open-order-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex-grow space-y-4"
      >
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
          {(["limit", "market"] as const).map((t) => (
            <Button
              key={t}
              type="button"
              variant="ghost"
              color="secondary"
              size="sm"
              className={cn(
                "flex-1 text-xs h-8",
                orderType === t && "bg-primary/10",
              )}
              onClick={() => setOrderType(t)}
            >
              {t === "limit" ? "لیمیت" : "مارکت"}
            </Button>
          ))}
        </div>

        <FieldGroup>
          <form.AppField name="price" validators={priceValidators}>
            {(field) => (
              <field.TextField
                label={`قیمت (${QUOTE_ASSET})`}
                dir="ltr"
                inputMode="decimal"
                className="text-left font-mono"
                disabled={isMarket}
              />
            )}
          </form.AppField>

          <form.AppField name="amount" validators={amountValidators}>
            {(field) => (
              <field.TextField
                label={`مقدار (${BASE_ASSET})`}
                dir="ltr"
                inputMode="decimal"
                placeholder="0.00"
                className="text-left font-mono"
              />
            )}
          </form.AppField>
        </FieldGroup>

        <div className="pt-2 pb-4 space-y-4">
          <Slider
            value={percent}
            onValueChange={setPercent}
            max={100}
            variant="success"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            {[0, 25, 50, 75, 100].map((p) => (
              <span
                key={p}
                className="text-xs cursor-pointer hover:text-success"
                onClick={() => setPercent([p])}
              >
                {p}%
              </span>
            ))}
          </div>
        </div>

        {/* {createOrder.isError && (
          <p className="text-sm text-destructive text-center">
            {readableOrderError(createOrder.error)}
          </p>
        )} */}
      </form>

      <div className="mt-auto pt-4">
        <form.AppForm>
          <form.SubmitButton
            form="open-order-form"
            disabled={createOrder.isPending}
            className={cn(
              "w-full h-18",
              isBuy
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-destructive hover:bg-red-700",
            )}
            label={
              createOrder.isPending
                ? "در حال ارسال..."
                : isBuy
                  ? `خرید ${BASE_ASSET}`
                  : `فروش ${BASE_ASSET}`
            }
          />
        </form.AppForm>
      </div>
    </Fragment>
  );
};

// // فقط برای پیام‌های عمومیِ کد خطای بک‌اند
// function readableOrderError(err: unknown): string {
//   const code = (err as { code?: string })?.code;
//   switch (code) {
//     case "INSUFFICIENT_BALANCE":
//       return "موجودی کافی نیست";
//     case "INVALID_SYMBOL":
//       return "بازار نامعتبر است";
//     case "ORDER_NOT_FOUND":
//       return "سفارش یافت نشد";
//     case "UNAUTHORIZED":
//       return "لطفاً دوباره وارد شوید";
//     default:
//       return "ثبت سفارش ناموفق بود";
//   }
// }