import { MatchingEngine } from "./matchingEngine";
import { EngineOrder, SCALE } from "@repo/types";

const engine = new MatchingEngine();
const SYMBOL = "BTC_USDT";

function toScaled(val: number | string): bigint {
  const [intPart = "0", fracPart = ""] = val.toString().split(".");
  const paddedFrac = fracPart.padEnd(18, "0").slice(0, 18);
  return BigInt(intPart) * SCALE + BigInt(paddedFrac);
}

function createOrder(
  id: string,
  userId: string,
  side: "buy" | "sell",
  type: "limit" | "market",
  price: number | string,
  qty: number | string
): EngineOrder {
  return {
    id,
    userId,
    symbol: SYMBOL,
    side,
    type,
    price: toScaled(price),
    quantity: toScaled(qty),
    filled: 0n,
    timestamp: Date.now(),
  };
}

async function runBenchmark() {
  console.log("=== 1. Functional Test (FIFO & Partial Match) ===");
  // قرار دادن 2 سفارش فروش
  engine.submitOrder(createOrder("sell-1", "user-A", "sell", "limit", 60000, 1));
  engine.submitOrder(createOrder("sell-2", "user-B", "sell", "limit", 60000, 2));

  // ارسال سفارش خرید ۱.۵ واحدی
  const matchResult = engine.submitOrder(
    createOrder("buy-1", "user-C", "buy", "limit", 60000, 1.5)
  );

  console.log(`Trades generated: ${matchResult.trades.length}`);
  console.log(
    `Trade 1 Maker: ${matchResult.trades[0]?.makerOrderId} (Expected: sell-1)`
  );
  console.log(
    `Trade 2 Maker: ${matchResult.trades[1]?.makerOrderId} (Expected: sell-2)`
  );

  // پاک‌سازی بوک برای بنچمارک سرعت
  engine.replaceSymbolOrders(SYMBOL, []);

  console.log("\n=== 2. Latency & Throughput Benchmark ===");
  const TOTAL_ORDERS = 1_000_000;
  const latenciesNs: bigint[] = [];

  // گرم کردن (Warmup)
  for (let i = 0; i < 2_000; i++) {
    engine.submitOrder(createOrder(`warm-${i}`, `u-${i}`, "sell", "limit", 70000 + i, 1));
  }
  engine.replaceSymbolOrders(SYMBOL, []);

  // تزریق سفارشات عمق بازار (Liquidity Maker)
  for (let i = 0; i < 5_000; i++) {
    engine.submitOrder(createOrder(`ask-${i}`, `seller-${i}`, "sell", "limit", 60000 + i, 1));
  }

  // اندازه‌گیری دقیق تاخیر هر سفارش تیکر
  const startTime = process.hrtime.bigint();

  for (let i = 0; i < TOTAL_ORDERS; i++) {
    const order = createOrder(
      `taker-${i}`,
      `buyer-${i}`,
      i % 2 === 0 ? "buy" : "sell",
      "limit",
      i % 2 === 0 ? 60010 : 59990,
      0.1
    );

    const t0 = process.hrtime.bigint();
    engine.submitOrder(order);
    const t1 = process.hrtime.bigint();

    latenciesNs.push(t1 - t0);
  }

  const totalTimeNs = process.hrtime.bigint() - startTime;
  const totalTimeMs = Number(totalTimeNs) / 1_000_000;
  const opsSec = Math.floor((TOTAL_ORDERS / totalTimeMs) * 1000);

  // محاسبه پرسنتایل‌ها
  latenciesNs.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const p50 = Number(latenciesNs[Math.floor(latenciesNs.length * 0.5)]) / 1000;
  const p95 = Number(latenciesNs[Math.floor(latenciesNs.length * 0.95)]) / 1000;
  const p99 = Number(latenciesNs[Math.floor(latenciesNs.length * 0.99)]) / 1000;

  console.log(`Total Orders: ${TOTAL_ORDERS}`);
  console.log(`Execution Time: ${totalTimeMs.toFixed(2)} ms`);
  console.log(`Throughput: ${opsSec.toLocaleString()} orders/sec`);
  console.log(`Latency P50: ${p50.toFixed(2)} µs`);
  console.log(`Latency P95: ${p95.toFixed(2)} µs`);
  console.log(`Latency P99: ${p99.toFixed(2)} µs`);
}

runBenchmark();