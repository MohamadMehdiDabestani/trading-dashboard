import BTreeComponent from "sorted-btree";
// @ts-ignore
const BTree = BTreeComponent.default || BTreeComponent;

import {
  EngineOrder,
  OrderBookLevelDelta,
  OrderBookSnapshot,
  PriceLevel,
  SCALE,
} from "@repo/types";
function formatScaled(value: bigint): string {
  const intPart = value / SCALE;
  const fracPart = value % SCALE;
  // 8 decimal places کافیه برای نمایش
  const fracStr = ((fracPart * 100_000_000n) / SCALE)
    .toString()
    .padStart(8, "0");
  return `${intPart}.${fracStr}`;
}
export class OrderBook {
  private symbol: string;

  private bids = new BTree<bigint, PriceLevel>(); // key = price (best bid = maxKey)
  private asks = new BTree<bigint, PriceLevel>(); // key = price

  // orderId → سفارش (برای getOrder در O(1))
  private orderIndex = new Map<
    string,
    { side: "buy" | "sell"; price: bigint; order: EngineOrder }
  >();

  // userId → (orderId → سفارش)؛ تا getActiveOrdersByUser کل بوک را اسکن نکند
  private byUser = new Map<string, Map<string, EngineOrder>>();

  private indexUser(order: EngineOrder) {
    let m = this.byUser.get(order.userId);
    if (!m) {
      m = new Map();
      this.byUser.set(order.userId, m);
    }
    m.set(order.id, order);
  }

  private unindexUser(order: EngineOrder) {
    const m = this.byUser.get(order.userId);
    if (!m) return;
    m.delete(order.id);
    if (m.size === 0) this.byUser.delete(order.userId);
  }

  getActiveOrdersByUser(userId: string): EngineOrder[] {
    const m = this.byUser.get(userId);
    return m ? [...m.values()] : [];
  }

  constructor(symbol: string) {
    this.symbol = symbol;
  }
  getActiveOrders(): EngineOrder[] {
    const out: EngineOrder[] = [];

    for (const [, lvl] of this.bids.entries()) {
      for (const o of lvl.orders) {
        if (o.filled < o.quantity) out.push(o);
      }
    }

    for (const [, lvl] of this.asks.entries()) {
      for (const o of lvl.orders) {
        if (o.filled < o.quantity) out.push(o);
      }
    }

    return out;
  }
  getLevelsForSimulation() {
    const bids: { price: bigint; orders: EngineOrder[] }[] = [];
    const asks: { price: bigint; orders: EngineOrder[] }[] = [];

    for (const [, lvl] of this.bids.entries()) {
      bids.push({ price: lvl.price, orders: lvl.orders });
    }
    for (const [, lvl] of this.asks.entries()) {
      asks.push({ price: lvl.price, orders: lvl.orders });
    }

    return { bids, asks };
  }
  // ایجاد یا گرفتن level
  private getOrCreateLevel(order: EngineOrder): PriceLevel {
    const key = order.price; // both sides

    const tree = order.side === "buy" ? this.bids : this.asks;
    let level = tree.get(key);

    if (!level) {
      level = { price: order.price, orders: [], totalQuantity: 0n };
      tree.set(key, level);
    }

    return level;
  }

  private getLevel(order: EngineOrder): PriceLevel {
    const key = order.price; // both sides
    const tree = order.side === "buy" ? this.bids : this.asks;
    const level = tree.get(key);
    if (!level) throw new Error("Level not found");
    return level;
  }

  private makeDelta(
    side: "bid" | "ask",
    price: bigint,
    level: PriceLevel,
  ): OrderBookLevelDelta {
    return { side, price, quantity: level.totalQuantity };
  }

  // اضافه کردن order جدید
  addOrder(order: EngineOrder): OrderBookLevelDelta {
    const level = this.getOrCreateLevel(order);

    level.orders.push(order);
    level.totalQuantity += order.quantity - order.filled;

    this.orderIndex.set(order.id, {
      side: order.side,
      price: order.price,
      order,
    });
    this.indexUser(order);

    return {
      side: order.side === "buy" ? "bid" : "ask",
      price: order.price,
      quantity: level.totalQuantity,
    };
  }

  // حذف کامل maker که کاملاً پر شده. totalQuantity دیگر کسر نمی‌شود
  // چون consumeMaker قبلاً باقی‌مانده را کم کرده؛ اینجا فقط یک level خالی
  // حذف می‌شود و مقدار final level.totalQuantity (0n یا مقدار باقی‌مانده)
  // به عنوان دلتا فرستاده می‌شود تا بودک نوسان نداشته باشد.
  removeFrontAsk(): OrderBookLevelDelta | null {
    const key = this.asks.minKey();
    if (key === undefined) return null;

    const level = this.asks.get(key)!;
    const removed = level.orders.shift();
    if (!removed) return null;

    this.orderIndex.delete(removed.id);
    this.unindexUser(removed);

    if (level.orders.length === 0) {
      this.asks.delete(key);
      return { side: "ask", price: level.price, quantity: 0n };
    }

    return {
      side: "ask",
      price: level.price,
      quantity: level.totalQuantity,
    };
  }

  removeFrontBid(): OrderBookLevelDelta | null {
    const key = this.bids.maxKey();
    if (key === undefined) return null;

    const level = this.bids.get(key)!;
    const removed = level.orders.shift();
    if (!removed) return null;

    this.orderIndex.delete(removed.id);
    this.unindexUser(removed);

    if (level.orders.length === 0) {
      this.bids.delete(key);
      return { side: "bid", price: level.price, quantity: 0n };
    }

    return {
      side: "bid",
      price: level.price,
      quantity: level.totalQuantity,
    };
  }

  peekBestAsk(): EngineOrder | null {
    const key = this.asks.minKey();
    if (key === undefined) return null;

    const level = this.asks.get(key);
    if (!level) return null;

    return level.orders[0] ?? null;
  }

  peekBestBid(): EngineOrder | null {
    const key = this.bids.maxKey();
    if (key === undefined) return null;

    const level = this.bids.get(key);
    if (!level) return null;

    return level.orders[0] ?? null; // oldest at that price
  }

  /**
   * وقتی maker (کامل یا جزئی) fill می‌شود، مجموع سطح باید کم شود.
   * قبلاً این کار انجام نمی‌شد و snapshot/delta اشتباه می‌ماند.
   * باید قبل از removeFront* صدا زده شود.
   */
  consumeMaker(maker: EngineOrder, qty: bigint): OrderBookLevelDelta {
    const level = this.getLevel(maker);
    level.totalQuantity -= qty;
    return {
      side: maker.side === "buy" ? "bid" : "ask",
      price: maker.price,
      quantity: level.totalQuantity,
    };
  }

  // cancel
  cancel(order: EngineOrder): OrderBookLevelDelta | null {
    const level = this.getLevel(order);

    const idx = level.orders.findIndex((o) => o.id === order.id);
    if (idx === -1) return null;

    const removed = level.orders[idx];
    if (!removed) return null;
    const remaining = removed.quantity - removed.filled;
    level.totalQuantity -= remaining;

    level.orders.splice(idx, 1);
    this.orderIndex.delete(order.id);
    this.unindexUser(removed);

    if (level.orders.length === 0) {
      const key = order.price;
      if (order.side === "buy") this.bids.delete(key);
      else this.asks.delete(key);

      return {
        side: order.side === "buy" ? "bid" : "ask",
        price: order.price,
        quantity: 0n,
      };
    }

    return {
      side: order.side === "buy" ? "bid" : "ask",
      price: order.price,
      quantity: level.totalQuantity,
    };
  }

  getOrder(orderId: string): EngineOrder | null {
    return this.orderIndex.get(orderId)?.order ?? null;
  }

  /**
   * بررسی پیش از اجرا (Pre-check) بدون تغییر وضعیت بوک:
   * آیا اجرای این سفارش تیکر باعث برخورد با سفارش فعال خودِ همان کاربر در هر قیمتی می‌شود؟
   */
  wouldSelfTrade(taker: EngineOrder): boolean {
    const userOrders = this.byUser.get(taker.userId);
    if (!userOrders || userOrders.size === 0) return false;

    const targetSide = taker.side === "buy" ? "sell" : "buy";
    let hasCrossableOwnOrder = false;

    for (const o of userOrders.values()) {
      if (o.side !== targetSide) continue;
      if (taker.type === "market") {
        hasCrossableOwnOrder = true;
        break;
      }
      if (taker.side === "buy" && o.price <= taker.price) {
        hasCrossableOwnOrder = true;
        break;
      }
      if (taker.side === "sell" && o.price >= taker.price) {
        hasCrossableOwnOrder = true;
        break;
      }
    }

    if (!hasCrossableOwnOrder) return false;

    let remaining = taker.quantity - taker.filled;

    if (taker.side === "buy") {
      for (const [, level] of this.asks.entries()) {
        if (taker.type === "limit" && level.price > taker.price) break;
        for (const maker of (level.orders as EngineOrder[])) {
          if (remaining <= 0n) return false;
          if (maker.userId === taker.userId) return true;
          const avail = maker.quantity - maker.filled;
          remaining -= avail < remaining ? avail : remaining;
        }
        if (remaining <= 0n) return false;
      }
    } else {
      const bidIt = this.bids.entriesReversed();
      while (true) {
        const next = bidIt.next();
        if (next.done) break;
        const [, level] = next.value;
        if (taker.type === "limit" && level.price < taker.price) break;
        for (const maker of (level.orders as EngineOrder[])) {
          if (remaining <= 0n) return false;
          if (maker.userId === taker.userId) return true;
          const avail = maker.quantity - maker.filled;
          remaining -= avail < remaining ? avail : remaining;
        }
        if (remaining <= 0n) return false;
      }
    }

    return false;
  }

  // snapshot بدون reduce
  getSnapshot(depth = 20): OrderBookSnapshot {
    const bids = [];
    const asks = [];

    const bidIt = this.bids.entriesReversed();
    for (let i = 0; i < depth; i++) {
      const next = bidIt.next();
      if (next.done) break;
      const [, lvl] = next.value;
      if (lvl.totalQuantity > 0n)
        bids.push({
          price: formatScaled(lvl.price),
          quantity: formatScaled(lvl.totalQuantity),
        });
    }

    const askIt = this.asks.entries();
    for (let i = 0; i < depth; i++) {
      const next = askIt.next();
      if (next.done) break;
      const [, lvl] = next.value;
      if (lvl.totalQuantity > 0n)
        asks.push({
          price: formatScaled(lvl.price),
          quantity: formatScaled(lvl.totalQuantity),
        });
    }

    return { symbol: this.symbol, bids, asks, timestamp: Date.now() };
  }
}