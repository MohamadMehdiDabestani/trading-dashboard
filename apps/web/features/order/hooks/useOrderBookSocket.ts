"use client";

import { useEffect, useState } from "react";

export type BookLevel = { price: number; amount: number; total: number };
export type LastPrice = { price: number; direction: "up" | "down" };
export type SocketStatus = "connecting" | "live" | "reconnecting";

type State = {
  asks: BookLevel[]; // گران‌ترین بالا، بهترین ask پایین (کنار نوار میانی)
  bids: BookLevel[]; // بهترین bid بالا
  lastPrice: LastPrice | null;
  status: SocketStatus;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:5000/ws";

// engine با BigInt مقیاس 10^18 کار می‌کند و سرور آن را string می‌فرستد.
// getSnapshot خروجی اعشاری می‌دهد (formatScaled)، پس مقیاس‌زدایی لازم نیست.
const SCALED = false;

function fromScaled(v: unknown): number {
  const s = String(v ?? "0");
  if (!SCALED || !/^-?\d+$/.test(s)) return Number(s);
  const neg = s.startsWith("-");
  const digits = (neg ? s.slice(1) : s).padStart(19, "0");
  const int = digits.slice(0, -18);
  const frac = digits.slice(-18);
  return Number(`${neg ? "-" : ""}${int}.${frac}`);
}

function toLevels(raw: any[] | undefined): BookLevel[] {
  return (raw ?? []).map((l) => {
    const p = Array.isArray(l) ? l[0] : l.price;
    const q = Array.isArray(l) ? l[1] : (l.quantity ?? l.amount ?? l.size);
    const price = fromScaled(p);
    const amount = fromScaled(q);
    return { price, amount, total: price * amount };
  });
}

export function useOrderBookSocket(symbol: string, paused = false) {
  const [state, setState] = useState<State>({
    asks: [],
    bids: [],
    lastPrice: null,
    status: "connecting",
  });

  // با عوض شدن symbol داده‌ی قبلی پاک می‌شود (نه با pause/resume)
  useEffect(() => {
    setState({ asks: [], bids: [], lastPrice: null, status: "connecting" });
  }, [symbol]);

  // وقتی paused است سوکت بسته می‌ماند و آخرین داده روی صفحه می‌ماند؛
  // با resume دوباره وصل و subscribe می‌شود و snapshot تازه می‌آید
  useEffect(() => {
    if (!symbol || paused) return;

    let ws: WebSocket | null = null;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    setState((s) => ({ ...s, status: "connecting" }));

    const applyPrice = (price: number) =>
      setState((s) => {
        const prev = s.lastPrice;
        const direction =
          prev && price !== prev.price
            ? price > prev.price
              ? "up"
              : "down"
            : (prev?.direction ?? "up");
        return { ...s, lastPrice: { price, direction } };
      });

    const connect = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        retry = 0;
        setState((s) => ({ ...s, status: "live" }));
        ws?.send(JSON.stringify({ type: "subscribe", symbol }));
      };

      ws.onmessage = (e) => {
        let msg: any;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }

        if (msg.type === "snapshot") {
          const asks = toLevels(msg.asks ?? msg.sells).sort(
            (a, b) => b.price - a.price,
          );
          const bids = toLevels(msg.bids ?? msg.buys).sort(
            (a, b) => b.price - a.price,
          );
          setState((s) => ({ ...s, asks, bids }));
          if (msg.lastPrice != null) applyPrice(Number(msg.lastPrice));
        } else if (msg.type === "ticker") {
          applyPrice(Number(msg.data.price));
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        setState((s) => ({ ...s, status: "reconnecting" }));
        const delay = Math.min(1000 * 2 ** retry++, 15_000);
        timer = setTimeout(connect, delay);
      };

      ws.onerror = () => ws?.close();
    };

    connect();

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [symbol, paused]);

  return state;
}
