import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MatchingEngine } from "./matchingEngine";
import { EngineOrder, SCALE } from "@repo/types";
import { parseToScaledBigInt } from "../utils/scaleBigInt";

const SYMBOL = "BTC_USDT";

function createOrder(params: {
  id: string;
  userId?: string;
  symbol?: string;
  side: "buy" | "sell";
  type?: "limit" | "market";
  price?: number | string;
  qty: number | string;
  filled?: number | string;
  timestamp?: number;
}): EngineOrder {
  return {
    id: params.id,
    userId: params.userId ?? "user-1",
    symbol: params.symbol ?? SYMBOL,
    side: params.side,
    type: params.type ?? "limit",
    price: params.price !== undefined ? parseToScaledBigInt(String(params.price)) : 0n,
    quantity: parseToScaledBigInt(String(params.qty)),
    filled: params.filled !== undefined ? parseToScaledBigInt(String(params.filled)) : 0n,
    timestamp: params.timestamp ?? Date.now(),
  };
}

describe("MatchingEngine - Official Test Suite", () => {
  let engine: MatchingEngine;

  beforeEach(() => {
    engine = new MatchingEngine();
  });

  // ─── 1. Input Validation & Guards ──────────────────────────────────────────
  describe("1. Input Validation & Guards", () => {
    it("should reject orders with zero or negative quantity", () => {
      const zeroQtyOrder = createOrder({ id: "o-1", side: "buy", price: 60000, qty: 0 });
      assert.throws(() => engine.submitOrder(zeroQtyOrder), /Invalid quantity/);
    });

    it("should reject limit orders with zero price", () => {
      const zeroPriceLimit = createOrder({
        id: "o-1",
        side: "buy",
        type: "limit",
        price: 0,
        qty: 1,
      });
      assert.throws(() => engine.submitOrder(zeroPriceLimit), /Invalid price/);
    });

    it("should reject new orders that already have non-zero filled amount", () => {
      const preFilledOrder = createOrder({
        id: "o-1",
        side: "buy",
        price: 60000,
        qty: 2,
        filled: 1,
      });
      assert.throws(
        () => engine.submitOrder(preFilledOrder),
        /Order\.filled must be zero on creation/
      );
    });

    it("should accept market orders with price = 0", () => {
      const marketOrder = createOrder({
        id: "o-1",
        side: "buy",
        type: "market",
        price: 0,
        qty: 1,
      });
      const res = engine.submitOrder(marketOrder);
      assert.equal(res.trades.length, 0);
      assert.equal(res.updates[0]?.status, "cancelled");
    });
  });

  // ─── 2. Price-Time Priority (FIFO) ─────────────────────────────────────────
  describe("2. Price-Time Priority (FIFO)", () => {
    it("should match best price first (Price Priority)", () => {
      // سه سفارش فروش در قیمت‌های مختلف
      engine.submitOrder(createOrder({ id: "ask-60200", userId: "s1", side: "sell", price: 60200, qty: 1 }));
      engine.submitOrder(createOrder({ id: "ask-60000", userId: "s2", side: "sell", price: 60000, qty: 1 }));
      engine.submitOrder(createOrder({ id: "ask-60100", userId: "s3", side: "sell", price: 60100, qty: 1 }));

      // خریدار با قیمت 60200 وارد می‌شود؛ باید اول با ارزان‌ترین فروشنده (60000) مچ شود
      const res = engine.submitOrder(
        createOrder({ id: "buy-taker", userId: "b1", side: "buy", price: 60200, qty: 1 })
      );

      assert.equal(res.trades.length, 1);
      assert.equal(res.trades[0]?.makerOrderId, "ask-60000");
      assert.equal(res.trades[0]?.price, parseToScaledBigInt("60000"));
    });

    it("should match highest bid first for incoming sell order", () => {
      engine.submitOrder(createOrder({ id: "bid-59800", userId: "b1", side: "buy", price: 59800, qty: 1 }));
      engine.submitOrder(createOrder({ id: "bid-60000", userId: "b2", side: "buy", price: 60000, qty: 1 }));
      engine.submitOrder(createOrder({ id: "bid-59900", userId: "b3", side: "buy", price: 59900, qty: 1 }));

      const res = engine.submitOrder(
        createOrder({ id: "sell-taker", userId: "s1", side: "sell", price: 59800, qty: 1 })
      );

      assert.equal(res.trades.length, 1);
      assert.equal(res.trades[0]?.makerOrderId, "bid-60000");
      assert.equal(res.trades[0]?.price, parseToScaledBigInt("60000"));
    });

    it("should respect FIFO order within the exact same price level (Time Priority)", () => {
      engine.submitOrder(createOrder({ id: "first", userId: "s1", side: "sell", price: 60000, qty: 1, timestamp: 1000 }));
      engine.submitOrder(createOrder({ id: "second", userId: "s2", side: "sell", price: 60000, qty: 1, timestamp: 2000 }));
      engine.submitOrder(createOrder({ id: "third", userId: "s3", side: "sell", price: 60000, qty: 1, timestamp: 3000 }));

      const res = engine.submitOrder(
        createOrder({ id: "taker", userId: "b1", side: "buy", price: 60000, qty: 2 })
      );

      assert.equal(res.trades.length, 2);
      assert.equal(res.trades[0]?.makerOrderId, "first");
      assert.equal(res.trades[1]?.makerOrderId, "second");
      assert.notEqual(engine.getOrder(SYMBOL, "third"), null);
    });
  });

  // ─── 3. Partial Fills & Multi-Level Sweeping ───────────────────────────────
  describe("3. Partial Fills & Multi-Level Sweeping", () => {
    it("should partially fill maker order and keep remaining in book", () => {
      engine.submitOrder(createOrder({ id: "maker", userId: "s1", side: "sell", price: 60000, qty: 2.5 }));

      const res = engine.submitOrder(
        createOrder({ id: "taker", userId: "b1", side: "buy", price: 60000, qty: 1.0 })
      );

      assert.equal(res.trades.length, 1);
      assert.equal(res.trades[0]?.quantity, parseToScaledBigInt("1.0"));

      const makerInBook = engine.getOrder(SYMBOL, "maker");
      assert.ok(makerInBook);
      assert.equal(makerInBook.filled, parseToScaledBigInt("1.0"));

      const makerUpdate = res.updates.find((u) => u.orderId === "maker");
      const takerUpdate = res.updates.find((u) => u.orderId === "taker");
      assert.equal(makerUpdate?.status, "partial");
      assert.equal(takerUpdate?.status, "filled");
    });

    it("should sweep multiple price levels and place remaining limit order in book", () => {
      engine.submitOrder(createOrder({ id: "ask-1", userId: "s1", side: "sell", price: 60000, qty: 1 }));
      engine.submitOrder(createOrder({ id: "ask-2", userId: "s2", side: "sell", price: 60100, qty: 1.5 }));

      // سفارش خرید 3 واحد تا سقف 60100: باید 2.5 واحد مچ شود و 0.5 واحد در بوک خرید بنشیند
      const res = engine.submitOrder(
        createOrder({ id: "buy-sweep", userId: "b1", side: "buy", price: 60100, qty: 3 })
      );

      assert.equal(res.trades.length, 2);
      assert.equal(res.updates.length, 3); // ask-1, ask-2, buy-sweep (deduped)

      const restingBuy = engine.getOrder(SYMBOL, "buy-sweep");
      assert.ok(restingBuy);
      assert.equal(restingBuy.filled, parseToScaledBigInt("2.5"));

      const snapshot = engine.getSnapshot(SYMBOL);
      assert.equal(snapshot.asks.length, 0);
      assert.equal(snapshot.bids.length, 1);
      assert.equal(snapshot.bids[0]?.price, "60100.00000000");
      assert.equal(snapshot.bids[0]?.quantity, "0.50000000");
    });
  });

  // ─── 4. Market Orders & Liquidity Exhaustion ───────────────────────────────
  describe("4. Market Orders & Liquidity Exhaustion", () => {
    it("should fill available liquidity and cancel remaining market order quantity", () => {
      engine.submitOrder(createOrder({ id: "ask-1", userId: "s1", side: "sell", price: 60000, qty: 0.4 }));

      const res = engine.submitOrder(
        createOrder({ id: "mkt-buy", userId: "b1", side: "buy", type: "market", qty: 1.0 })
      );

      assert.equal(res.trades.length, 1);
      assert.equal(res.trades[0]?.quantity, parseToScaledBigInt("0.4"));

      const mktUpdate = res.updates.find((u) => u.orderId === "mkt-buy");
      assert.equal(mktUpdate?.status, "cancelled");
      assert.equal(mktUpdate?.filled, parseToScaledBigInt("0.4"));

      // سفارش مارکت هرگز نباید وارد OrderBook شود
      assert.equal(engine.getOrder(SYMBOL, "mkt-buy"), null);
    });
  });

  // ─── 5. Order Cancellation & Book Deltas ───────────────────────────────────
  describe("5. Order Cancellation & Book Deltas", () => {
    it("should accurately update level quantity when cancelling a partially filled order", () => {
      engine.submitOrder(createOrder({ id: "maker-1", userId: "s1", side: "sell", price: 60000, qty: 2 }));
      engine.submitOrder(createOrder({ id: "maker-2", userId: "s2", side: "sell", price: 60000, qty: 1 }));

      // 0.5 واحد از maker-1 پر می‌شود (باقی‌مانده کل سطح: 1.5 + 1 = 2.5)
      engine.submitOrder(createOrder({ id: "taker", userId: "b1", side: "buy", price: 60000, qty: 0.5 }));

      // کنسل کردن maker-1 (که 1.5 واحد باقی‌مانده دارد)
      const cancelRes = engine.cancelOrder(SYMBOL, "maker-1");
      assert.ok(cancelRes);
      assert.equal(cancelRes.updates[0]?.status, "cancelled");
      assert.equal(cancelRes.deltas[0]?.quantity, parseToScaledBigInt("1"));

      assert.equal(engine.getOrder(SYMBOL, "maker-1"), null);
      assert.equal(engine.getActiveOrdersByUser(SYMBOL, "s1").length, 0);
    });

    it("should return null when cancelling an unknown orderId", () => {
      const res = engine.cancelOrder(SYMBOL, "non-existent");
      assert.equal(res, null);
    });
  });

  // ─── 6. Self-Trade (Wash Trade) Prevention ─────────────────────────────────
  describe("6. Self-Trade Prevention (All Prices & Pre-Check)", () => {
    it("should throw SELF_TRADE_BLOCKED when same user crosses own order at same price", () => {
      engine.submitOrder(createOrder({ id: "sell-own", userId: "trader-X", side: "sell", price: 60000, qty: 1 }));

      assert.throws(() => {
        engine.submitOrder(
          createOrder({ id: "buy-own", userId: "trader-X", side: "buy", price: 60000, qty: 1 })
        );
      }, /SELF_TRADE_BLOCKED/);
    });

    it("should throw SELF_TRADE_BLOCKED when same user crosses own order at a DIFFERENT price", () => {
      engine.submitOrder(createOrder({ id: "sell-60k", userId: "trader-X", side: "sell", price: 60000, qty: 1 }));

      assert.throws(() => {
        engine.submitOrder(
          createOrder({ id: "buy-61k", userId: "trader-X", side: "buy", price: 61000, qty: 1 })
        );
      }, /SELF_TRADE_BLOCKED/);
    });

    it("should throw SELF_TRADE_BLOCKED when same user submits a market order against own resting order", () => {
      engine.submitOrder(createOrder({ id: "bid-60k", userId: "trader-X", side: "buy", price: 60000, qty: 1 }));

      assert.throws(() => {
        engine.submitOrder(
          createOrder({ id: "mkt-sell", userId: "trader-X", side: "sell", type: "market", qty: 0.5 })
        );
      }, /SELF_TRADE_BLOCKED/);
    });

    it("should NOT mutate other users' orders in the book if a multi-level sweep hits a self-trade (Pre-check)", () => {
      // سفارش کاربر دیگر در بهترین قیمت (59,900)
      engine.submitOrder(createOrder({ id: "other-sell", userId: "trader-B", side: "sell", price: 59900, qty: 1 }));
      // سفارش خود کاربر در قیمت بالاتر (60,000)
      engine.submitOrder(createOrder({ id: "own-sell", userId: "trader-A", side: "sell", price: 60000, qty: 1 }));

      // کاربر A سفارش خرید 1.5 واحدی روی 60,000 می‌فرستد (1 واحد از B و 0.5 واحد از خودش!)
      assert.throws(() => {
        engine.submitOrder(
          createOrder({ id: "sweep-buy", userId: "trader-A", side: "buy", price: 60000, qty: 1.5 })
        );
      }, /SELF_TRADE_BLOCKED/);

      // سفارش کاربر B باید کاملاً دست‌نخورده در بوک باقی مانده باشد
      const otherOrder = engine.getOrder(SYMBOL, "other-sell");
      assert.ok(otherOrder, "Other user's order must still exist in the orderbook");
      assert.equal(otherOrder.filled, 0n, "Other user's order must not be partially filled");
    });

    it("should allow trade if taker order is completely filled by other users before reaching own order", () => {
      engine.submitOrder(createOrder({ id: "other-sell", userId: "trader-B", side: "sell", price: 59900, qty: 2 }));
      engine.submitOrder(createOrder({ id: "own-sell", userId: "trader-A", side: "sell", price: 60000, qty: 1 }));

      // سفارش خرید 1 واحدی کاربر A کاملاً با سفارش 59,900 کاربر B پر می‌شود و هرگز به 60,000 خودش نمی‌رسد
      const res = engine.submitOrder(
        createOrder({ id: "safe-buy", userId: "trader-A", side: "buy", price: 60000, qty: 1 })
      );

      assert.equal(res.trades.length, 1);
      assert.equal(res.trades[0]?.makerOrderId, "other-sell");
    });
  });

  // ─── 7. Precision & Quote Quantity Calculation ─────────────────────────────
  describe("7. BigInt Financial Precision", () => {
    it("should compute exact quoteQuantity = (price * quantity) / SCALE", () => {
      engine.submitOrder(
        createOrder({ id: "sell-1", userId: "s1", side: "sell", price: "65432.15", qty: "0.25" })
      );
      const res = engine.submitOrder(
        createOrder({ id: "buy-1", userId: "b1", side: "buy", price: "65432.15", qty: "0.25" })
      );

      assert.equal(res.trades.length, 1);
      // 65432.15 * 0.25 = 16358.0375
      assert.equal(res.trades[0]?.quoteQuantity, parseToScaledBigInt("16358.0375"));
    });
  });

  // ─── 8. Multi-Symbol Isolation & Bootstrap Recovery ────────────────────────
  describe("8. Multi-Symbol Isolation & State Recovery", () => {
    it("should isolate orderbooks between different symbols (BTC_USDT vs ETH_USDT)", () => {
      engine.submitOrder(
        createOrder({ id: "btc-sell", symbol: "BTC_USDT", userId: "s1", side: "sell", price: 3000, qty: 1 })
      );
      const ethRes = engine.submitOrder(
        createOrder({ id: "eth-buy", symbol: "ETH_USDT", userId: "b1", side: "buy", price: 3000, qty: 1 })
      );

      assert.equal(ethRes.trades.length, 0);
      assert.notEqual(engine.getOrder("BTC_USDT", "btc-sell"), null);
      assert.notEqual(engine.getOrder("ETH_USDT", "eth-buy"), null);
    });

    it("should bootstrap only active limit orders and ignore filled or market orders", () => {
      engine.bootstrapActiveOrders([
        createOrder({ id: "active-limit", side: "buy", type: "limit", price: 60000, qty: 2, filled: 0.5 }),
        createOrder({ id: "fully-filled", side: "buy", type: "limit", price: 60000, qty: 1, filled: 1 }),
        createOrder({ id: "market-order", side: "buy", type: "market", price: 0, qty: 1, filled: 0 }),
      ]);

      assert.notEqual(engine.getOrder(SYMBOL, "active-limit"), null);
      assert.equal(engine.getOrder(SYMBOL, "fully-filled"), null);
      assert.equal(engine.getOrder(SYMBOL, "market-order"), null);

      const snap = engine.getSnapshot(SYMBOL);
      assert.equal(snap.bids[0]?.quantity, "1.50000000");
    });
  });

  // ─── 9. Fuzz & Invariant Testing (Property-Based Check) ────────────────────
  describe("9. Fuzz Testing & Financial Invariants (1,000 Random Operations)", () => {
    it("should maintain uncrossed book and volume conservation across 1,000 random ops", () => {
      const activeIds: string[] = [];
      let totalSubmittedVolume = 0n;
      let totalTradedVolume = 0n;
      let totalCancelledUnfilledVolume = 0n;

      // Seeded PRNG (LCG) برای تکرارپذیری صددرصد تست
      let seed = 42;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      for (let i = 0; i < 1000; i++) {
        const action = rand();

        // 20% احتمال کنسل کردن یک سفارش فعال
        if (action < 0.2 && activeIds.length > 0) {
          const idx = Math.floor(rand() * activeIds.length);
          const idToCancel = activeIds[idx]!;
          activeIds.splice(idx, 1);

          const orderBefore = engine.getOrder(SYMBOL, idToCancel);
          if (orderBefore) {
            const unfilled = orderBefore.quantity - orderBefore.filled;
            const cancelRes = engine.cancelOrder(SYMBOL, idToCancel);
            if (cancelRes) {
              totalCancelledUnfilledVolume += unfilled;
            }
          }
          continue;
        }

        const side: "buy" | "sell" = rand() < 0.5 ? "buy" : "sell";
        const isMarket = rand() < 0.15;
        const price = 59900 + Math.floor(rand() * 20) * 10; // قیمت بین 59900 تا 60090
        const qtyStr = (Math.floor(rand() * 50 + 1) / 10).toFixed(1); // حجم 0.1 تا 5.0
        const orderId = `fuzz-${i}`;
        const userId = `user-${i}`; // کاربران مجزا برای تست خالص موتور

        const order = createOrder({
          id: orderId,
          userId,
          side,
          type: isMarket ? "market" : "limit",
          price: isMarket ? 0 : price,
          qty: qtyStr,
        });

        totalSubmittedVolume += order.quantity;
        const res = engine.submitOrder(order);

        for (const t of res.trades) {
          // هر معامله یک طرف Maker و یک طرف Taker را به اندازه t.quantity پر می‌کند
          totalTradedVolume += t.quantity * 2n;
        }

        // اگر سفارش مارکت باقیمانده‌اش کنسل شده
        const selfUpdate = res.updates.find((u) => u.orderId === orderId);
        if (selfUpdate?.status === "cancelled") {
          totalCancelledUnfilledVolume += order.quantity - selfUpdate.filled;
        } else if (engine.getOrder(SYMBOL, orderId)) {
          activeIds.push(orderId);
        }

        // Invariant 1: Best Bid must ALWAYS be strictly less than Best Ask (No Crossed Book)
        const snap = engine.getSnapshot(SYMBOL, 1);
        if (snap.bids.length > 0 && snap.asks.length > 0) {
          const bestBid = Number(snap.bids[0]!.price);
          const bestAsk = Number(snap.asks[0]!.price);
          assert.ok(
            bestBid < bestAsk,
            `Crossed book detected at op ${i}: bestBid=${bestBid} >= bestAsk=${bestAsk}`
          );
        }
      }

      // Invariant 2: Conservation of Volume (حجم کل ورودی == حجم معامله شده + کنسل شده + باقی‌مانده در بوک)
      let restingVolume = 0n;
      for (const userOrder of engine.getSnapshot(SYMBOL, 1000).bids) {
        restingVolume += parseToScaledBigInt(userOrder.quantity);
      }
      for (const userOrder of engine.getSnapshot(SYMBOL, 1000).asks) {
        restingVolume += parseToScaledBigInt(userOrder.quantity);
      }

      assert.equal(
        totalSubmittedVolume,
        totalTradedVolume + totalCancelledUnfilledVolume + restingVolume,
        "Volume conservation invariant violated!"
      );
    });
  });

  // ─── 10. Sub-Millisecond Performance SLA Gate ──────────────────────────────
  describe("10. Sub-Millisecond Performance SLA Gate", () => {
    it("should process 10,000 orders with P99 latency under 200 µs (0.2 ms)", () => {
      const latenciesNs: bigint[] = [];

      // تزریق نقدینگی اولیه
      for (let i = 0; i < 1000; i++) {
        engine.submitOrder(
          createOrder({ id: `liq-${i}`, userId: `m-${i}`, side: "sell", price: 60000 + i, qty: 1 })
        );
      }

      for (let i = 0; i < 10000; i++) {
        const o = createOrder({
          id: `perf-${i}`,
          userId: `t-${i}`,
          side: i % 2 === 0 ? "buy" : "sell",
          price: i % 2 === 0 ? 60005 : 59995,
          qty: 0.1,
        });
        const t0 = process.hrtime.bigint();
        engine.submitOrder(o);
        const t1 = process.hrtime.bigint();
        latenciesNs.push(t1 - t0);
      }

      latenciesNs.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      const p99Us = Number(latenciesNs[Math.floor(latenciesNs.length * 0.99)]) / 1000;

      assert.ok(
        p99Us < 200,
        `P99 latency (${p99Us.toFixed(2)} µs) exceeded 200 µs SLA threshold`
      );
    });
  });
});
