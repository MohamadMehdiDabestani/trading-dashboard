"use client";

import { useEffect, useRef, useState } from "react";
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
  chips?: string[]; // پیشنهاد بعدی؛ فقط زیر آخرین پیام نمایش داده می‌شود
};

const ASSETS = ["USDT", ...SYMBOLS.map((s) => s.baseAsset)];
const SUGGESTIONS = [
  "موجودی من",
  "اوردرهای باز من",
  "قیمت بیت کوین",
  "ارزش دارایی‌های من",
];
const WELCOME =
  "سلام! بنویس چه کاری می‌خوای: مثلاً «۱۰۰ دلار بیت‌کوین بخرم»، «نصف اتریومم رو بفروش» یا «موجودی بیت‌کوینم چقدره».";

const HELP_LINES = [
  "هر چیزی که ناقص باشد (ارز، مقدار، قیمت) را همین‌جا می‌پرسم.",
  "قبل از ثبت هر سفارش، کارت تأیید می‌بینی.",
  "«سریع / فوری / مارکت» = سفارش مارکت؛ بدون آن = لیمیت با قیمت دلخواه.",
  "مقدار را می‌توانی به دلار، به کوین یا به درصد بگویی.",
  "ارزهای پشتیبانی‌شده: BTC، ETH، BNB، SOL، XRP، ADA.",
];
const HELP_GROUPS: ChipGroup[] = [
  {
    title: "خرید و فروش",
    chips: [
      "۱۰۰ دلار بیت کوین بخرم",
      "۰.۰۰۲۵ بیت کوین بخرم",
      "اتریوم بفروشم",
      "سریع ۲۰۰ دلار سولانا بخر",
      "نصف بیت کوینم رو بفروش",
      "همه ریپل رو بفروش",
    ],
  },
  {
    title: "موجودی و دارایی",
    chips: [
      "موجودی من",
      "چقدر بیت کوین دارم",
      "چند دلار دارم",
      "ارزش دارایی‌های من",
    ],
  },
  { title: "قیمت", chips: ["قیمت بیت کوین", "قیمت همه ارزها"] },
  {
    title: "سفارش‌ها",
    chips: [
      "اوردرهای باز من",
      "اوردرهای باز من توی بیت کوین",
      "سفارش بیت کوینم رو لغو کن",
    ],
  },
  { title: "آموزش", chips: ["چطوری بیت کوین بخرم", "چطوری اتریوم بفروشم"] },
];
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
  const qc = useQueryClient();
  const balances = useWalletBalance();
  const createOrder = useCreateOrder();
  const cancelOrder = useCancelOrder();

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => [bot(WELCOME)]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [slotVal, setSlotVal] = useState("");
  const [slotUnit, setSlotUnit] = useState<"USDT" | "BASE">("USDT");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
              `موجودی ${a}`,
              [
                `قابل‌استفاده: ${toPlain(Number(b?.available ?? 0))}`,
                `قفل‌شده: ${toPlain(Number(b?.locked ?? 0))}`,
              ],
              ["ارزش دارایی‌های من", "اوردرهای باز من"],
            ),
          );
        } else {
          const lines = rows
            .filter((b) => Number(b.available) + Number(b.locked ?? 0) > 0)
            .map(
              (b) =>
                `${b.asset}: ${toPlain(Number(b.available))} (قفل‌شده ${toPlain(Number(b.locked ?? 0))})`,
            );
          push(
            bot("موجودی شما", lines.length ? lines : ["کیف پول خالی است."], [
              "ارزش دارایی‌های من",
              "اوردرهای باز من",
            ]),
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
            p.symbol ? `قیمت ${name(p.symbol)}` : "قیمت لحظه‌ای",
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
          bot(`ارزش کل دارایی: ${toPlain(total, 2)} USDT`, [
            ...rows.map((r) => `${r.a}: ${toPlain(r.v, 2)} USDT`),
            ...(missingPrice.length
              ? [`بدون قیمت: ${missingPrice.join("، ")}`]
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
        // ساختار پاسخ GetRecentTradesReply و نام فیلدها (id, symbol, side, quantity, price) را تأیید کن
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
            ? "کدام سفارش را لغو کنم؟"
            : p.symbol
              ? `سفارش‌های باز ${name(p.symbol)}`
              : "سفارش‌های باز شما";
        push(
          orders.length
            ? { ...bot(title), orders }
            : bot(title, ["سفارش بازی ندارید."]),
        );
        return;
      }

      case "HOWTO": {
        const verb = p.howto === "SELL" ? "فروش" : "خرید";
        push(
          bot(`برای ${verb}${p.symbol ? " " + name(p.symbol) : ""}:`, [
            "۱) از صفحه‌ی معامله، جفت‌ارز را انتخاب کنید.",
            "۲) نوع سفارش را انتخاب کنید: لیمیت (قیمت دلخواه) یا مارکت (فوری).",
            "۳) مقدار را وارد و ثبت کنید.",
            `یا همین‌جا بنویس «می‌خوام ... ${p.howto === "SELL" ? "بفروشم" : "بخرم"}» تا انجام بدم.`,
          ]),
        );
        return;
      }

      default:
        push(
          bot(
            "متوجه نشدم. می‌تونم خرید، فروش، قیمت، موجودی، ارزش دارایی و سفارش‌های باز رو انجام بدم.",
            undefined,
            SUGGESTIONS,
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
        push(bot("تعداد درخواست‌ها زیاد است؛ چند لحظه صبر کنید."));
        return;
      }
      if (!res.ok) throw new Error();
      await handleIntent(IntentSchema.parse(await res.json()));
    } catch {
      push(bot("خطا در ارتباط با دستیار. دوباره تلاش کنید."));
    } finally {
      setBusy(false);
    }
  }

  function showHelp() {
    if (busy) return;
    push({
      ...bot(
        "راهنما — روی هر نمونه بزن تا اجرا شود:",
        HELP_LINES.map((l) => `• ${l}`),
      ),
      groups: HELP_GROUPS,
    });
  }

  function submitSlot() {
    const n = parsePositive(slotVal);
    if (!n || !missing) return;
    const shown = normalizeText(slotVal);
    push(
      me(
        missing === "price"
          ? `قیمت: ${shown}`
          : slotUnit === "USDT"
            ? `${shown} دلار`
            : `${shown} ${meta?.baseAsset ?? ""}`,
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
        push(
          bot(
            `✅ سفارش ${draft.side === "buy" ? "خرید" : "فروش"} ${meta.label} ثبت شد.`,
            undefined,
            ["اوردرهای باز من", "موجودی من"],
          ),
        );
        setDraft(null);
      },
      onError: (e) => {
        push(
          bot(
            `❌ ثبت سفارش ناموفق بود${e instanceof Error && e.message ? ` (${e.message})` : ""}.`,
          ),
        );
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
      onError: () => push(bot("❌ لغو سفارش ناموفق بود.")),
    });
  }

  return (
    <>
      {open && (
        <div
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="fixed bottom-24 end-6 z-50 flex origin-bottom animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200 h-[32rem] max-h-[calc(100dvh-8rem)] w-88 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border bg-blue-50 dark:bg-card text-card-foreground shadow-lg"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="size-4 text-primary" />
              دستیار معامله
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setMsgs([bot(WELCOME)]);
                  setDraft(null);
                }}
                aria-label="گفتگوی جدید"
                title="گفتگوی جدید"
              >
                <RotateCcw />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="بستن"
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
                          {o.side === "buy" ? "خرید" : "فروش"}
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
                        لغو
                      </Button>
                    </div>
                    <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <dt>مقدار</dt>
                      <dd dir="ltr" className="text-end tabular-nums">
                        {o.quantity}
                      </dd>
                      <dt>قیمت</dt>
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
                {SUGGESTIONS.map((s) => (
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
                <p className="mb-2">کدام ارز؟</p>
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
                      ? `موجودی ${draft.side === "sell" ? meta.baseAsset : "USDT"} کافی نیست. چه مقدار ${meta.baseAsset} ${draft.side === "buy" ? "بخری" : "بفروشی"}؟`
                      : `چه مقدار ${meta.baseAsset} ${draft.side === "buy" ? "بخری" : "بفروشی"}؟`
                    : `قیمت سفارش (${meta.quoteAsset})؟${live ? ` قیمت لحظه‌ای: ${toPlain(live, 6)}` : ""}`}
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
                        {u === "USDT" ? "دلار (USDT)" : meta.baseAsset}
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
                    ثبت
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
                  تأیید {draft.side === "buy" ? "خرید" : "فروش"} {meta.label} (
                  {draft.type === "limit" ? "لیمیت" : "مارکت"})
                  {draft.percent ? ` — ${draft.percent}٪ موجودی` : ""}
                </p>
                <ul className="space-y-1 text-muted-foreground tabular-nums">
                  <li>
                    مقدار: {qty ? toPlain(qty) : "—"} {meta.baseAsset}
                  </li>
                  <li>
                    قیمت:{" "}
                    {execPrice
                      ? toPlain(execPrice, 6)
                      : "قیمت زنده در دسترس نیست"}
                  </li>
                  <li>مجموع: {total ? toPlain(total, 2) : "—"} USDT</li>
                </ul>
                {insufficient && (
                  <p className="mt-2 text-destructive">موجودی کافی نیست.</p>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className={`text-white ${draft.side === "buy" ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}`}
                    onClick={confirm}
                    disabled={!canConfirm || createOrder.isPending}
                  >
                    تأیید و ثبت
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDraft(null)}
                  >
                    لغو
                  </Button>
                </div>
              </div>
            )}

            {busy && (
              <div
                aria-label="در حال پردازش"
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
              aria-label="راهنما"
              title="راهنما و نمونه دستورها"
            >
              <CircleHelp />
            </Button>
            <Input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="پیام خود را بنویسید"
              maxLength={300}
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !text.trim()}
              aria-label="ارسال"
            >
              <Send className="rtl:-scale-x-100" />
            </Button>
          </form>
        </div>
      )}

      <div className="fixed bottom-6 end-6 z-50">
        {/* حلقه‌ی pulse؛ وقتی چت باز است یا کاربر motion کم خواسته، خاموش است */}
        {!open && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 opacity-50 animate-ping [animation-duration:2.4s] motion-reduce:hidden"
          />
        )}
        <Button
          size="icon-lg"
          onClick={() => setOpen((o) => !o)}
          aria-label="دستیار هوشمند"
          className="relative size-14 rounded-full border-0 bg-linear-to-br from-violet-500 via-primary to-fuchsia-500 text-white shadow-[0_0_28px_-4px] shadow-violet-500/60 ring-1 ring-white/25 transition-transform duration-200 hover:scale-110 hover:shadow-fuchsia-500/60 active:scale-95 [&_svg]:size-6"
        >
          {open ? <X /> : <Sparkles className="fill-white/25" />}
        </Button>
      </div>
    </>
  );
}
