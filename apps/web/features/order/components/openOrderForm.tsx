"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "@tanstack/react-store";
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

// ─── ابزارهای کمکی ─────────────────────────────────────
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

// epsilon برای جلوگیری از خطای float در مقایسه
const EPS = 1e-9;

export const OpenOrderForm = ({
  symbol: SYMBOL,
  baseAsset: BASE_ASSET,
  quoteAsset: QUOTE_ASSET,
}: OpenOrderFormProps) => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [percent, setPercent] = useState(0);
  const [priceAutoFilled, setPriceAutoFilled] = useState(false);

  const createOrder = useCreateOrder();
  const { data: balances } = useWalletBalance();
  const { asks, bids, lastPrice } = useOrderBookSocket(SYMBOL);

  const isBuy = side === "buy";
  const isMarket = orderType === "market";

  // ─── موجودی مرتبط با سمت معامله ─────────────────────
  // خرید → quote، فروش → base
  const spendAsset = isBuy ? QUOTE_ASSET : BASE_ASSET;
  const balanceLoaded = balances !== undefined;
  const spendBalance = useMemo(() => {
    if (!balances) return 0;
    const row = balances.find((b) => b.asset === spendAsset);
    return row ? Number(row.available ?? 0) : 0;
  }, [balances, spendAsset]);

  // ─── best bid/ask ──────────────────────────────────
  const bestAsk = useMemo(() => getBestAsk(asks), [asks]);
  const bestBid = useMemo(() => getBestBid(bids), [bids]);
  const referencePrice = isBuy ? bestAsk : bestBid;

  // فرم
  const form = useAppForm({
    defaultValues: {
      price: "0",
      amount: "",
    },
    validationLogic,
    onSubmit: async ({ value }) => {
      if (createOrder.isPending) return;
      // defensive: دکمه عمدتاً disable است ولی اینجا هم چک می‌کنیم
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
        // reset فرم + stateها
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

  // ─── مقادیر زندهٔ فرم ──────────────────────────────
  const amountValue =
    (useSelector(form.store, (s) => s.values.amount) as string) ?? "";
  const priceValue =
    (useSelector(form.store, (s) => s.values.price) as string) ?? "";

  const amountNum = Number(stripCommas(amountValue || "0")) || 0;
  const priceNum = Number(stripCommas(priceValue || "0")) || 0;
  const effectivePrice = isMarket ? (lastPrice?.price ?? 0) : priceNum;

  // ─── محاسبهٔ total و insufficient ──────────────────
  // هزینه‌ای که این سفارش از موجودی کاربر مصرف می‌کند:
  //   فروش → مقدار base
  //   خرید → مقدار base × قیمت (در واحد quote)
  const requiredSpend = useMemo(() => {
    if (amountNum <= 0) return 0;
    if (!isBuy) return amountNum;
    return effectivePrice > 0 ? amountNum * effectivePrice : 0;
  }, [amountNum, effectivePrice, isBuy]);

  // ویژگی #۳: اعتبارسنجی inline موجودی
  const insufficientBalance =
    balanceLoaded && amountNum > 0 && requiredSpend > spendBalance * (1 + EPS);

  // ref برای onSubmit (defensive check)
  const insufficientBalanceRef = useRef(false);
  insufficientBalanceRef.current = insufficientBalance;

  // ویژگی #۲: پیش‌نمایش total
  const total = useMemo(
    () =>
      amountNum > 0 && effectivePrice > 0 ? amountNum * effectivePrice : 0,
    [amountNum, effectivePrice],
  );

  // ─── core helpers ──────────────────────────────────
  const computeAmount = (pct: number, priceInput: string): number | null => {
    if (pct <= 0 || spendBalance <= 0) return null;
    if (!isBuy) return (spendBalance * pct) / 100;
    const px = isMarket
      ? (lastPrice?.price ?? 0)
      : Number(stripCommas(priceInput || "0"));
    if (!px || px <= 0) return null;
    return (spendBalance * pct) / 100 / px;
  };

  // refs برای جلوگیری از حلقهٔ sync
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
      // Object is possibly 'undefined'.
      const amt = computeAmount(percent, next);
      if (amt != null) {
        isProgrammaticRef.current = true;
        form.setFieldValue("amount", toInputValue(amt));
      }
    }
  };

  // ─── effects ──────────────────────────────────────
  // (۱) auto-fill قیمت با بهترین bid/ask
  useEffect(() => {
    if (priceAutoFilled || isMarket || referencePrice == null) return;
    const currentNum = Number(stripCommas(priceValue || "0"));
    if (!currentNum) {
      form.setFieldValue("price", toInputValue(referencePrice));
      setPriceAutoFilled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referencePrice, isMarket, priceAutoFilled]);

  // (۲) تغییر side/orderType → بازمحاسبه amount از روی درصد فعال
  useEffect(() => {
    if (percent <= 0) return;
    const amt = computeAmount(percent, priceValue);
    if (amt != null) {
      isProgrammaticRef.current = true;
      form.setFieldValue("amount", toInputValue(amt));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, orderType]);

  // (۳) ویژگی #۱: sync یک‌طرفهٔ amount → percent (وقتی کاربر دستی تایپ کرد)
  useEffect(() => {
    // اگر مقدار توسط ما (programmatic) ست شده، skip
    if (isProgrammaticRef.current) {
      isProgrammaticRef.current = false;
      prevAmountRef.current = amountValue;
      return;
    }
    // اگر مقدار عوض نشده، skip
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

  // ─── Market mode: اگر درصد فعال است، amount را با قیمت جدید بازمحاسبه کن ─
  // (فقط برای buys؛ sell مستقل از قیمت است)
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
  // ─── render ──────────────────────────────────────
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
          {/* ─── Price ────────────────────────────── */}
          <form.AppField name="price" validators={priceValidators}>
            {(field) => (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">
                    {isMarket
                      ? "قیمت لحظه‌ای بازار"
                      : isBuy
                        ? "بهترین فروش"
                        : "بهترین خرید"}
                  </span>

                  {isMarket ? (
                    lastPrice?.price != null && lastPrice.price > 0 ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Live
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        در حال دریافت…
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
                        referencePrice != null && "cursor-pointer"
                      )}
                      title="کلیک برای ست کردن قیمت"
                    >
                      {referencePrice != null
                        ? `${formatDisplay(referencePrice)} ${QUOTE_ASSET}`
                        : "—"}
                    </button>
                  )}
                </div>

                <field.TextField
                  label={`قیمت (${QUOTE_ASSET})`}
                  dir="ltr"
                  inputMode="decimal"
                  className="text-left font-mono"
                  disabled={isMarket}
                />
              </div>
            )}
          </form.AppField>

          {/* ─── Amount ───────────────────────────── */}
          <form.AppField name="amount" validators={amountValidators}>
            {(field) => (
              <div className="space-y-1">
                <field.TextField
                  label={`مقدار (${BASE_ASSET})`}
                  dir="ltr"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="text-left font-mono"
                />

                {/* موجودی + دکمهٔ حداکثر */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">موجودی</span>
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
                      حداکثر
                    </button>
                  </div>
                </div>

                {/* Total preview + هشدار موجودی */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">جمع تقریبی</span>
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
                    موجودی کافی نیست — نیاز:{" "}
                    <span className="font-mono">
                      {formatDisplay(requiredSpend)} {spendAsset}
                    </span>
                  </p>
                )}
              </div>
            )}
          </form.AppField>
        </FieldGroup>

        {/* ─── Slider ───────────────────────────────── */}
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

      {/* ─── Submit ─────────────────────────────────── */}
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
                ? "در حال ارسال..."
                : insufficientBalance
                  ? "موجودی کافی نیست"
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
