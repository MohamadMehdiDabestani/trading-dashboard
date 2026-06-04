import { randomUUID } from "crypto";
import { OrderBook } from "./orderbook";
import {
  EngineOrder,
  EngineTrade,
  FilledOrderUpdate,
  MatchResult,
  OrderStatus,
  SCALE,
} from "./types";

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
    const book = this.getBook(order.symbol);
    const result: MatchResult = { trades: [], updates: [] };

    if (order.side === "buy") {
      this.matchBuy(order, book, result);
    } else {
      this.matchSell(order, book, result);
    }

    // اگر taker کاملاً fill نشد و limit است، به book اضافه شود
    if (order.type === "limit" && order.filled < order.quantity) {
      book.addOrder(order);
    }

    return result;
  }

  cancelOrder(symbol: string, orderId: string): boolean {
    const book = this.books.get(symbol);
    if (!book) return false;
    return book.removeOrder(orderId);
  }

  getSnapshot(symbol: string, depth = 20) {
    return this.getBook(symbol).getSnapshot(depth);
  }

  // ─── Match logic ──────────────────────────────────────────────────────────

  private matchBuy(taker: EngineOrder, book: OrderBook, result: MatchResult): void {
    while (taker.filled < taker.quantity) {
      const maker = book.peekBestAsk();
      if (!maker) break;

      // price check: market order همیشه match میکنه، limit فقط اگر ask <= buy price
      if (taker.type === "limit" && maker.price > taker.price) break;

      const tradeQty = minBigInt(
        taker.quantity - taker.filled,
        maker.quantity - maker.filled
      );

      // maker is ask (seller), taker is buyer
      this.recordTrade(taker, maker, tradeQty, maker.price, result);

      // اگر maker کاملاً fill شد، از book حذف شود
      if (maker.filled === maker.quantity) {
        book.removeFrontAsk();
      }
      // اگر partial، در book باقی میماند — هیچ reinsert لازم نیست
    }
  }

  private matchSell(taker: EngineOrder, book: OrderBook, result: MatchResult): void {
    while (taker.filled < taker.quantity) {
      const maker = book.peekBestBid();
      if (!maker) break;

      // price check: market همیشه، limit فقط اگر bid >= sell price
      if (taker.type === "limit" && maker.price < taker.price) break;

      const tradeQty = minBigInt(
        taker.quantity - taker.filled,
        maker.quantity - maker.filled
      );

      // maker is bid (buyer), taker is seller
      this.recordTrade(maker, taker, tradeQty, maker.price, result);

      if (maker.filled === maker.quantity) {
        book.removeFrontBid();
      }
    }
  }

  // ─── Trade factory ────────────────────────────────────────────────────────
  // همیشه buyer و seller صریحاً مشخص است — وابستگی به ترتیب پارامتر نداریم

  private recordTrade(
    buyer: EngineOrder,
    seller: EngineOrder,
    quantity: bigint,
    price: bigint,
    result: MatchResult
  ): void {
    buyer.filled += quantity;
    seller.filled += quantity;

    const trade: EngineTrade = {
      id: randomUUID(),
      symbol: buyer.symbol,
      makerOrderId: seller.id,   // در این context seller = maker (ask side)
      takerOrderId: buyer.id,
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

    // update برای هر دو طرف
    result.updates.push(makeUpdate(buyer));
    result.updates.push(makeUpdate(seller));
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
