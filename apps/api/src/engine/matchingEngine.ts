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

  // ─── Public API ───────────────────────────────────────────────────────────
  submitOrder(order: EngineOrder): MatchResult {
    if (order.quantity <= 0n) throw new Error("Invalid quantity");
    if (order.type === "limit" && order.price <= 0n)
      throw new Error("Invalid price");
    if (order.filled !== 0n)
      throw new Error("Order.filled must be zero on creation");
    const book = this.getBook(order.symbol);

    const result: MatchResult = { trades: [], updates: [], deltas: [] };

    if (order.side === "buy") {
      this.matchBuy(order, book, result);
    } else {
      this.matchSell(order, book, result);
    }

    if (order.type === "limit" && order.filled < order.quantity) {
      const delta = book.addOrder(order);
      result.deltas.push(delta);
    }

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

  // ─── Match logic ──────────────────────────────────────────────────────────

  private matchBuy(
    taker: EngineOrder,
    book: OrderBook,
    result: MatchResult,
  ): void {
    while (taker.filled < taker.quantity) {
      const maker = book.peekBestAsk();
      if (!maker) break;

      // price check: market order همیشه match میکنه، limit فقط اگر ask <= buy price
      if (taker.type === "limit" && maker.price > taker.price) break;

      const tradeQty = minBigInt(
        taker.quantity - taker.filled,
        maker.quantity - maker.filled,
      );

      // maker is ask (seller), taker is buyer
      this.recordTrade(maker, taker, tradeQty, maker.price, result);

      // اگر maker کاملاً fill شد، از book حذف شود
      if (maker.filled === maker.quantity) {
        const delta = book.removeFrontAsk();
        if (delta) result.deltas.push(delta);
      } else {
        result.deltas.push({
          side: "ask",
          price: maker.price,
          quantity: maker.quantity - maker.filled,
        });
      }
      // اگر partial، در book باقی میماند — هیچ reinsert لازم نیست
    }
  }

  private matchSell(
    taker: EngineOrder,
    book: OrderBook,
    result: MatchResult,
  ): void {
    while (taker.filled < taker.quantity) {
      const maker = book.peekBestBid();
      if (!maker) break;

      // price check: market همیشه، limit فقط اگر bid >= sell price
      if (taker.type === "limit" && maker.price < taker.price) break;

      const tradeQty = minBigInt(
        taker.quantity - taker.filled,
        maker.quantity - maker.filled,
      );

      // maker is bid (buyer), taker is seller
      this.recordTrade(maker, taker, tradeQty, maker.price, result);

      if (maker.filled === maker.quantity) {
        const delta = book.removeFrontBid();
        if (delta) result.deltas.push(delta);
      } else {
        result.deltas.push({
          side: "bid",
          price: maker.price,
          quantity: maker.quantity - maker.filled,
        });
      }
    }
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
