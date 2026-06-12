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

  private bids = new BTree<bigint, PriceLevel>(); // key = -price
  private asks = new BTree<bigint, PriceLevel>(); // key = price

  private orderIndex = new Map<
    string,
    { side: "buy" | "sell"; price: bigint }
  >();

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

    this.orderIndex.set(order.id, { side: order.side, price: order.price });

    return {
      side: order.side === "buy" ? "bid" : "ask",
      price: order.price,
      quantity: level.totalQuantity,
    };
  }

  // حذف کامل maker که کاملاً پر شده
  removeFrontAsk(): OrderBookLevelDelta | null {
    const key = this.asks.minKey();
    if (key === undefined) return null;

    const level = this.asks.get(key)!;
    const removed = level.orders.shift();
    if (!removed) return null;

    this.orderIndex.delete(removed.id);

    level.totalQuantity -= removed.quantity - removed.filled;

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
    level.totalQuantity -= removed.quantity - removed.filled;

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
    const meta = this.orderIndex.get(orderId);
    if (!meta) return null;
    const key = meta.price; // no negative
    const tree = meta.side === "buy" ? this.bids : this.asks;
    const level = tree.get(key);
    if (!level) return null;
    return level.orders.find((o: any) => o.id === orderId) || null;
  }

  // snapshot بدون reduce
  getSnapshot(depth = 20): OrderBookSnapshot {
    const bids = [];
    const asks = [];

    const bidIt = this.bids.entries();
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
