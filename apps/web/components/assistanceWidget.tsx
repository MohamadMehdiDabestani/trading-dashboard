"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { CircleHelp, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { SYMBOLS, type CreateOrderDTO, type CancelOrderDTO } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/apiClient";
import { useWalletBalance } from "@/features/wallet/hooks/useWalletBalance";
import { useAssetPrices } from "@/features/markets/hooks/useAssetPrice";
import {
  useCancelOrder,
  useCreateOrder,
} from "@/features/order/hooks/useTradeMutations";
import { normalizeText, parsePositive, toPlain } from "@/lib/aiAssistance/normalize";
import { IntentSchema, ParsedIntent } from "@/lib/aiAssistance/schema";
import { tradeKeys } from "@/features/order/api/trade.keys";

type Draft = {
  side: "buy" | "sell";
  type: "limit" | "market";
  symbol: string | null;
  amount: number | null;
  unit: "USDT" | "BASE";
  price: number | null;
  percent: number | null;
};
type OrderRow = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: string;
  price: string;
};
type ChipGroup = { title: string; chips: string[] };
type Msg = {
  id: number;
  role: "user" | "bot";
  text: string;
  lines?: string[];
  orders?: OrderRow[];
  groups?: ChipGroup[];
  chips?: string[];
};

const ASSETS = ["USDT", ...SYMBOLS.map((s) => s.baseAsset)];
const floor8 = (n: number) => Math.floor(n * 1e8) / 1e8;

let uid = 0;
const bot = (text: string, lines?: string[], chips?: string[]): Msg => ({
  id: ++uid,
  role: "bot",
  text,
  lines,
  chips,
});
const me = (text: string): Msg => ({ id: ++uid, role: "user", text });

async function fetchOpenOrders(symbol: string | null) {
  const qs = new URLSearchParams();
  if (symbol) qs.set("symbol", symbol);
  qs.append("status", "open");
  qs.append("status", "partial");
  qs.set("pageSize", "20");
  return apiFetch<any>(`trade?${qs}`);
}

export function AssistantWidget() {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const isRtl = locale === "fa";

  const qc = useQueryClient();
  const balances = useWalletBalance();
  const createOrder = useCreateOrder();
  const cancelOrder = useCancelOrder();

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => [bot(t("welcome"))]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [slotVal, setSlotVal] = useState("");
  const [slotUnit, setSlotUnit] = useState<"USDT" | "BASE">("USDT");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prevLocaleRef = useRef(locale);
  useEffect(() => {
    if (prevLocaleRef.current !== locale) {
      prevLocaleRef.current = locale;
      setMsgs([bot(t("welcome"))]);
      setDraft(null);
    }
  }, [locale, t]);

  const suggestions = useMemo(
    () => [
      t("suggestions.balance"),
      t("suggestions.openOrders"),
      t("suggestions.btcPrice"),
      t("suggestions.portfolio"),
    ],
    [t],
  );

  const helpLines = useMemo(
    () => [
      t("helpLines.line1"),
      t("helpLines.line2"),
      t("helpLines.line3"),
      t("helpLines.line4"),
      t("helpLines.line5"),
    ],
    [t],
  );

  const helpGroups: ChipGroup[] = useMemo(
    () => [
      {
        title: t("helpGroups.tradeTitle"),
        chips: t.raw("helpGroups.tradeChips") as string[],
      },
      {
        title: t("helpGroups.balanceTitle"),
        chips: t.raw("helpGroups.balanceChips") as string[],
      },
      {
        title: t("helpGroups.priceTitle"),
        chips: t.raw("helpGroups.priceChips") as string[],
      },
      {
        title: t("helpGroups.ordersTitle"),
        chips: t.raw("helpGroups.ordersChips") as string[],
      },
      {
        title: t("helpGroups.howtoTitle"),
        chips: t.raw("helpGroups.howtoChips") as string[],
      },
    ],
    [t],
  );

  const push = (...m: Msg[]) => setMsgs((p) => [...p, ...m]);
  const lastId = msgs[msgs.length - 1]?.id;
  const getPrices = () =>
    qc.fetchQuery({
      queryKey: ["market", "prices"],
      queryFn: () => apiFetch<Record<string, string>>("market/prices"),
      staleTime: 5_000,
    });

  const avail = (a: string) =>
    Number(balances.data?.find((b) => b.asset === a)?.available ?? 0);
  const meta = draft?.symbol
    ? SYMBOLS.find((s) => s.value === draft.symbol)
    : undefined;
  const { priceOf } = useAssetPrices(meta ? [meta.baseAsset] : []);
  const live = meta ? priceOf(meta.baseAsset) : null;

  // مقدار: یا مستقیم گفته شده، یا درصدی از موجودی (رو به پایین گرد می‌شود تا از موجودی بیشتر نشود)
  const pctAmount =
    draft?.percent && meta
      ? floor8(
          (draft.side === "sell" ? avail(meta.baseAsset) : avail("USDT")) *
            (draft.percent / 100),
        )
      : null;
  const amount =
    draft?.amount ?? (pctAmount && pctAmount > 0 ? pctAmount : null);
  const unit: "USDT" | "BASE" =
    draft?.amount != null
      ? draft.unit
      : draft?.side === "sell"
        ? "BASE"
        : "USDT";

  // کد تصمیم می‌گیرد چه چیزی کم است، نه مدل
  const missing = !draft
    ? null
    : !draft.symbol
      ? "symbol"
      : !amount
        ? "amount"
        : draft.type === "limit" && !draft.price
          ? "price"
          : null;

  const execPrice = draft
    ? draft.type === "limit"
      ? draft.price
      : live
    : null;
  const qty =
    amount != null
      ? unit === "BASE"
        ? amount
        : execPrice
          ? amount / execPrice
          : null
      : null;
  const total = qty && execPrice ? qty * execPrice : null;
  const insufficient =
    draft && meta && qty != null
      ? draft.side === "buy"
        ? total != null && total > avail("USDT") + 1e-8
        : qty > avail(meta.baseAsset) + 1e-12
      : false;
  const canConfirm = !!(
    draft &&
    meta &&
    missing === null &&
    qty &&
    qty > 0 &&
    execPrice &&
    !insufficient
  );

  useEffect(() => {
    setSlotVal(missing === "price" && live ? toPlain(live, 6) : "");
  }, [missing, live != null]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, draft, open]);

  async function handleIntent(p: ParsedIntent) {
    const name = (v: string | null) =>
      SYMBOLS.find((s) => s.value === v)?.label;

    switch (p.intent) {
      case "BUY":
      case "SELL":
      case "QUICK_BUY":
      case "QUICK_SELL":
        setDraft({
          side: p.intent.endsWith("BUY") ? "buy" : "sell",
          type: p.intent.startsWith("QUICK") ? "market" : "limit",
          symbol: p.symbol,
          amount: p.amount,
          unit: p.amountUnit ?? "BASE",
          price: p.price,
          percent: p.percent,
        });
        setSlotUnit("USDT");
        return;

      case "BALANCE": {
        const rows = balances.data ?? [];
        const a = p.asset && ASSETS.includes(p.asset) ? p.asset : null;
        if (a) {
          const b = rows.find((x) => x.asset === a);
          push(
            bot(
              t("intents.balanceSingle", { asset: a }),
              [
                t("intents.available", { amount: toPlain(Number(b?.available ?? 0)) }),
                t("intents.locked", { amount: toPlain(Number(b?.locked ?? 0)) }),
              ],
              [t("suggestions.portfolio"), t("suggestions.openOrders")],
            ),
          );
        } else {
          const lines = rows
            .filter((b) => Number(b.available) + Number(b.locked ?? 0) > 0)
            .map(
              (b) =>
                `${b.asset}: ${toPlain(Number(b.available))} (${t("intents.locked", { amount: toPlain(Number(b.locked ?? 0)) })})`,
            );
          push(
            bot(
              t("intents.balanceAll"),
              lines.length ? lines : [t("intents.emptyWallet")],
              [t("suggestions.portfolio"), t("suggestions.openOrders")],
            ),
          );
        }
        return;
      }

      case "PRICE": {
        const prices = await getPrices();
        const list = p.symbol
          ? SYMBOLS.filter((s) => s.value === p.symbol)
          : SYMBOLS;
        push(
          bot(
            p.symbol
              ? t("intents.priceSingle", { name: name(p.symbol) ?? p.symbol })
              : t("intents.priceLive"),
            list.map((s) => {
              const v = Number(prices[s.baseAsset]);
              return `${s.baseAsset}: ${v > 0 ? toPlain(v, 6) : "—"} USDT`;
            }),
          ),
        );
        return;
      }

      case "PORTFOLIO": {
        const prices = await getPrices();
        let total = 0;
        const rows: { a: string; v: number }[] = [];
        const missingPrice: string[] = [];
        for (const b of balances.data ?? []) {
          const amt = Number(b.available) + Number(b.locked ?? 0);
          if (!(amt > 0)) continue;
          const pr = b.asset === "USDT" ? 1 : Number(prices[b.asset]);
          if (!(pr > 0)) {
            missingPrice.push(b.asset);
            continue;
          }
          total += amt * pr;
          rows.push({ a: b.asset, v: amt * pr });
        }
        rows.sort((x, y) => y.v - x.v);
        push(
          bot(t("intents.portfolioTotal", { total: toPlain(total, 2) }), [
            ...rows.map((r) => `${r.a}: ${toPlain(r.v, 2)} USDT`),
            ...(missingPrice.length
              ? [t("intents.missingPrice", { assets: missingPrice.join(", ") })]
              : []),
          ]),
        );
        return;
      }

      case "OPEN_ORDERS":
      case "CANCEL": {
        const res = await qc.fetchQuery({
          queryKey: [...tradeKeys.all, "assistant-open", p.symbol ?? "all"],
          queryFn: () => fetchOpenOrders(p.symbol),
          staleTime: 0,
        });
        const items: any[] =
          res?.items ?? res?.orders ?? (Array.isArray(res) ? res : []);
        const orders: OrderRow[] = items.map((o) => ({
          id: String(o.id),
          symbol: String(o.symbol),
          side: o.side === "buy" ? "buy" : "sell",
          quantity: toPlain(Number(o.quantity)),
          price: toPlain(Number(o.price), 6),
        }));
        const title =
          p.intent === "CANCEL"
            ? t("intents.whichOrderCancel")
            : p.symbol
              ? t("intents.openOrdersSingle", { name: name(p.symbol) ?? p.symbol })
              : t("intents.openOrdersAll");
        push(
          orders.length
            ? { ...bot(title), orders }
            : bot(title, [t("intents.noOpenOrders")]),
        );
        return;
      }

      case "HOWTO": {
        const verb = p.howto === "SELL" ? t("actions.sell") : t("actions.buy");
        const infinitive =
          p.howto === "SELL"
            ? t("actions.sellInfinitive")
            : t("actions.buyInfinitive");
        const target = p.symbol ? " " + (name(p.symbol) ?? p.symbol) : "";
        push(
          bot(t("intents.howtoTitle", { verb, target }), [
            t("intents.step1"),
            t("intents.step2"),
            t("intents.step3"),
            t("intents.step4", { verb: infinitive }),
          ]),
        );
        return;
      }

      default:
        push(
          bot(
            t("intents.unknown"),
            undefined,
            suggestions,
          ),
        );
    }
  }

  async function send(override?: string) {
    const raw = (override ?? text).trim();
    if (!raw || busy) return;
    setText("");
    setDraft(null);
    push(me(raw));
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: raw }),
      });
      if (res.status === 429) {
        push(bot(t("intents.rateLimit")));
        return;
      }
      if (!res.ok) throw new Error();
      await handleIntent(IntentSchema.parse(await res.json()));
    } catch {
      push(bot(t("intents.error")));
    } finally {
      setBusy(false);
    }
  }

  function showHelp() {
    if (busy) return;
    push({
      ...bot(
        t("helpGroups.header"),
        helpLines.map((l) => `• ${l}`),
      ),
      groups: helpGroups,
    });
  }

  function submitSlot() {
    const n = parsePositive(slotVal);
    if (!n || !missing) return;
    const shown = normalizeText(slotVal);
    push(
      me(
        missing === "price"
          ? t("slots.priceMsg", { price: shown })
          : slotUnit === "USDT"
            ? t("slots.dollarMsg", { amount: shown })
            : t("slots.baseMsg", { amount: shown, asset: meta?.baseAsset ?? "" }),
      ),
    );
    setDraft((d) =>
      d
        ? missing === "amount"
          ? { ...d, amount: n, unit: slotUnit, percent: null }
          : { ...d, price: n }
        : d,
    );
  }

  function confirm() {
    if (!draft || !meta || !qty || !execPrice) return;
    const body = {
      symbol: meta.value,
      baseAsset: meta.baseAsset,
      quoteAsset: meta.quoteAsset,
      side: draft.side,
      type: draft.type,
      quantity: toPlain(qty),
      ...(draft.type === "limit" ? { price: toPlain(execPrice) } : {}),
    } as CreateOrderDTO;

    createOrder.mutate(body, {
      onSuccess: () => {
        const side = draft.side === "buy" ? t("actions.buy") : t("actions.sell");
        push(
          bot(
            t("confirm.success", { side, symbol: meta.label }),
            undefined,
            [t("suggestions.openOrders"), t("suggestions.balance")],
          ),
        );
        setDraft(null);
      },
      onError: (e) => {
        const err = e instanceof Error && e.message ? ` (${e.message})` : "";
        push(bot(t("confirm.failed", { error: err })));
        setDraft(null);
      },
    });
  }

  function cancel(msgId: number, o: OrderRow) {
    cancelOrder.mutate({ symbol: o.symbol, orderId: o.id } as CancelOrderDTO, {
      onSuccess: () =>
        setMsgs((p) =>
          p.map((m) =>
            m.id === msgId
              ? { ...m, orders: m.orders?.filter((x) => x.id !== o.id) }
              : m,
          ),
        ),
      onError: () => push(bot(t("orderCard.cancelFailed"))),
    });
  }

  return (
    <>
      {open && (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="fixed bottom-24 end-6 z-50 flex origin-bottom animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200 h-[32rem] max-h-[calc(100dvh-8rem)] w-88 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border bg-blue-50 dark:bg-card text-card-foreground shadow-lg"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="size-4 text-primary" />
              {t("name")}
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setMsgs([bot(t("welcome"))]);
                  setDraft(null);
                }}
                aria-label={t("newChat")}
                title={t("newChat")}
              >
                <RotateCcw />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
              >
                <X />
              </Button>
            </div>
          </div>

          <div
            role="log"
            aria-live="polite"
            className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 text-sm [scrollbar-width:thin]"
          >
            {msgs.map((m) => (
              <div
                key={m.id}
                className={`${m.groups || m.orders ? "max-w-full" : "max-w-[85%]"} animate-in fade-in-0 slide-in-from-bottom-1 rounded-2xl px-3 py-2 duration-200 ${
                  m.role === "user"
                    ? "self-end rounded-ee-sm bg-primary text-primary-foreground"
                    : "self-start rounded-es-sm bg-muted"
                }`}
              >
                <p>{m.text}</p>
                {m.lines?.map((l, i) => (
                  <p
                    key={i}
                    className="mt-1 text-muted-foreground tabular-nums"
                    dir="auto"
                  >
                    {l}
                  </p>
                ))}
                {m.groups?.map((g) => (
                  <div key={g.title} className="mt-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      {g.title}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.chips.map((c) => (
                        <Button
                          key={c}
                          size="sm"
                          variant="outline"
                          className="h-auto whitespace-normal px-2 py-1 text-xs"
                          disabled={busy}
                          onClick={() => send(c)}
                        >
                          {c}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
                {m.orders?.map((o) => (
                  <div
                    key={o.id}
                    className="mt-2 rounded-md border bg-background/60 p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span
                          className={
                            o.side === "buy"
                              ? "text-success"
                              : "text-destructive"
                          }
                        >
                          {o.side === "buy" ? t("actions.buy") : t("actions.sell")}
                        </span>
                        <span dir="ltr">
                          {SYMBOLS.find((x) => x.value === o.symbol)?.label ??
                            o.symbol}
                        </span>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cancelOrder.isPending}
                        onClick={() => cancel(m.id, o)}
                      >
                        {t("orderCard.cancel")}
                      </Button>
                    </div>
                    <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <dt>{t("orderCard.qty")}</dt>
                      <dd dir="ltr" className="text-end tabular-nums">
                        {o.quantity}
                      </dd>
                      <dt>{t("orderCard.price")}</dt>
                      <dd dir="ltr" className="text-end tabular-nums">
                        {o.price} USDT
                      </dd>
                    </dl>
                  </div>
                ))}
                {m.chips && m.id === lastId && !draft && !busy && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.chips.map((c) => (
                      <Button
                        key={c}
                        size="sm"
                        variant="outline"
                        className="h-auto px-2 py-1 text-xs"
                        onClick={() => send(c)}
                      >
                        {c}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {msgs.length === 1 && !busy && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    onClick={() => send(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            )}

            {/* اسلات ناقص: input داخل چت */}
            {draft && missing === "symbol" && (
              <div className="self-start animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl bg-muted p-3">
                <p className="mb-2">{t("slots.whichCoin")}</p>
                <div className="flex flex-wrap gap-2">
                  {SYMBOLS.map((s) => (
                    <Button
                      key={s.value}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        push(me(s.baseAsset));
                        setDraft({ ...draft, symbol: s.value });
                      }}
                    >
                      {s.baseAsset}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {draft && (missing === "amount" || missing === "price") && meta && (
              <div className="self-start animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl bg-muted p-3">
                <p className="mb-2">
                  {missing === "amount"
                    ? draft.percent
                      ? t("slots.insufficient", {
                          sourceAsset: draft.side === "sell" ? meta.baseAsset : "USDT",
                          asset: meta.baseAsset,
                          action: draft.side === "buy" ? t("actions.buyVerb") : t("actions.sellVerb"),
                        })
                      : t("slots.howMuch", {
                          asset: meta.baseAsset,
                          action: draft.side === "buy" ? t("actions.buyVerb") : t("actions.sellVerb"),
                        })
                    : t("slots.orderPrice", { quote: meta.quoteAsset }) +
                      (live ? t("slots.livePrice", { price: toPlain(live, 6) }) : "")}
                </p>
                {missing === "amount" && (
                  <div className="mb-2 flex gap-2">
                    {(["USDT", "BASE"] as const).map((u) => (
                      <Button
                        key={u}
                        size="sm"
                        variant={slotUnit === u ? "default" : "outline"}
                        onClick={() => setSlotUnit(u)}
                      >
                        {u === "USDT" ? t("slots.dollarUnit") : meta.baseAsset}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    inputMode="decimal"
                    dir="ltr"
                    value={slotVal}
                    onChange={(e) => setSlotVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitSlot()}
                    placeholder="0.00"
                  />
                  <Button
                    onClick={submitSlot}
                    disabled={!parsePositive(slotVal)}
                  >
                    {t("slots.submit")}
                  </Button>
                </div>
              </div>
            )}

            {/* کارت تأیید */}
            {draft && meta && missing === null && (
              <div
                className={`self-start animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl border border-s-4 bg-background p-3 ${
                  draft.side === "buy"
                    ? "border-s-success"
                    : "border-s-destructive"
                }`}
              >
                <p className="mb-2 font-medium">
                  {t("confirm.title", {
                    side: draft.side === "buy" ? t("actions.buy") : t("actions.sell"),
                    symbol: meta.label,
                    type: draft.type === "limit" ? t("actions.limit") : t("actions.market"),
                  })}
                  {draft.percent ? t("confirm.percentSuffix", { percent: draft.percent }) : ""}
                </p>
                <ul className="space-y-1 text-muted-foreground tabular-nums">
                  <li>
                    {t("confirm.qty", { qty: qty ? toPlain(qty) : "—", asset: meta.baseAsset })}
                  </li>
                  <li>
                    {t("confirm.price", {
                      price: execPrice
                        ? toPlain(execPrice, 6)
                        : t("confirm.livePriceUnavailable"),
                    })}
                  </li>
                  <li>{t("confirm.total", { total: total ? toPlain(total, 2) : "—" })}</li>
                </ul>
                {insufficient && (
                  <p className="mt-2 text-destructive">{t("confirm.insufficient")}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className={`text-white ${draft.side === "buy" ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}`}
                    onClick={confirm}
                    disabled={!canConfirm || createOrder.isPending}
                  >
                    {t("confirm.submit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDraft(null)}
                  >
                    {t("confirm.cancel")}
                  </Button>
                </div>
              </div>
            )}

            {busy && (
              <div
                aria-label={t("processing")}
                className="flex items-center gap-1 self-start rounded-2xl rounded-es-sm bg-muted px-3 py-3"
              >
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="flex gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={showHelp}
              disabled={busy}
              aria-label={t("help")}
              title={t("helpTitle")}
            >
              <CircleHelp />
            </Button>
            <Input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("inputPlaceholder")}
              maxLength={300}
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !text.trim()}
              aria-label={t("send")}
            >
              <Send className={isRtl ? "rtl:-scale-x-100" : ""} />
            </Button>
          </form>
        </div>
      )}

      <div className="fixed bottom-6 end-6 z-50">
        {!open && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 opacity-50 animate-ping [animation-duration:2.4s] motion-reduce:hidden"
          />
        )}
        <Button
          size="icon-lg"
          onClick={() => setOpen((o) => !o)}
          aria-label={t("title")}
          className="relative size-14 rounded-full border-0 bg-linear-to-br from-violet-500 via-primary to-fuchsia-500 text-white shadow-[0_0_28px_-4px] shadow-violet-500/60 ring-1 ring-white/25 transition-transform duration-200 hover:scale-110 hover:shadow-fuchsia-500/60 active:scale-95 [&_svg]:size-6"
        >
          {open ? <X /> : <Sparkles className="fill-white/25" />}
        </Button>
      </div>
    </>
  );
}
