"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { useTranslations } from "next-intl";
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
import { useOrderBookSocket } from "../hooks/useOrderBookSocket";
import { useWalletBalance } from "@/features/wallet/hooks/useWalletBalance";
import { CreateOrderDTO, SymbolValue } from "@repo/types";

const priceValidators = fieldValidators(priceSchema);
const amountValidators = fieldValidators(amountSchema);

type OpenOrderFormProps = {
  symbol: SymbolValue;
  baseAsset: string;
  quoteAsset: string;
};

const toInputValue = (n: number, maxDecimals = 8) =>
  Number.isFinite(n) && n > 0
    ? n.toFixed(maxDecimals).replace(/\.?0+$/, "")
    : "";

const formatDisplay = (n: number, maxDecimals = 8) =>
  Number.isFinite(n)
    ? n.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      })
    : "0";

const getBestAsk = (asks: { price: number }[]) =>
  asks.length ? Math.min(...asks.map((a) => a.price)) : null;

const getBestBid = (bids: { price: number }[]) =>
  bids.length ? Math.max(...bids.map((b) => b.price)) : null;

const EPS = 1e-9;

export const OpenOrderForm = ({
  symbol: SYMBOL,
  baseAsset: BASE_ASSET,
  quoteAsset: QUOTE_ASSET,
}: OpenOrderFormProps) => {
  const t = useTranslations("trade.orderForm");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [percent, setPercent] = useState(0);
  const [priceAutoFilled, setPriceAutoFilled] = useState(false);

  const createOrder = useCreateOrder();
  const { data: balances } = useWalletBalance();
  const { asks, bids, lastPrice } = useOrderBookSocket(SYMBOL);

  const isBuy = side === "buy";
  const isMarket = orderType === "market";

  const spendAsset = isBuy ? QUOTE_ASSET : BASE_ASSET;
  const balanceLoaded = balances !== undefined;
  const spendBalance = useMemo(() => {
    if (!balances) return 0;
    const row = balances.find((b) => b.asset === spendAsset);
    return row ? Number(row.available ?? 0) : 0;
  }, [balances, spendAsset]);

  const bestAsk = useMemo(() => getBestAsk(asks), [asks]);
  const bestBid = useMemo(() => getBestBid(bids), [bids]);
  const referencePrice = isBuy ? bestAsk : bestBid;

  const form = useAppForm({
    defaultValues: { price: "0", amount: "" },
    validationLogic,
    onSubmit: async ({ value }) => {
      if (createOrder.isPending) return;
      if (insufficientBalanceRef.current) return;

      const payload: CreateOrderDTO = {
        symbol: SYMBOL,
        baseAsset: BASE_ASSET,
        quoteAsset: QUOTE_ASSET,
        side,
        type: orderType,
        quantity: value.amount,
        price: stripCommas(value.price),
      };

      try {
        await createOrder.mutateAsync(payload);
        isProgrammaticRef.current = true;
        form.reset();
        setPercent(0);
        setPriceAutoFilled(false);
        prevAmountRef.current = "";
      } catch (err) {
        applyApiFieldErrors(err, form);
      }
    },
  });

  const amountValue =
    (useSelector(form.store, (s) => s.values.amount) as string) ?? "";
  const priceValue =
    (useSelector(form.store, (s) => s.values.price) as string) ?? "";

  const amountNum = Number(stripCommas(amountValue || "0")) || 0;
  const priceNum = Number(stripCommas(priceValue || "0")) || 0;
  const effectivePrice = isMarket ? (lastPrice?.price ?? 0) : priceNum;

  const requiredSpend = useMemo(() => {
    if (amountNum <= 0) return 0;
    if (!isBuy) return amountNum;
    return effectivePrice > 0 ? amountNum * effectivePrice : 0;
  }, [amountNum, effectivePrice, isBuy]);

  const insufficientBalance =
    balanceLoaded && amountNum > 0 && requiredSpend > spendBalance * (1 + EPS);

  const insufficientBalanceRef = useRef(false);
  insufficientBalanceRef.current = insufficientBalance;

  const total = useMemo(
    () =>
      amountNum > 0 && effectivePrice > 0 ? amountNum * effectivePrice : 0,
    [amountNum, effectivePrice],
  );

  const computeAmount = (pct: number, priceInput: string): number | null => {
    if (pct <= 0 || spendBalance <= 0) return null;
    if (!isBuy) return (spendBalance * pct) / 100;
    const px = isMarket
      ? (lastPrice?.price ?? 0)
      : Number(stripCommas(priceInput || "0"));
    if (!px || px <= 0) return null;
    return (spendBalance * pct) / 100 / px;
  };

  const isProgrammaticRef = useRef(false);
  const prevAmountRef = useRef<string>("");

  const applyPercent = (pct: number) => {
    setPercent(pct);
    if (pct <= 0) {
      isProgrammaticRef.current = true;
      form.setFieldValue("amount", "");
      return;
    }
    const amt = computeAmount(pct, priceValue);
    if (amt != null) {
      isProgrammaticRef.current = true;
      form.setFieldValue("amount", toInputValue(amt));
    }
  };

  const applyReferencePrice = () => {
    if (referencePrice == null) return;
    const next = toInputValue(referencePrice);
    form.setFieldValue("price", next);
    setPriceAutoFilled(true);
    if (isBuy && percent > 0) {
      const amt = computeAmount(percent, next);
      if (amt != null) {
        isProgrammaticRef.current = true;
        form.setFieldValue("amount", toInputValue(amt));
      }
    }
  };

  useEffect(() => {
    if (priceAutoFilled || isMarket || referencePrice == null) return;
    const currentNum = Number(stripCommas(priceValue || "0"));
    if (!currentNum) {
      form.setFieldValue("price", toInputValue(referencePrice));
      setPriceAutoFilled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referencePrice, isMarket, priceAutoFilled]);

  useEffect(() => {
    if (percent <= 0) return;
    const amt = computeAmount(percent, priceValue);
    if (amt != null) {
      isProgrammaticRef.current = true;
      form.setFieldValue("amount", toInputValue(amt));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, orderType]);

  useEffect(() => {
    if (isProgrammaticRef.current) {
      isProgrammaticRef.current = false;
      prevAmountRef.current = amountValue;
      return;
    }
    if (amountValue === prevAmountRef.current) return;
    prevAmountRef.current = amountValue;

    const amt = Number(stripCommas(amountValue || "0"));
    if (amt <= 0 || spendBalance <= 0) {
      if (percent !== 0) setPercent(0);
      return;
    }

    const px = isMarket
      ? (lastPrice?.price ?? 0)
      : Number(stripCommas(priceValue || "0"));

    let pct: number;
    if (!isBuy) {
      pct = (amt / spendBalance) * 100;
    } else {
      if (!px || px <= 0) return;
      pct = ((amt * px) / spendBalance) * 100;
    }
    const clamped = Math.min(100, Math.max(0, Math.round(pct)));
    if (clamped !== percent) setPercent(clamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountValue]);

  useEffect(() => {
    if (!isMarket) return;
    const px = lastPrice?.price;
    if (px == null || px <= 0) return;

    const next = toInputValue(px);
    const current = (form.state.values.price as string) ?? "";
    if (current === next) return;

    form.setFieldValue("price", next);
  }, [isMarket, lastPrice?.price]);

  useEffect(() => {
    if (!isMarket) return;
    if (!isBuy) return;
    if (percent <= 0) return;

    const px = lastPrice?.price;
    if (px == null || px <= 0) return;
    if (spendBalance <= 0) return;

    const amt = (spendBalance * percent) / 100 / px;
    if (!Number.isFinite(amt) || amt <= 0) return;

    isProgrammaticRef.current = true;
    form.setFieldValue("amount", toInputValue(amt));
  }, [isMarket, isBuy, percent, lastPrice?.price, spendBalance]);

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
              {t("side.sell")}
            </TabsTrigger>
            <TabsTrigger
              value="buy"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white h-full"
            >
              {t("side.buy")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          {(["limit", "market"] as const).map((type) => (
            <Button
              key={type}
              type="button"
              variant="ghost"
              color="secondary"
              size="sm"
              className={cn(
                "flex-1 text-xs h-8",
                orderType === type && "bg-primary/10",
              )}
              onClick={() => setOrderType(type)}
            >
              {t(`type.${type}`)}
            </Button>
          ))}
        </div>

        <FieldGroup>
          <form.AppField name="price" validators={priceValidators}>
            {(field) => (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">
                    {isMarket
                      ? t("price.marketPrice")
                      : isBuy
                        ? t("price.bestAsk")
                        : t("price.bestBid")}
                  </span>

                  {isMarket ? (
                    lastPrice?.price != null && lastPrice.price > 0 ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        {t("price.live")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {t("price.loading")}
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={applyReferencePrice}
                      disabled={referencePrice == null}
                      className={cn(
                        "font-mono tabular-nums hover:underline disabled:opacity-50",
                        isBuy ? "text-rose-500" : "text-emerald-500",
                        referencePrice != null && "cursor-pointer",
                      )}
                      title={t("price.setPriceTooltip")}
                    >
                      {referencePrice != null
                        ? `${formatDisplay(referencePrice)} ${QUOTE_ASSET}`
                        : "—"}
                    </button>
                  )}
                </div>

                <field.TextField
                  label={t("price.label", { quote: QUOTE_ASSET })}
                  dir="ltr"
                  inputMode="decimal"
                  className="text-left font-mono"
                  disabled={isMarket}
                />
              </div>
            )}
          </form.AppField>

          <form.AppField name="amount" validators={amountValidators}>
            {(field) => (
              <div className="space-y-1">
                <field.TextField
                  label={t("amount.label", { base: BASE_ASSET })}
                  dir="ltr"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="text-left font-mono"
                />

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">
                    {t("amount.balance")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-foreground/80">
                      {balanceLoaded ? formatDisplay(spendBalance) : "…"}{" "}
                      {spendAsset}
                    </span>
                    <button
                      type="button"
                      onClick={() => applyPercent(100)}
                      className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {t("amount.max")}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">
                    {t("amount.totalPreview")}
                  </span>
                  <span
                    className={cn(
                      "font-mono tabular-nums",
                      insufficientBalance
                        ? "text-destructive"
                        : "text-foreground/80",
                    )}
                  >
                    {total > 0
                      ? `≈ ${formatDisplay(total)} ${QUOTE_ASSET}`
                      : "—"}
                  </span>
                </div>

                {insufficientBalance && (
                  <p className="text-[10px] text-destructive">
                    {t("amount.insufficient", {
                      required: formatDisplay(requiredSpend),
                      asset: spendAsset,
                    })}
                  </p>
                )}
              </div>
            )}
          </form.AppField>
        </FieldGroup>

        <div className="pt-2 pb-4 space-y-4">
          <Slider
            value={[percent]}
            onValueChange={(v) => applyPercent(v[0] ?? 0)}
            max={100}
            variant="success"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            {[0, 25, 50, 75, 100].map((p) => (
              <span
                key={p}
                className={cn(
                  "text-xs cursor-pointer hover:text-success",
                  percent === p && "text-success font-semibold",
                )}
                onClick={() => applyPercent(p)}
              >
                {p}%
              </span>
            ))}
          </div>
        </div>
      </form>

      <div className="mt-auto pt-4">
        <form.AppForm>
          <form.SubmitButton
            form="open-order-form"
            disabled={createOrder.isPending || insufficientBalance}
            className={cn(
              "w-full h-18",
              isBuy
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-destructive hover:bg-red-700",
            )}
            label={
              createOrder.isPending
                ? t("submit.submitting")
                : insufficientBalance
                  ? t("submit.insufficient")
                  : isBuy
                    ? t("submit.buy", { base: BASE_ASSET })
                    : t("submit.sell", { base: BASE_ASSET })
            }
          />
        </form.AppForm>
      </div>
    </Fragment>
  );
};