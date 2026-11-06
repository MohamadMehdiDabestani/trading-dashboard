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
    qtyTextFa?: string;
    qtyTextEn?: string;
    priceTextFa?: string;
    priceTextEn?: string;
    totalTextFa?: string;
    totalTextEn?: string;
  };
};

const SCENARIOS: readonly ScenarioData[] = [
  {
    id: "quickBuy",
    badge: "QUICK_BUY",
    rawFa: "سریع ۲۰۰ دلار بیت‌کوین بخر",
    rawEn: "Quick buy $200 worth of Bitcoin",
    normalizedFa: "سریع 200 دلار بیت کوین بخر",
    normalizedEn: "quick buy 200 usd btc",
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
      qtyTextFa: "۰.۰۰۲۱۲۱۳۴ BTC",
      qtyTextEn: "0.00212134 BTC",
      priceTextFa: "~$94,280.00 (لحظه‌ای WS)",
      priceTextEn: "~$94,280.00 (Live WS)",
      totalTextFa: "۲۰۰.۰۰ USDT",
      totalTextEn: "200.00 USDT",
    },
  },
  {
    id: "percentSell",
    badge: "SELL + %",
    rawFa: "نصف اتریومم رو به قیمت ۲۸۰۰ بفروش",
    rawEn: "Sell 50% of my Ethereum at $2,800",
    normalizedFa: "نصف اتریومم رو به قیمت 2800 بفروش",
    normalizedEn: "sell 50 percent eth at 2800",
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
      qtyTextFa: "۰.۷۵۰۰۰۰۰۰ ETH (۵۰٪ موجود)",
      qtyTextEn: "0.75000000 ETH (50% Avail)",
      priceTextFa: "$2,800.00 (لیمیت)",
      priceTextEn: "$2,800.00 (Limit)",
      totalTextFa: "۲,۱۰۰.۰۰ USDT",
      totalTextEn: "2,100.00 USDT",
    },
  },
  {
    id: "slotFill",
    badge: "SLOT FILLING",
    rawFa: "میخوام سولانا بخرم",
    rawEn: "I want to buy Solana",
    normalizedFa: "میخوام سولانا بخرم",
    normalizedEn: "i want to buy solana",
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
    rawEn: "How much Bitcoin do I have?",
    normalizedFa: "چقدر بیت کوین دارم؟",
    normalizedEn: "how much btc do i have",
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
      qtyTextFa: "۰.۴۲۵۰۰۰۰۰ BTC",
      qtyTextEn: "0.42500000 BTC",
      totalTextFa: "≈ ۴۰,۰۶۹.۲۱ دلار",
      totalTextEn: "≈ $40,069.21",
    },
  },
  {
    id: "cancelOrder",
    badge: "CANCEL",
    rawFa: "سفارش بیت کوینم رو لغو کن",
    rawEn: "Cancel my Bitcoin order",
    normalizedFa: "سفارش بیت کوینم رو لغو کن",
    normalizedEn: "cancel my btc order",
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
      qtyTextFa: "۰.۰۵ BTC با قیمت $۹۲,۵۰۰",
      qtyTextEn: "0.05 BTC @ $92,500",
    },
  },
  {
    id: "howto",
    badge: "HOWTO",
    rawFa: "چطوری ۱۰۰ دلار بیت کوین بخرم؟",
    rawEn: "How do I buy $100 worth of Bitcoin?",
    normalizedFa: "چطوری 100 دلار بیت کوین بخرم؟",
    normalizedEn: "how to buy 100 usd btc",
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
      totalTextFa: "۱۰۰ USDT",
      totalTextEn: "100 USDT",
    },
  },
];

export function JevAiWorkflowShowcase() {
  const t = useTranslations("landing.aiSection");
  const locale = useLocale();
  const isFa = locale === "fa";
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
            LLM_PROVIDER=jev • model: jev-1.13
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
                  {isFa ? `«${sc.rawFa}»` : `"${sc.rawEn}"`}
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
                {isFa ? active.rawFa : active.rawEn}
              </div>
              <div
                dir="ltr"
                className="pt-1.5 border-t border-border/50 font-mono text-[11px] text-emerald-500 flex items-center justify-between"
              >
                <span>normalizeText()</span>
                <span>"{isFa ? active.normalizedFa : active.normalizedEn}"</span>
              </div>
            </div>

            {/* JEV Multi-Head Choice + Confidence Bars */}
            <div className="space-y-2.5" dir="ltr">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>{t("decisionEngine")}</span>
                <span>{t("choiceConfidence")}</span>
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
                <span className="text-emerald-500 font-bold">{t("badges.zodValid")}</span>
              </div>
              <pre className="text-[11px] leading-relaxed text-foreground/95 pt-1 text-start" dir="ltr">
                {JSON.stringify(active.parsedIntent, null, 2)}
              </pre>
            </div>

            <div className="flex flex-wrap gap-1.5" dir="ltr">
              <span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
                {t("badges.neverInvents")}
              </span>
              <span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
                {t("badges.supportsUnits")}
              </span>
              <span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
                {t("badges.rateLimit")}
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
                      <span className="text-muted-foreground">{t("widget.fields.pair")}:</span>
                      <span className="font-bold">
                        {active.widgetPreview.pair}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("widget.fields.quantity")}:</span>
                      <span className="font-bold">
                        {isFa ? active.widgetPreview.qtyTextFa : active.widgetPreview.qtyTextEn}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("widget.fields.price")}:</span>
                      <span>{isFa ? active.widgetPreview.priceTextFa : active.widgetPreview.priceTextEn}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">{t("widget.fields.total")}:</span>
                      <span className="font-bold text-primary">
                        {isFa ? active.widgetPreview.totalTextFa : active.widgetPreview.totalTextEn}
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
                      {t("widget.missingSlotBadge")}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t("widget.slotPrompt")}
                  </p>

                  <div className="flex flex-wrap gap-1.5" dir="ltr">
                    {(isFa
                      ? ["۵۰ تتر", "۱۰۰ تتر", "۵۰٪ موجودی", "۱ SOL"]
                      : ["$50 USDT", "$100 USDT", "50% Balance", "1 SOL"]
                    ).map((chip) => (
                      <span
                        key={chip}
                        className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary"
                      >
                        {chip}
                      </span>
                    ))}
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
                      {isFa ? active.widgetPreview.qtyTextFa : active.widgetPreview.qtyTextEn}
                    </div>
                    <div className="text-xs text-emerald-500 font-bold">
                      {isFa ? active.widgetPreview.totalTextFa : active.widgetPreview.totalTextEn}{" "}
                      {t("widget.liveWsValuation")}
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
                        {isFa ? active.widgetPreview.qtyTextFa : active.widgetPreview.qtyTextEn}
                      </div>
                    </div>
                    <span className="rounded-lg bg-destructive/15 text-destructive px-2.5 py-1 font-bold text-[11px]">
                      {t("widget.cancelBtn")}
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
                      {t("widget.guidedBadge")}
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
