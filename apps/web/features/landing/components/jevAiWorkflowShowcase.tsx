"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Cpu,
  Filter,
  HelpCircle,
  Layers,
  ShieldAlert,
  Sparkles,
  Terminal,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Link } from "@/lib/i18nNavigation";

type ScenarioId =
  | "quickBuy"
  | "percentSell"
  | "slotFill"
  | "balance"
  | "cancelOrder"
  | "howto";

type ScenarioData = {
  id: ScenarioId;
  badge: string;
  rawFa: string;
  rawEn: string;
  normalizedFa: string;
  normalizedEn: string;
  jevOutput: {
    intent: { choice: string; confidence: number };
    side: { choice: string; confidence: number };
    coin: { choice: string; confidence: number };
  };
  parsedIntent: {
    intent: string;
    symbol: string | null;
    asset: string | null;
    amount: number | null;
    amountUnit: "USDT" | "BASE" | null;
    price: number | null;
    percent: number | null;
    howto: "BUY" | "SELL" | null;
  };
  missingSlot: "none" | "amount & price";
  widgetPreview: {
    kind: "confirm" | "slot" | "balance" | "cancel" | "howto";
    side?: "BUY" | "SELL";
    orderType?: "MARKET" | "LIMIT";
    pair?: string;
    qtyText?: string;
    priceText?: string;
    totalText?: string;
  };
};

const SCENARIOS: readonly ScenarioData[] = [
  {
    id: "quickBuy",
    badge: "QUICK_BUY",
    rawFa: "سریع ۲۰۰ دلار بیت‌کوین بخر",
    rawEn: "سریع ۲۰۰ دلار بیت‌کوین بخر (Quick buy $200 BTC)",
    normalizedFa: "سریع 200 دلار بیت کوین بخر",
    normalizedEn: "سریع 200 دلار بیت کوین بخر",
    jevOutput: {
      intent: { choice: "QUICK_TRADE", confidence: 0.98 },
      side: { choice: "BUY", confidence: 0.99 },
      coin: { choice: "BTC", confidence: 0.99 },
    },
    parsedIntent: {
      intent: "QUICK_BUY",
      symbol: "BTCUSDT",
      asset: null,
      amount: 200,
      amountUnit: "USDT",
      price: null,
      percent: null,
      howto: null,
    },
    missingSlot: "none",
    widgetPreview: {
      kind: "confirm",
      side: "BUY",
      orderType: "MARKET",
      pair: "BTC / USDT",
      qtyText: "0.00212134 BTC",
      priceText: "~$94,280.00 (Live WS)",
      totalText: "200.00 USDT",
    },
  },
  {
    id: "percentSell",
    badge: "SELL + %",
    rawFa: "نصف اتریومم رو به قیمت ۲۸۰۰ بفروش",
    rawEn: "نصف اتریومم رو به قیمت ۲۸۰۰ بفروش (Sell 50% ETH @ 2800)",
    normalizedFa: "نصف اتریومم رو به قیمت 2800 بفروش",
    normalizedEn: "نصف اتریومم رو به قیمت 2800 بفروش",
    jevOutput: {
      intent: { choice: "TRADE", confidence: 0.96 },
      side: { choice: "SELL", confidence: 0.99 },
      coin: { choice: "ETH", confidence: 0.98 },
    },
    parsedIntent: {
      intent: "SELL",
      symbol: "ETHUSDT",
      asset: null,
      amount: null,
      amountUnit: null,
      price: 2800,
      percent: 50,
      howto: null,
    },
    missingSlot: "none",
    widgetPreview: {
      kind: "confirm",
      side: "SELL",
      orderType: "LIMIT",
      pair: "ETH / USDT",
      qtyText: "0.75000000 ETH (50% Avail)",
      priceText: "$2,800.00 (Limit)",
      totalText: "2,100.00 USDT",
    },
  },
  {
    id: "slotFill",
    badge: "SLOT FILLING",
    rawFa: "میخوام سولانا بخرم",
    rawEn: "میخوام سولانا بخرم (I want to buy Solana)",
    normalizedFa: "میخوام سولانا بخرم",
    normalizedEn: "میخوام سولانا بخرم",
    jevOutput: {
      intent: { choice: "TRADE", confidence: 0.95 },
      side: { choice: "BUY", confidence: 0.98 },
      coin: { choice: "SOL", confidence: 0.99 },
    },
    parsedIntent: {
      intent: "BUY",
      symbol: "SOLUSDT",
      asset: null,
      amount: null,
      amountUnit: null,
      price: null,
      percent: null,
      howto: null,
    },
    missingSlot: "amount & price",
    widgetPreview: {
      kind: "slot",
      pair: "SOL / USDT",
    },
  },
  {
    id: "balance",
    badge: "BALANCE",
    rawFa: "چقدر بیت کوین دارم؟",
    rawEn: "چقدر بیت کوین دارم؟ (How much BTC do I own?)",
    normalizedFa: "چقدر بیت کوین دارم؟",
    normalizedEn: "چقدر بیت کوین دارم؟",
    jevOutput: {
      intent: { choice: "BALANCE", confidence: 0.99 },
      side: { choice: "BUY", confidence: 0.52 },
      coin: { choice: "BTC", confidence: 0.99 },
    },
    parsedIntent: {
      intent: "BALANCE",
      symbol: null,
      asset: "BTC",
      amount: null,
      amountUnit: null,
      price: null,
      percent: null,
      howto: null,
    },
    missingSlot: "none",
    widgetPreview: {
      kind: "balance",
      pair: "BTC",
      qtyText: "0.42500000 BTC",
      totalText: "≈ $40,069.21",
    },
  },
  {
    id: "cancelOrder",
    badge: "CANCEL",
    rawFa: "سفارش بیت کوینم رو لغو کن",
    rawEn: "سفارش بیت کوینم رو لغو کن (Cancel my BTC order)",
    normalizedFa: "سفارش بیت کوینم رو لغو کن",
    normalizedEn: "سفارش بیت کوینم رو لغو کن",
    jevOutput: {
      intent: { choice: "CANCEL", confidence: 0.97 },
      side: { choice: "BUY", confidence: 0.55 },
      coin: { choice: "BTC", confidence: 0.99 },
    },
    parsedIntent: {
      intent: "CANCEL",
      symbol: "BTCUSDT",
      asset: null,
      amount: null,
      amountUnit: null,
      price: null,
      percent: null,
      howto: null,
    },
    missingSlot: "none",
    widgetPreview: {
      kind: "cancel",
      pair: "BTCUSDT",
      qtyText: "0.05 BTC @ $92,500",
    },
  },
  {
    id: "howto",
    badge: "HOWTO",
    rawFa: "چطوری ۱۰۰ دلار بیت کوین بخرم؟",
    rawEn: "چطوری ۱۰۰ دلار بیت کوین بخرم؟ (How to buy $100 BTC?)",
    normalizedFa: "چطوری 100 دلار بیت کوین بخرم؟",
    normalizedEn: "چطوری 100 دلار بیت کوین بخرم؟",
    jevOutput: {
      intent: { choice: "HOWTO", confidence: 0.97 },
      side: { choice: "BUY", confidence: 0.99 },
      coin: { choice: "BTC", confidence: 0.99 },
    },
    parsedIntent: {
      intent: "HOWTO",
      symbol: "BTCUSDT",
      asset: null,
      amount: 100,
      amountUnit: "USDT",
      price: null,
      percent: null,
      howto: "BUY",
    },
    missingSlot: "none",
    widgetPreview: {
      kind: "howto",
      pair: "BTC / USDT",
      totalText: "100 USDT",
    },
  },
];

export function JevAiWorkflowShowcase() {
  const t = useTranslations("landing.aiSection");
  const locale = useLocale();
  const [activeId, setActiveId] = useState<ScenarioId>("quickBuy");

  const active =
    SCENARIOS.find((s) => s.id === activeId) ?? SCENARIOS[0]!;

  return (
    <div className="space-y-8">
      {/* Interactive Scenario Selector Pills */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            {t("tryPrompts")}
          </span>
          <span
            dir="ltr"
            className="font-mono text-[11px] text-muted-foreground"
          >
            LLM_PROVIDER=jev • model: free/jev-1.13
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SCENARIOS.map((sc) => {
            const isSelected = sc.id === activeId;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => setActiveId(sc.id)}
                className={cn(
                  "text-start rounded-2xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-2",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                    : "border-border/70 bg-card/70 hover:bg-card hover:border-border",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-foreground">
                    {t(`scenarios.${sc.id}.title`)}
                  </span>
                  <Badge
                    variant={isSelected ? "default" : "secondary"}
                    className="font-mono text-[10px]"
                  >
                    {sc.badge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium truncate">
                  «{sc.rawFa}»
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-Stage Neuro-Symbolic Pipeline Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Stage 1 & 2: Normalization + JEV Structured Classifier */}
        <div className="lg:col-span-4 rounded-2xl border border-border/80 bg-card p-5 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="bg-primary/15 text-primary font-semibold"
              >
                <Bot className="size-3.5" />
                <span>{t("stage1Title")}</span>
              </Badge>
              <code
                dir="ltr"
                className="text-[10px] font-mono text-muted-foreground"
              >
                classifier.ts
              </code>
            </div>

            {/* Raw vs Normalized Input */}
            <div className="rounded-xl border border-border/60 bg-background/60 p-3 space-y-2">
              <div className="text-[11px] font-semibold text-muted-foreground">
                {t("userInputLabel")}
              </div>
              <div className="text-sm font-bold text-foreground">
                {locale === "fa" ? active.rawFa : active.rawEn}
              </div>
              <div
                dir="ltr"
                className="pt-1.5 border-t border-border/50 font-mono text-[11px] text-emerald-500 flex items-center justify-between"
              >
                <span>normalizeText()</span>
                <span>"{active.normalizedFa}"</span>
              </div>
            </div>

            {/* JEV Multi-Head Choice + Confidence Bars */}
            <div className="space-y-2.5" dir="ltr">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>JEV Decision Engine</span>
                <span>choice + confidence</span>
              </div>

              {(["intent", "side", "coin"] as const).map((field) => {
                const pick = active.jevOutput[field];
                const pct = Math.round(pick.confidence * 100);
                return (
                  <div
                    key={field}
                    className="rounded-xl border border-border/60 bg-muted/30 p-2.5 space-y-1.5 font-mono"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        questions.{field}
                      </span>
                      <span className="font-bold text-foreground">
                        "{pick.choice}"{" "}
                        <span className="text-primary">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("stage1Desc")}
          </p>
        </div>

        {/* Stage 3: Deterministic Extractor + Zod IntentSchema */}
        <div className="lg:col-span-4 rounded-2xl border border-border/80 bg-card p-5 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="bg-amber-500/15 text-amber-500 font-semibold"
              >
                <Filter className="size-3.5" />
                <span>{t("stage2Title")}</span>
              </Badge>
              <code
                dir="ltr"
                className="text-[10px] font-mono text-muted-foreground"
              >
                extract.ts + parse.ts
              </code>
            </div>

            <div
              dir="ltr"
              className="rounded-xl border border-border/70 bg-background/80 p-3.5 font-mono text-xs space-y-1 overflow-x-auto"
            >
              <div className="text-[10px] text-muted-foreground pb-1 border-b border-border/50 flex items-center justify-between">
                <span>IntentSchema.parse(buildIntent())</span>
                <span className="text-emerald-500 font-bold">Zod Valid ✓</span>
              </div>
              <pre className="text-[11px] leading-relaxed text-foreground/95 pt-1 text-start" dir="ltr">
                {JSON.stringify(active.parsedIntent, null, 2)}
              </pre>
            </div>

            <div className="flex flex-wrap gap-1.5" dir="ltr">
              <span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
                NEVER invents numbers
              </span>
              <span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
                Supports %, USDT & BASE
              </span>
              <span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
                15 req/min Rate Limit
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("stage2Desc")}
          </p>
        </div>

        {/* Stage 4: Slot-Filling & Human-in-the-Loop Action Card */}
        <div className="lg:col-span-4 rounded-2xl border border-border/80 bg-card p-5 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="bg-emerald-500/15 text-emerald-500 font-semibold"
              >
                <Cpu className="size-3.5" />
                <span>{t("stage3Title")}</span>
              </Badge>
              <code
                dir="ltr"
                className="text-[10px] font-mono text-muted-foreground"
              >
                assistanceWidget.tsx
              </code>
            </div>

            {/* Dynamic Widget Output Card */}
            <div className="rounded-2xl border border-primary/30 bg-background/70 p-4 space-y-3.5">
              {active.widgetPreview.kind === "confirm" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {t("widget.confirmTitle")}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-mono text-[10px]",
                        active.widgetPreview.side === "BUY"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {active.widgetPreview.side} •{" "}
                      {active.widgetPreview.orderType}
                    </Badge>
                  </div>

                  <div
                    dir="ltr"
                    className="space-y-1.5 rounded-xl bg-card p-3 border border-border/60 font-mono text-xs"
                  >
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pair:</span>
                      <span className="font-bold">
                        {active.widgetPreview.pair}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-bold">
                        {active.widgetPreview.qtyText}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span>{active.widgetPreview.priceText}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-bold text-primary">
                        {active.widgetPreview.totalText}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-emerald-500 font-medium">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>{t("widget.humanInLoop")}</span>
                  </div>
                </>
              )}

              {active.widgetPreview.kind === "slot" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {t("widget.slotTitle")}
                    </span>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px] bg-amber-500/15 text-amber-500"
                    >
                      missing: amount → price
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t("widget.slotPrompt")}
                  </p>

                  <div className="flex flex-wrap gap-1.5" dir="ltr">
                    {["$50 USDT", "$100 USDT", "50% Balance", "1 SOL"].map(
                      (chip) => (
                        <span
                          key={chip}
                          className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary"
                        >
                          {chip}
                        </span>
                      ),
                    )}
                  </div>
                </>
              )}

              {active.widgetPreview.kind === "balance" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Wallet className="size-3.5 text-primary" />
                      {t("widget.balanceTitle")}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      useWalletBalance()
                    </Badge>
                  </div>

                  <div
                    dir="ltr"
                    className="rounded-xl bg-card p-3 border border-border/60 font-mono space-y-1"
                  >
                    <div className="text-sm font-black text-foreground">
                      {active.widgetPreview.qtyText}
                    </div>
                    <div className="text-xs text-emerald-500 font-bold">
                      {active.widgetPreview.totalText} (Live WS Valuation)
                    </div>
                  </div>
                </>
              )}

              {active.widgetPreview.kind === "cancel" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <XCircle className="size-3.5 text-destructive" />
                      {t("widget.cancelTitle")}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      DELETE /trade/cancel
                    </Badge>
                  </div>

                  <div
                    dir="ltr"
                    className="flex items-center justify-between rounded-xl bg-card p-3 border border-border/60 font-mono text-xs"
                  >
                    <div>
                      <div className="font-bold">
                        {active.widgetPreview.pair} • BUY
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        {active.widgetPreview.qtyText}
                      </div>
                    </div>
                    <span className="rounded-lg bg-destructive/15 text-destructive px-2.5 py-1 font-bold text-[11px]">
                      Cancel Order
                    </span>
                  </div>
                </>
              )}

              {active.widgetPreview.kind === "howto" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <HelpCircle className="size-3.5 text-primary" />
                      {t("widget.howtoTitle")}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Guided Step-by-Step
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("widget.howtoBody")}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("stage3Desc")}
            </p>
            <Link href="/dashboard/trade/btc" className="block">
              <Button
                variant="secondary"
                color="primary"
                size="sm"
                className="w-full font-bold justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5" />
                  {t("openLiveAssistant")}
                </span>
                <ArrowUpRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Capability Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {(
          [
            "capTrade",
            "capQuick",
            "capPercent",
            "capBalance",
            "capCancel",
            "capHowto",
          ] as const
        ).map((cap) => (
          <div
            key={cap}
            className="rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 flex items-center gap-2 text-xs font-semibold text-foreground"
          >
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
            <span>{t(`capabilities.${cap}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
