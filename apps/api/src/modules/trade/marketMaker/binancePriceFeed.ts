import WebSocket from "ws";
import { fromScale, parseToScaledBigInt } from "@/utils/scaleBigInt";

export type PriceTick = {
  symbol: string;
  bid: bigint;
  ask: bigint;
  mid: bigint;
};

type Listener = (tick: PriceTick) => void;

export class BinancePriceFeed {
  private ws: WebSocket | null = null;
  private stopped = false;
  private retry = 0;
  private lastMessageAt = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private watchdogTimer?: NodeJS.Timeout;

  private readonly listeners = new Set<Listener>();
  private readonly lastTicks = new Map<string, PriceTick>();

  /**
   * @param symbolMap  کلید: نماد بایننس با حروف کوچک (btcusdt)، مقدار: نماد داخلی (BTCUSDT)
   */
  constructor(
    private readonly symbolMap: Record<string, string>,
    private readonly baseUrl: string = process.env.BINANCE_WS_URL ??
      "wss://data-stream.binance.vision",
  ) {}

  /** ثبت listener؛ تابع لغو اشتراک را برمی‌گرداند */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getTick(symbol: string): PriceTick | undefined {
    return this.lastTicks.get(symbol);
  }

  /** آخرین قیمت (mid) به‌صورت string اعشاری، مناسب ارسال به کلاینت */
  get(symbol: string): string | undefined {
    const t = this.lastTicks.get(symbol);
    return t ? fromScale(t.mid, 8) : undefined;
  }

  start() {
    if (this.watchdogTimer) return; // قبلاً start شده
    this.stopped = false;
    this.connect();

    this.watchdogTimer = setInterval(() => {
      if (
        this.ws &&
        this.ws.readyState === WebSocket.OPEN &&
        Date.now() - this.lastMessageAt > 15_000
      ) {
        console.warn("[BINANCE_FEED] no data for 15s, reconnecting");
        this.ws.terminate();
      }
    }, 5_000);
  }

  stop() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);
    this.watchdogTimer = undefined;
    this.ws?.removeAllListeners();
    this.ws?.terminate();
    this.ws = null;
  }

  private connect() {
    if (this.stopped) return;

    const streams = Object.keys(this.symbolMap)
      .map((s) => `${s}@bookTicker`)
      .join("/");

    const ws = new WebSocket(`${this.baseUrl}/stream?streams=${streams}`);
    this.ws = ws;

    ws.on("open", () => {
      this.retry = 0;
      this.lastMessageAt = Date.now();
      console.log(`[BINANCE_FEED] connected: ${streams}`);
    });

    ws.on("message", (raw) => {
      this.lastMessageAt = Date.now();

      try {
        const msg = JSON.parse(raw.toString());
        const d = msg.data;
        if (!d?.s || !d.b || !d.a) return;

        const symbol = this.symbolMap[String(d.s).toLowerCase()];
        if (!symbol) return;

        const bid = parseToScaledBigInt(d.b);
        const ask = parseToScaledBigInt(d.a);
        if (bid <= 0n || ask <= 0n || bid > ask) return;

        const tick: PriceTick = { symbol, bid, ask, mid: (bid + ask) / 2n };
        this.lastTicks.set(symbol, tick);

        for (const l of this.listeners) {
          try {
            l(tick);
          } catch (err) {
            console.error("[BINANCE_FEED] listener error:", err);
          }
        }
      } catch (err) {
        console.error("[BINANCE_FEED] bad message:", err);
      }
    });

    ws.on("error", (err) => {
      console.error("[BINANCE_FEED] error:", err.message);
    });

    ws.on("close", () => {
      if (this.ws === ws) this.ws = null;
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect() {
    if (this.stopped || this.reconnectTimer) return;

    const delay = Math.min(30_000, 1_000 * 2 ** this.retry++);
    console.warn(`[BINANCE_FEED] disconnected, retry in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delay);
  }
}