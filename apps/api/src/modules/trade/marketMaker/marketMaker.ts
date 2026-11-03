import { Side } from "@repo/types";
import { MatchingEngine } from "@/engine";
import { parseToScaledBigInt } from "@/utils/scaleBigInt";
import { TradeService } from "../application/trade.service";
import { BinancePriceFeed, PriceTick } from "./binancePriceFeed";

export type MarketMakerSymbolConfig = {
  symbol: string; // نماد داخلی
  binanceSymbol: string; // نماد بایننس (lowercase)
  baseAsset: string;
  quoteAsset: string;
  levels: number; // تعداد سفارش در هر طرف
  halfSpreadBps: bigint; // فاصله اولین سطح از mid (bps)
  stepBps: bigint; // فاصله بین سطح‌ها (bps)
  tickSize: string; // گام قیمت
  qtyStep: string; // گام مقدار
  baseQty: string; // مقدار پایه هر سفارش (به base asset)
  requoteThresholdBps: bigint; // حداقل حرکت mid برای requote
  minRequoteIntervalMs: number; // حداقل فاصله بین پایان یک requote و شروع بعدی
  staleAfterMs: number; // اگر قیمت این‌قدر نیامد، کوت‌ها کنسل شوند
};

export const MARKET_MAKER_SYMBOLS: MarketMakerSymbolConfig[] = [
  {
    symbol: "BTCUSDT",
    binanceSymbol: "btcusdt",
    baseAsset: "BTC",
    quoteAsset: "USDT",
    levels: 5,
    halfSpreadBps: 3n, // 0.03%
    stepBps: 2n, // 0.02%
    tickSize: "0.01",
    qtyStep: "0.0001",
    baseQty: "0.01",
    requoteThresholdBps: 2n, // 0.02%
    minRequoteIntervalMs: 1_000,
    staleAfterMs: 30_000,
  },
];

const BPS = 10_000n;
const HEARTBEAT_MS = 1_000;
const MIN_INTERVAL_FLOOR_MS = 100;
const SIDE_BACKOFF_MS = 30_000; // بعد از کمبود موجودی، این مدت آن طرف را کوت نمی‌کنیم
const SLOW_REQUOTE_MS = 300; // بالاتر از این، لاگ زمان‌بندی چاپ می‌شود

const roundDown = (v: bigint, step: bigint) => v - (v % step);
const roundUp = (v: bigint, step: bigint) =>
  v % step === 0n ? v : v + (step - (v % step));
const abs = (v: bigint) => (v < 0n ? -v : v);

type Quote = { side: Side; price: bigint; quantity: bigint };

// کلیدهای string حذف می‌شوند و نسخهٔ bigint جایگزین می‌شود
// (اشتراک string & bigint می‌شد never)
type ParsedConfig = Omit<
  MarketMakerSymbolConfig,
  "tickSize" | "qtyStep" | "baseQty"
> & {
  tick: bigint;
  qtyStep: bigint;
  baseQty: bigint;
};

type SymbolState = {
  mid?: bigint;
  lastTickAt: number;
  lastQuotedMid?: bigint;
  lastQuoteDoneAt: number; // زمان «پایان» آخرین requote (نه شروع)
  cleaned: boolean; // کوت‌های باقی‌مانده از اجرای قبلی پاک شده؟
  busy: boolean; // mutex per symbol
  sideBlockedUntil: Record<Side, number>;
};

export class MarketMaker {
  private readonly configs = new Map<string, ParsedConfig>();
  private readonly state = new Map<string, SymbolState>();
  private readonly inflight = new Set<Promise<void>>();

  private running = false;
  private unsubscribeFeed?: () => void;
  private heartbeat?: NodeJS.Timeout;

  constructor(
    private readonly userId: string,
    private readonly tradeService: TradeService,
    private readonly engine: MatchingEngine,
    private readonly feed: BinancePriceFeed,
    configs: MarketMakerSymbolConfig[] = MARKET_MAKER_SYMBOLS,
  ) {
    for (const c of configs) {
      // یک‌بار parse می‌کنیم، نه در هر requote
      const { tickSize, qtyStep, baseQty, ...rest } = c;
      this.configs.set(c.symbol, {
        ...rest,
        tick: parseToScaledBigInt(tickSize),
        qtyStep: parseToScaledBigInt(qtyStep),
        baseQty: parseToScaledBigInt(baseQty),
      });
      this.state.set(c.symbol, {
        lastTickAt: 0,
        lastQuoteDoneAt: 0,
        cleaned: false,
        busy: false,
        sideBlockedUntil: { buy: 0, sell: 0 },
      });
    }
  }

  start() {
    if (this.running) return; // جلوگیری از subscribe/timer تکراری
    this.running = true;

    this.unsubscribeFeed = this.feed.subscribe((tick) => this.onTick(tick));

    // برای وقتی که تیکی نمی‌آید ولی باید refill / stale-check انجام شود
    this.heartbeat = setInterval(() => {
      for (const symbol of this.configs.keys()) this.kick(symbol);
    }, HEARTBEAT_MS);

    // cleanup اولیه (کوت‌های باقی‌مانده از ری‌استارت) بدون انتظار برای اولین tick
    for (const symbol of this.configs.keys()) this.kick(symbol);

    console.log(
      `[MM] started for: ${[...this.configs.keys()].join(", ")} (user=${this.userId})`,
    );
  }

  /** صبر می‌کند حلقه‌های در حال اجرا تمام شوند، بعد کوت‌ها را از بوک جمع می‌کند */
  async stop() {
    if (!this.running) return;
    this.running = false;

    this.unsubscribeFeed?.();
    this.unsubscribeFeed = undefined;
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = undefined;

    await Promise.allSettled([...this.inflight]);

    for (const cfg of this.configs.values()) {
      try {
        await this.cancelOwnOrders(cfg);
      } catch (err) {
        console.error(`[MM][${cfg.symbol}] cancel on stop failed:`, err);
      }
    }
    console.log("[MM] stopped");
  }

  private onTick(tick: PriceTick) {
    const st = this.state.get(tick.symbol);
    if (!st) return;
    st.mid = tick.mid;
    st.lastTickAt = Date.now();
    this.kick(tick.symbol);
  }

  /** حلقه را (در صورت آزاد بودن) شروع می‌کند و برای stop() ردیابی می‌کند */
  private kick(symbol: string) {
    const st = this.state.get(symbol);
    if (!this.running || !st || st.busy) return;

    const p: Promise<void> = this.requoteLoop(symbol).finally(() =>
      this.inflight.delete(p),
    );
    this.inflight.add(p);
  }

  /**
   * برای هر نماد همزمان فقط یک requote در حال اجراست؛
   * اگر وسط کار قیمت عوض شود، بعد از تمام شدن دوباره چک می‌کنیم.
   */
  private async requoteLoop(symbol: string) {
    const cfg = this.configs.get(symbol);
    const st = this.state.get(symbol);
    if (!cfg || !st || st.busy) return;

    st.busy = true;

    try {
      if (!st.cleaned) {
        await this.cancelOwnOrders(cfg);
        st.cleaned = true;
      }

      while (this.running) {
        const mid = st.mid;
        if (mid === undefined) break;

        if (Date.now() - st.lastTickAt > cfg.staleAfterMs) {
          // قیمت بایننس کهنه است؛ کوت‌های قدیمی نباید در بوک بمانند
          await this.cancelOwnOrders(cfg);
          st.lastQuotedMid = undefined;
          break;
        }

        if (!this.shouldRequote(cfg, st, mid)) break;

        await this.requote(cfg, st, mid);
      }
    } catch (err) {
      console.error(`[MM][${symbol}] requote loop error:`, err);
    } finally {
      st.busy = false;
    }
  }

  private shouldRequote(
    cfg: ParsedConfig,
    st: SymbolState,
    mid: bigint,
  ): boolean {
    const now = Date.now();

    // فاصله از «پایان» requote قبلی
    if (
      now - st.lastQuoteDoneAt <
      Math.max(cfg.minRequoteIntervalMs, MIN_INTERVAL_FLOOR_MS)
    ) {
      return false;
    }

    if (st.lastQuotedMid === undefined) return true;

    // قیمت به اندازه کافی حرکت کرده؟
    if (
      abs(mid - st.lastQuotedMid) * BPS >=
      st.lastQuotedMid * cfg.requoteThresholdBps
    ) {
      return true;
    }

    // بعضی کوت‌ها اجرا شده‌اند؟ بوک را دوباره پر کن
    // (طرفی که به‌خاطر کمبود موجودی در backoff است در تعداد مورد انتظار نمی‌آید)
    const activeSides =
      (now >= st.sideBlockedUntil.buy ? 1 : 0) +
      (now >= st.sideBlockedUntil.sell ? 1 : 0);

    const openCount = this.engine.getActiveOrdersByUser(
      cfg.symbol,
      this.userId,
    ).length;

    return openCount < cfg.levels * activeSides;
  }

  private async requote(cfg: ParsedConfig, st: SymbolState, startMid: bigint) {
    const t0 = performance.now();

    try {
      // اول کنسل، بعد ثبت؛ تا کوت کهنه‌ی قدیمی هیچ‌وقت کنار کوت جدید نماند
      // (و self-trade هم پیش نیاید)
      const cancelled = await this.cancelOwnOrders(cfg);
      const t1 = performance.now();

      if (!this.running) return;

      // کنسل ممکن است طول کشیده باشد؛ قیمت تازه را بخوان
      const mid = st.mid ?? startMid;
      st.lastQuotedMid = mid;

      const now = Date.now();
      // طرفی که به‌خاطر کمبود موجودی در backoff است کوت نمی‌شود
      const quotes = this.buildQuotes(cfg, mid).filter(
        (q) => now >= st.sideBlockedUntil[q.side],
      );

      // یک transaction برای همهٔ سفارش‌ها (به‌جای یک transaction برای هر سفارش)
      const { skippedBySide } = await this.tradeService.createLimitOrdersBatch(
        this.userId,
        cfg.symbol,
        cfg.baseAsset,
        cfg.quoteAsset,
        quotes,
      );

      for (const side of ["buy", "sell"] as const) {
        if (skippedBySide[side] > 0) {
          st.sideBlockedUntil[side] = Date.now() + SIDE_BACKOFF_MS;
          console.warn(
            `[MM][${cfg.symbol}] insufficient ${side}-side balance (${skippedBySide[side]} levels skipped), pausing side ${SIDE_BACKOFF_MS / 1000}s`,
          );
        }
      }

      const t2 = performance.now();
      const total = t2 - t0;
      if (total > SLOW_REQUOTE_MS) {
        console.warn(
          `[MM][${cfg.symbol}] slow requote: total=${total.toFixed(0)}ms ` +
            `cancel=${(t1 - t0).toFixed(0)}ms (${cancelled} orders) ` +
            `place=${(t2 - t1).toFixed(0)}ms (${quotes.length} orders)`,
        );
      }
    } finally {
      // حتی در صورت خطا ثبت می‌شود تا spam نشود؛ و از «پایان» حساب می‌شود
      st.lastQuoteDoneAt = Date.now();
    }
  }

  /**
   * منبع حقیقت، خود engine است (نه یک لیست داخلی)؛
   * پس سفارش‌های باقی‌مانده از اجرای قبلی هم پاک می‌شوند.
   * همه در یک transaction کنسل می‌شوند. اگر شکست بخورد خطا بالا می‌رود تا
   * requote انجام نشود (وگرنه کوت جدید کنار کوت کهنه می‌نشیند).
   */
  private async cancelOwnOrders(cfg: ParsedConfig): Promise<number> {
    const ids = this.engine
      .getActiveOrdersByUser(cfg.symbol, this.userId)
      .map((o) => o.id);

    if (ids.length === 0) return 0;
    return this.tradeService.cancelOrdersBatch(this.userId, cfg.symbol, ids);
  }

  private buildQuotes(cfg: ParsedConfig, mid: bigint): Quote[] {
    const { tick, qtyStep, baseQty } = cfg;
    const quotes: Quote[] = [];

    // مقدار کمی رندوم (۱۰۰٪ تا ۱۴۹٪ مقدار پایه) تا بوک طبیعی‌تر دیده شود
    const randQty = () =>
      roundDown(
        (baseQty * BigInt(100 + Math.floor(Math.random() * 50))) / 100n,
        qtyStep,
      );

    for (let i = 0; i < cfg.levels; i++) {
      const offset = cfg.halfSpreadBps + BigInt(i) * cfg.stepBps;

      const bid = roundDown((mid * (BPS - offset)) / BPS, tick);
      const ask = roundUp((mid * (BPS + offset)) / BPS, tick);

      if (bid > 0n)
        quotes.push({ side: "buy", price: bid, quantity: randQty() });
      quotes.push({ side: "sell", price: ask, quantity: randQty() });
    }

    return quotes;
  }
}