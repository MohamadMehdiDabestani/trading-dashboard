import BTree from "sorted-btree";
import { EngineOrder, OrderBookSnapshot, PriceLevel, SCALE } from "./types";

export class OrderBook {
  private symbol: string;

  // bids: key = -price (negated) → minKey() = best bid
  private bids = new BTree<bigint, PriceLevel>();

  // asks: key = price → minKey() = best ask
  private asks = new BTree<bigint, PriceLevel>();

  // orderId → { side, price } for O(1) cancel lookup
  private orderIndex = new Map<string, { side: "buy" | "sell"; price: bigint }>();

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  // ─── Insert ────────────────────────────────────────────────────────────────

  addOrder(order: EngineOrder): void {
    if (order.side === "buy") {
      const key = -order.price;
      let level = this.bids.get(key);
      if (!level) {
        level = { price: order.price, orders: [] };
        this.bids.set(key, level);
      }
      level.orders.push(order);
    } else {
      const key = order.price;
      let level = this.asks.get(key);
      if (!level) {
        level = { price: order.price, orders: [] };
        this.asks.set(key, level);
      }
      level.orders.push(order);
    }
    this.orderIndex.set(order.id, { side: order.side, price: order.price });
  }

  // ─── Peek (no removal) ────────────────────────────────────────────────────

  peekBestAsk(): EngineOrder | null {
    const key = this.asks.minKey();
    if (key === undefined) return null;
    const level = this.asks.get(key)!;
    return level.orders[0] ?? null;
  }

  peekBestBid(): EngineOrder | null {
    const key = this.bids.minKey();
    if (key === undefined) return null;
    const level = this.bids.get(key)!;
    return level.orders[0] ?? null;
  }

  // ─── Remove front of level (call ONLY after confirmed fully filled) ────────

  removeFrontAsk(): void {
    const key = this.asks.minKey();
    if (key === undefined) return;
    const level = this.asks.get(key)!;
    const removed = level.orders.shift();
    if (removed) this.orderIndex.delete(removed.id);
    if (level.orders.length === 0) this.asks.delete(key);
  }

  removeFrontBid(): void {
    const key = this.bids.minKey();
    if (key === undefined) return;
    const level = this.bids.get(key)!;
    const removed = level.orders.shift();
    if (removed) this.orderIndex.delete(removed.id);
    if (level.orders.length === 0) this.bids.delete(key);
  }

  // ─── Cancel by ID ─────────────────────────────────────────────────────────

  removeOrder(orderId: string): boolean {
    const meta = this.orderIndex.get(orderId);
    if (!meta) return false;

    if (meta.side === "buy") {
      const key = -meta.price;
      const level = this.bids.get(key);
      if (!level) return false;
      const idx = level.orders.findIndex((o) => o.id === orderId);
      if (idx === -1) return false;
      level.orders.splice(idx, 1);
      if (level.orders.length === 0) this.bids.delete(key);
    } else {
      const key = meta.price;
      const level = this.asks.get(key);
      if (!level) return false;
      const idx = level.orders.findIndex((o) => o.id === orderId);
      if (idx === -1) return false;
      level.orders.splice(idx, 1);
      if (level.orders.length === 0) this.asks.delete(key);
    }

    this.orderIndex.delete(orderId);
    return true;
  }

  // ─── Snapshot ─────────────────────────────────────────────────────────────

  getSnapshot(depth = 20): OrderBookSnapshot {
    const bids: { price: string; quantity: string }[] = [];
    const asks: { price: string; quantity: string }[] = [];

    let count = 0;
    this.bids.forEachPair((_key, level) => {
      if (count >= depth) return false;
      const qty = level.orders.reduce((s, o) => s + (o.quantity - o.filled), 0n);
      // price / SCALE — no intermediate multiplication, no precision loss
      bids.push({
        price: formatScaled(level.price),
        quantity: formatScaled(qty),
      });
      count++;
    });

    count = 0;
    this.asks.forEachPair((_key, level) => {
      if (count >= depth) return false;
      const qty = level.orders.reduce((s, o) => s + (o.quantity - o.filled), 0n);
      asks.push({
        price: formatScaled(level.price),
        quantity: formatScaled(qty),
      });
      count++;
    });

    return { symbol: this.symbol, bids, asks, timestamp: Date.now() };
  }
}

// bigint scaled by 10^18 → decimal string با 8 رقم اعشار
function formatScaled(value: bigint): string {
  const intPart = value / SCALE;
  const fracPart = value % SCALE;
  // 8 decimal places کافیه برای نمایش
  const fracStr = (fracPart * 100_000_000n / SCALE).toString().padStart(8, "0");
  return `${intPart}.${fracStr}`;
}
