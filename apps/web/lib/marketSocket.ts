import { SYMBOLS } from "@repo/types";

export type PriceDirection = "up" | "down" | "flat";
export type SocketStatus = "idle" | "connecting" | "live" | "reconnecting";

export type LivePrice = {
  symbol: string;
  price: string;
  ts: number;
  direction: PriceDirection;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:5000/ws";
const IDLE_CLOSE_MS = 5_000;

class MarketSocket {
  prices: Record<string, LivePrice> = {};
  status: SocketStatus = "idle";

  private ws: WebSocket | null = null;
  private refs = new Map<string, number>();
  private listeners = new Set<() => void>();
  private retry = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private idleTimer?: ReturnType<typeof setTimeout>;

  // ── store API (برای useSyncExternalStore) ──
  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  getPrices = () => this.prices;
  getStatus = () => this.status;

  private emit() {
    for (const l of this.listeners) l();
  }

  private setStatus(s: SocketStatus) {
    if (this.status === s) return;
    this.status = s;
    this.emit();
  }

  // ── مصرف‌کننده‌ها ──
  retain(symbols: string[]): () => void {
    clearTimeout(this.idleTimer);

    for (const s of symbols) {
      const n = this.refs.get(s) ?? 0;
      this.refs.set(s, n + 1);
      if (n === 0) this.send({ type: "subscribe", symbol: s });
    }
    this.connect();

    let released = false;
    return () => {
      if (released) return;
      released = true;
      for (const s of symbols) {
        const n = (this.refs.get(s) ?? 1) - 1;
        if (n <= 0) {
          this.refs.delete(s);
          this.send({ type: "unsubscribe", symbol: s });
        } else {
          this.refs.set(s, n);
        }
      }
      if (this.refs.size === 0) {
        this.idleTimer = setTimeout(() => this.close(), IDLE_CLOSE_MS);
      }
    };
  }

  /** قیمت اولیه (REST) فقط برای نمادهایی که هنوز tick نگرفته‌اند */
  seed(map: Record<string, string>) {
    let changed = false;
    const next = { ...this.prices };
    for (const [symbol, price] of Object.entries(map)) {
      if (next[symbol]) continue;
      next[symbol] = { symbol, price, ts: 0, direction: "flat" };
      changed = true;
    }
    if (changed) {
      this.prices = next;
      this.emit();
    }
  }

  // ── internals ──
  private send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private connect() {
    if (typeof window === "undefined") return;
    if (this.ws) return; // CONNECTING یا OPEN
    clearTimeout(this.reconnectTimer);

    this.setStatus(this.retry > 0 ? "reconnecting" : "connecting");
    const ws = new WebSocket(WS_URL);
    this.ws = ws;

    ws.onopen = () => {
      this.retry = 0;
      this.setStatus("live");
      for (const s of this.refs.keys()) {
        ws.send(JSON.stringify({ type: "subscribe", symbol: s }));
      }
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        // snapshot های دفتر سفارش‌ها را نادیده می‌گیریم؛ فقط ticker
        if (msg?.type === "ticker" && msg.data?.symbol) {
          this.applyTick(msg.data);
        }
      } catch {
        /* پیام نامعتبر */
      }
    };

    ws.onerror = () => ws.close();

    ws.onclose = () => {
      if (this.ws === ws) this.ws = null;
      if (this.refs.size === 0) {
        this.setStatus("idle");
        return;
      }
      const delay = Math.min(30_000, 1_000 * 2 ** this.retry++);
      this.setStatus("reconnecting");
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    };
  }

  private close() {
    clearTimeout(this.reconnectTimer);
    const ws = this.ws;
    this.ws = null;
    this.retry = 0;
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
    this.setStatus("idle");
  }

  private applyTick(d: { symbol: string; price: string; ts: number }) {
    const prev = this.prices[d.symbol];
    if (prev && d.ts < prev.ts) return;

    const a = Number(d.price);
    const b = prev ? Number(prev.price) : a;
    const direction: PriceDirection =
      a > b ? "up" : a < b ? "down" : (prev?.direction ?? "flat");

    this.prices = {
      ...this.prices,
      [d.symbol]: { symbol: d.symbol, price: d.price, ts: d.ts, direction },
    };
    this.emit();
  }
}

export const marketSocket = new MarketSocket();

/** BTC → BTCUSDT (برای نگاشت پاسخ GET /market/prices) */
export const baseToSymbol = Object.fromEntries(
  SYMBOLS.filter((s) => s.quoteAsset === "USDT").map((s) => [
    s.baseAsset,
    s.value,
  ]),
) as Record<string, string>;