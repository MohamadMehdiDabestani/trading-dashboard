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
  minRequoteIntervalMs: number; // حداقل فاصله بین دو requote
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

const roundDown = (v: bigint, step: bigint) => v - (v % step);
const roundUp = (v: bigint, step: bigint) =>
  v % step === 0n ? v : v + (step - (v % step));
const abs = (v: bigint) => (v < 0n ? -v : v);

export class MarketMaker {
  private readonly configs = new Map<string, MarketMakerSymbolConfig>();
  private readonly latestMid = new Map<string, bigint>();
  private readonly lastTickAt = new Map<string, number>();
  private readonly lastQuotedMid = new Map<string, bigint>();
  private readonly lastQuoteAt = new Map<string, number>();
  private readonly busy = new Set<string>(); // mutex per symbol

  private feed?: BinancePriceFeed;
  private heartbeat?: NodeJS.Timeout;

  constructor(
    private readonly userId: string,
    private readonly tradeService: TradeService,
    private readonly engine: MatchingEngine,
    configs: MarketMakerSymbolConfig[] = MARKET_MAKER_SYMBOLS,
  ) {
    for (const c of configs) this.configs.set(c.symbol, c);
  }

  start() {
    const symbolMap: Record<string, string> = {};
    for (const c of this.configs.values()) {
      symbolMap[c.binanceSymbol] = c.symbol;
    }

    this.feed = new BinancePriceFeed(symbolMap, (tick) => this.onTick(tick));
    this.feed.start();

    // برای وقتی که تیکی نمی‌آید ولی باید refill / stale-check انجام شود
    this.heartbeat = setInterval(() => {
      for (const symbol of this.configs.keys()) void this.requoteLoop(symbol);
    }, 1_000);

    console.log(
      `[MM] started for: ${[...this.configs.keys()].join(", ")} (user=${this.userId})`,
    );
  }

  stop() {
    this.feed?.stop();
    if (this.heartbeat) clearInterval(this.heartbeat);
    console.log("[MM] stopped");
  }

  private onTick(tick: PriceTick) {
    if (!this.configs.has(tick.symbol)) return;
    this.latestMid.set(tick.symbol, tick.mid);
    this.lastTickAt.set(tick.symbol, Date.now());
    void this.requoteLoop(tick.symbol);
  }

  /**
   * برای هر نماد همزمان فقط یک requote در حال اجراست؛
   * اگر وسط کار قیمت عوض شود، بعد از تمام شدن دوباره چک می‌کنیم.
   */
  private async requoteLoop(symbol: string) {
    if (this.busy.has(symbol)) return;
    const cfg = this.configs.get(symbol);
    if (!cfg) return;

    this.busy.add(symbol);

    try {
      while (true) {
        const mid = this.latestMid.get(symbol);
        if (mid === undefined) break;

        const lastTick = this.lastTickAt.get(symbol) ?? 0;
        if (Date.now() - lastTick > cfg.staleAfterMs) {
          // قیمت بایننس کهنه است؛ کوت‌های قدیمی نباید در بوک بمانند
          await this.cancelOwnOrders(cfg);
          this.lastQuotedMid.delete(symbol);
          break;
        }

        if (!this.shouldRequote(cfg, mid)) break;

        await this.requote(cfg, mid);
      }
    } catch (err) {
      console.error(`[MM][${symbol}] requote loop error:`, err);
    } finally {
      this.busy.delete(symbol);
    }
  }

  private shouldRequote(cfg: MarketMakerSymbolConfig, mid: bigint): boolean {
    const now = Date.now();
    const lastAt = this.lastQuoteAt.get(cfg.symbol) ?? 0;
    if (now - lastAt < Math.max(cfg.minRequoteIntervalMs, 100)) return false;

    const lastMid = this.lastQuotedMid.get(cfg.symbol);
    if (lastMid === undefined) return true;

    // قیمت به اندازه کافی حرکت کرده؟
    if (abs(mid - lastMid) * BPS >= lastMid * cfg.requoteThresholdBps) {
      return true;
    }

    // بعضی کوت‌ها اجرا شده‌اند؟ بوک را دوباره پر کن
    const openCount = this.engine.getActiveOrdersByUser(
      cfg.symbol,
      this.userId,
    ).length;

    return openCount < cfg.levels * 2;
  }

  private async requote(cfg: MarketMakerSymbolConfig, mid: bigint) {
    // timestamp را اول می‌گذاریم تا حتی در صورت خطا (مثلا کمبود موجودی) spam نشود
    this.lastQuoteAt.set(cfg.symbol, Date.now());
    this.lastQuotedMid.set(cfg.symbol, mid);

    // اول کنسل، بعد ثبت؛ تا کوت کهنه‌ی قدیمی هیچ‌وقت کنار کوت جدید نماند
    await this.cancelOwnOrders(cfg);

    for (const q of this.buildQuotes(cfg, mid)) {
      try {
        await this.tradeService.createOrder(
          this.userId,
          cfg.symbol,
          cfg.baseAsset,
          cfg.quoteAsset,
          q.side,
          "limit",
          q.price,
          q.quantity,
        );
      } catch (err) {
        console.error(
          `[MM][${cfg.symbol}] createOrder failed (${q.side} @ ${q.price}):`,
          err,
        );
      }
    }
  }

  /**
   * منبع حقیقت، خود engine است (نه یک لیست داخلی)؛
   * پس سفارش‌های باقی‌مانده از اجرای قبلی هم پاک می‌شوند.
   * سفارشی که بین دو مرحله پر شده باشد خطای not-found می‌دهد که بی‌خطر است.
   */
  private async cancelOwnOrders(cfg: MarketMakerSymbolConfig) {
    const open = this.engine.getActiveOrdersByUser(cfg.symbol, this.userId);

    for (const order of open) {
      try {
        await this.tradeService.cancelOrder(this.userId, cfg.symbol, order.id);
      } catch (err) {
        console.warn(
          `[MM][${cfg.symbol}] cancel skipped for ${order.id}:`,
          (err as Error)?.message ?? err,
        );
      }
    }
  }

  private buildQuotes(
    cfg: MarketMakerSymbolConfig,
    mid: bigint,
  ): Array<{ side: Side; price: bigint; quantity: bigint }> {
    const tick = parseToScaledBigInt(cfg.tickSize);
    const qtyStep = parseToScaledBigInt(cfg.qtyStep);
    const baseQty = parseToScaledBigInt(cfg.baseQty);

    const quotes: Array<{ side: Side; price: bigint; quantity: bigint }> = [];

    for (let i = 0; i < cfg.levels; i++) {
      const offset = cfg.halfSpreadBps + BigInt(i) * cfg.stepBps;

      const bid = roundDown((mid * (BPS - offset)) / BPS, tick);
      const ask = roundUp((mid * (BPS + offset)) / BPS, tick);

      // مقدار کمی رندوم (۱۰۰٪ تا ۱۴۹٪ مقدار پایه) تا بوک طبیعی‌تر دیده شود
      const randQty = () =>
        roundDown(
          (baseQty * BigInt(100 + Math.floor(Math.random() * 50))) / 100n,
          qtyStep,
        );

      if (bid > 0n) quotes.push({ side: "buy", price: bid, quantity: randQty() });
      quotes.push({ side: "sell", price: ask, quantity: randQty() });
    }

    return quotes;
  }
}