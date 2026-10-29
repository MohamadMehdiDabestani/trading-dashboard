import { randomUUID } from "crypto";
import { OrderBook } from "./orderbook";
import {
  EngineOrder,
  EngineTrade,
  FilledOrderUpdate,
  MatchResult,
  OrderStatus,
  SCALE,
} from "@repo/types";
import { fromScale } from "@/utils/scaleBigInt";

export class MatchingEngine {
  private books = new Map<string, OrderBook>();

  private getBook(symbol: string): OrderBook {
    let book = this.books.get(symbol);
    if (!book) {
      book = new OrderBook(symbol);
      this.books.set(symbol, book);
    }
    return book;
  }
  logBootstrapMatches(): void {
    for (const [symbol, book] of this.books.entries()) {
      const { bids, asks } = book.getLevelsForSimulation();

      type SimOrder = {
        id: string;
        userId: string;
        side: "buy" | "sell";
        price: bigint;
        remaining: bigint;
        timestamp: number;
      };

      const simBids: { price: bigint; queue: SimOrder[] }[] = bids
        .map((lvl) => ({
          price: lvl.price,
          queue: lvl.orders
            .map((o) => ({
              id: o.id,
              userId: o.userId,
              side: o.side,
              price: o.price,
              remaining: o.quantity - o.filled,
              timestamp: o.timestamp,
            }))
            .filter((o) => o.remaining > 0n),
        }))
        .filter((lvl) => lvl.queue.length > 0);

      const simAsks: { price: bigint; queue: SimOrder[] }[] = asks
        .map((lvl) => ({
          price: lvl.price,
          queue: lvl.orders
            .map((o) => ({
              id: o.id,
              userId: o.userId,
              side: o.side,
              price: o.price,
              remaining: o.quantity - o.filled,
              timestamp: o.timestamp,
            }))
            .filter((o) => o.remaining > 0n),
        }))
        .filter((lvl) => lvl.queue.length > 0);

      let bi = 0; // بهترین bid level
      let ai = 0; // بهترین ask level

      console.log(`\n[BOOTSTRAP-SIM][${symbol}] checking crossable orders...`);

      let found = false;

      while (bi < simBids.length && ai < simAsks.length) {
        const bidLvl = simBids[bi];
        const askLvl = simAsks[ai];
        if (!bidLvl || !askLvl) break;
        // چون bids نزولی و asks صعودی هستن
        if (bidLvl.price < askLvl.price) break;

        let bq = bidLvl.queue;
        let aq = askLvl.queue;

        while (bq.length > 0 && aq.length > 0) {
          const bid = bq[0];
          const ask = aq[0];
          if (!bid || !ask) break;

          const qty =
            bid.remaining < ask.remaining ? bid.remaining : ask.remaining;
          const execPrice = ask.price; // مشابه maker ask در matchBuy

          found = true;
          console.log(
            `[SIM-TRADE] symbol=${symbol} buyOrder=${bid.id} sellOrder=${ask.id} buyer=${bid.userId} seller=${ask.userId} price=${fromScale(execPrice)} qty=${fromScale(qty)}`,
          );

          bid.remaining -= qty;
          ask.remaining -= qty;

          if (bid.remaining === 0n) bq.shift();
          if (ask.remaining === 0n) aq.shift();
        }

        if (bq.length === 0) bi++;
        if (aq.length === 0) ai++;
      }

      if (!found) {
        console.log(`[BOOTSTRAP-SIM][${symbol}] no matches found`);
      }
    }
  }

  private loadOrders(orders: EngineOrder[]): void {
    for (const order of orders) {
      // فقط سفارش limit فعال باید وارد بوک شود
      if (order.type !== "limit") continue;
      if (order.filled >= order.quantity) continue;
      if (order.quantity <= 0n || order.price <= 0n) continue;

      this.getBook(order.symbol).addOrder(order);
    }
  }

  bootstrapActiveOrders(orders: EngineOrder[]): void {
    this.loadOrders(orders);
    this.logBootstrapMatches();
  }

  replaceSymbolOrders(symbol: string, orders: EngineOrder[]): void {
    this.books.set(symbol, new OrderBook(symbol));
    this.loadOrders(orders);
  }

  getOrder(symbol: string, orderId: string): EngineOrder | null {
    return this.getBook(symbol).getOrder(orderId);
  }

  logActiveOrders(): void {
    for (const [symbol, book] of this.books.entries()) {
      const active = book.getActiveOrders();

      console.log(`\n[${symbol}] active orders: ${active.length}`);
      for (const o of active) {
        const remaining = o.quantity - o.filled;
        console.log(
          `- id=${o.id} user=${o.userId} side=${o.side} type=${o.type} price=${fromScale(o.price)} qty=${o.quantity.toString()} filled=${o.filled.toString()} remaining=${remaining.toString()}`,
        );
      }
    }
  }
  // ─── Public API ───────────────────────────────────────────────────────────
  submitOrder(order: EngineOrder): MatchResult {
    if (order.quantity <= 0n) throw new Error("Invalid quantity");
    if (order.type === "limit" && order.price <= 0n)
      throw new Error("Invalid price");
    if (order.filled !== 0n)
      throw new Error("Order.filled must be zero on creation");
    const book = this.getBook(order.symbol);

    const result: MatchResult = { trades: [], updates: [], deltas: [] };

    // true یعنی matching به‌خاطر self-trade متوقف شده
    const blocked =
      order.side === "buy"
        ? this.matchBuy(order, book, result)
        : this.matchSell(order, book, result);

    const remaining = order.filled < order.quantity;

    if (blocked || (order.type === "market" && remaining)) {
      // باقی‌ماندهٔ taker هرگز وارد بوک نمی‌شود (self-trade یا market بدون نقدینگی)
      result.updates.push({
        orderId: order.id,
        filled: order.filled,
        status: "cancelled",
      });
    } else if (order.type === "limit" && remaining) {
      result.deltas.push(book.addOrder(order));
    }

    // برای هر order فقط آخرین وضعیت (وگرنه CASE در SQL مقدار قدیمی را برمی‌دارد)
    result.updates = dedupeUpdates(result.updates);

    return result;
  }

  cancelOrder(symbol: string, orderId: string): MatchResult | null {
    const book = this.getBook(symbol);
    const order = book.getOrder(orderId);
    if (!order) return null;

    const delta = book.cancel(order);

    return {
      trades: [],
      updates: [
        {
          orderId,
          filled: order.filled,
          status: "cancelled",
        },
      ],
      deltas: delta ? [delta] : [],
    };
  }

  getSnapshot(symbol: string, depth = 20) {
    return this.getBook(symbol).getSnapshot(depth);
  }
  getActiveOrdersByUser(symbol: string, userId: string): EngineOrder[] {
    return this.getBook(symbol)
      .getActiveOrders()
      .filter((o) => o.userId === userId);
  }
  // ─── Match logic ──────────────────────────────────────────────────────────

  /** @returns true اگر به‌دلیل self-trade متوقف شد */
  private matchBuy(
    taker: EngineOrder,
    book: OrderBook,
    result: MatchResult,
  ): boolean {
    while (taker.filled < taker.quantity) {
      const maker = book.peekBestAsk();
      if (!maker) break;

      if (taker.type === "limit" && maker.price > taker.price) break;

      // جلوگیری از wash trade: taker کنسل می‌شود
      if (maker.userId === taker.userId) return true;

      const tradeQty = minBigInt(
        taker.quantity - taker.filled,
        maker.quantity - maker.filled,
      );

      this.recordTrade(maker, taker, tradeQty, maker.price, result);

      // اول مجموع سطح را کم کن، بعد در صورت fill کامل حذف کن
      const levelDelta = book.consumeMaker(maker, tradeQty);

      if (maker.filled === maker.quantity) {
        const delta = book.removeFrontAsk();
        if (delta) result.deltas.push(delta);
      } else {
        result.deltas.push(levelDelta);
      }
    }
    return false;
  }

  private matchSell(
    taker: EngineOrder,
    book: OrderBook,
    result: MatchResult,
  ): boolean {
    while (taker.filled < taker.quantity) {
      const maker = book.peekBestBid();
      if (!maker) break;

      if (taker.type === "limit" && maker.price < taker.price) break;

      if (maker.userId === taker.userId) return true;

      const tradeQty = minBigInt(
        taker.quantity - taker.filled,
        maker.quantity - maker.filled,
      );

      this.recordTrade(maker, taker, tradeQty, maker.price, result);

      const levelDelta = book.consumeMaker(maker, tradeQty);

      if (maker.filled === maker.quantity) {
        const delta = book.removeFrontBid();
        if (delta) result.deltas.push(delta);
      } else {
        result.deltas.push(levelDelta);
      }
    }
    return false;
  }

  // ─── Trade factory ────────────────────────────────────────────────────────
  // همیشه buyer و seller صریحاً مشخص است — وابستگی به ترتیب پارامتر نداریم

  private recordTrade(
    maker: EngineOrder,
    taker: EngineOrder,
    quantity: bigint,
    price: bigint,
    result: MatchResult,
  ): void {
    maker.filled += quantity;
    taker.filled += quantity;

    // تعیین واقعی buyer و seller
    const buyer = maker.side === "buy" ? maker : taker;
    const seller = maker.side === "sell" ? maker : taker;

    const trade: EngineTrade = {
      id: randomUUID(),
      symbol: maker.symbol,
      makerOrderId: maker.id,
      takerOrderId: taker.id,
      buyOrderId: buyer.id,
      sellOrderId: seller.id,
      buyerId: buyer.userId,
      sellerId: seller.userId,
      price,
      quantity,
      quoteQuantity: (price * quantity) / SCALE,
      executedAt: new Date(),
    };

    result.trades.push(trade);
    result.updates.push(makeUpdate(maker));
    result.updates.push(makeUpdate(taker));
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minBigInt(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

function makeUpdate(order: EngineOrder): FilledOrderUpdate {
  let status: OrderStatus;
  if (order.filled === order.quantity) {
    status = "filled";
  } else if (order.filled > 0n) {
    status = "partial";
  } else {
    status = "open";
  }
  return { orderId: order.id, filled: order.filled, status };
}

function dedupeUpdates(updates: FilledOrderUpdate[]): FilledOrderUpdate[] {
  const latest = new Map<string, FilledOrderUpdate>();
  for (const u of updates) latest.set(u.orderId, u);
  return [...latest.values()];
}