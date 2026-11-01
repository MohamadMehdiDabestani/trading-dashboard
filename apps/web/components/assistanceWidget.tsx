"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Send, X } from "lucide-react";
import { SYMBOLS, type CreateOrderDTO } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/apiClient";
import { useWalletBalance } from "@/features/wallet/hooks/useWalletBalance";
import { useAssetPrices } from "@/hooks/useAssetPrice";
import { useCreateOrder } from "@/features/order/hooks/useTradeMutations";
import { tradeKeys } from "@/features/order/api/trade.keys";
import {
  normalizeText,
  parsePositive,
  toPlain,
} from "@/lib/aiAssistance/normalize";
import { IntentSchema, ParsedIntent } from "@/lib/aiAssistance/schema";

type Draft = {
  side: "buy" | "sell";
  type: "limit" | "market";
  symbol: string | null;
  amount: number | null;
  unit: "USDT" | "BASE";
  price: number | null;
};
type Msg = { id: number; role: "user" | "bot"; text: string; lines?: string[] };

const ASSETS = ["USDT", ...SYMBOLS.map((s) => s.baseAsset)];
let uid = 0;
const bot = (text: string, lines?: string[]): Msg => ({
  id: ++uid,
  role: "bot",
  text,
  lines,
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

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    bot(
      "سلام! بنویس چه کاری می‌خوای: مثلاً «۱۰۰ دلار بیت‌کوین بخرم» یا «موجودی اتریومم چقدره».",
    ),
  ]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [slotVal, setSlotVal] = useState("");
  const [slotUnit, setSlotUnit] = useState<"USDT" | "BASE">("USDT");
  const endRef = useRef<HTMLDivElement>(null);

  const push = (...m: Msg[]) => setMsgs((p) => [...p, ...m]);

  const meta = draft?.symbol
    ? SYMBOLS.find((s) => s.value === draft.symbol)
    : undefined;
  const { priceOf } = useAssetPrices(meta ? [meta.baseAsset] : []);
  const live = meta ? priceOf(meta.baseAsset) : null;

  // کد تصمیم می‌گیرد چه چیزی کم است، نه مدل
  const missing = !draft
    ? null
    : !draft.symbol
      ? "symbol"
      : !draft.amount
        ? "amount"
        : draft.type === "limit" && !draft.price
          ? "price"
          : null;

  const avail = (a: string) =>
    Number(balances.data?.find((b) => b.asset === a)?.available ?? 0);
  const execPrice = draft
    ? draft.type === "limit"
      ? draft.price
      : live
    : null;
  const qty =
    draft?.amount != null
      ? draft.unit === "BASE"
        ? draft.amount
        : execPrice
          ? draft.amount / execPrice
          : null
      : null;
  const total = qty && execPrice ? qty * execPrice : null;
  const insufficient =
    draft && meta && qty != null
      ? draft.side === "buy"
        ? total != null && total > avail("USDT")
        : qty > avail(meta.baseAsset)
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
        });
        setSlotUnit("USDT");
        return;

      case "BALANCE": {
        const rows = balances.data ?? [];
        const a = p.asset && ASSETS.includes(p.asset) ? p.asset : null;
        if (a) {
          const b = rows.find((x) => x.asset === a);
          push(
            bot(`موجودی ${a}`, [
              `قابل‌استفاده: ${toPlain(Number(b?.available ?? 0))}`,
              `قفل‌شده: ${toPlain(Number(b?.locked ?? 0))}`,
            ]),
          );
        } else {
          const lines = rows
            .filter((b) => Number(b.available) + Number(b.locked ?? 0) > 0)
            .map(
              (b) => `${b.asset}: ${b.available} (قفل‌شده ${b.locked ?? 0})`,
            );
          push(bot("موجودی شما", lines.length ? lines : ["کیف پول خالی است."]));
        }
        return;
      }

      case "OPEN_ORDERS": {
        const res = await qc.fetchQuery({
          queryKey: [...tradeKeys.all, "assistant-open", p.symbol ?? "all"],
          queryFn: () => fetchOpenOrders(p.symbol),
          staleTime: 0,
        });
        // ساختار پاسخ GetRecentTradesReply را تأیید کن
        const items: any[] =
          res?.items ?? res?.orders ?? (Array.isArray(res) ? res : []);
        push(
          bot(
            p.symbol ? `سفارش‌های باز ${name(p.symbol)}` : "سفارش‌های باز شما",
            items.length
              ? items.map(
                  (o) =>
                    `${o.side === "buy" ? "خرید" : "فروش"} ${o.quantity} ${o.symbol} @ ${o.price}`,
                )
              : ["سفارش بازی ندارید."],
          ),
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
            "متوجه نشدم. می‌تونم خرید، فروش، موجودی و سفارش‌های باز رو انجام بدم.",
          ),
        );
    }
  }

  async function send() {
    const raw = text.trim();
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
      if (!res.ok) throw new Error();
      await handleIntent(IntentSchema.parse(await res.json()));
    } catch {
      push(bot("خطا در ارتباط با دستیار. دوباره تلاش کنید."));
    } finally {
      setBusy(false);
    }
  }

  function submitSlot() {
    const n = parsePositive(slotVal);
    if (!n || !missing) return;
    push(
      me(
        `${normalizeText(slotVal)}${missing === "amount" && slotUnit === "USDT" ? " دلار" : ""}`,
      ),
    );
    setDraft((d) =>
      d
        ? missing === "amount"
          ? { ...d, amount: n, unit: slotUnit }
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

  return (
    <>
      {open && (
        <div className="bg-blue-50 fixed bottom-24 end-6 z-50 flex h-[32rem] max-h-[calc(100dvh-8rem)] w-88 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border text-card-foreground shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 font-medium">
              <Bot className="size-4 text-primary" />
              دستیار معامله
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="بستن"
            >
              <X />
            </Button>
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 text-sm">
            {msgs.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  m.role === "user"
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted"
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
              </div>
            ))}

            {/* اسلات ناقص: input داخل چت */}
            {draft && missing === "symbol" && (
              <div className="self-start rounded-lg bg-muted p-3">
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
              <div className="self-start rounded-lg bg-muted p-3">
                <p className="mb-2">
                  {missing === "amount"
                    ? `چه مقدار ${meta.baseAsset} ${draft.side === "buy" ? "بخری" : "بفروشی"}؟`
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
              <div className="self-start rounded-lg border bg-background p-3">
                <p className="mb-2 font-medium">
                  تأیید {draft.side === "buy" ? "خرید" : "فروش"} {meta.label} (
                  {draft.type === "limit" ? "لیمیت" : "مارکت"})
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

            {busy && <p className="self-start text-muted-foreground">…</p>}
            <div ref={endRef} />
          </div>

          <form
            className="flex gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="پیام خود را بنویسید…"
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

      <Button
        size="icon-lg"
        className="fixed bottom-6 end-6 z-50 size-12 rounded-full shadow-lg"
        onClick={() => setOpen((o) => !o)}
        aria-label="دستیار هوشمند"
      >
        {open ? <X /> : <Bot />}
      </Button>
    </>
  );
}
