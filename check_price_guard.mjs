try {
  const { MatchingEngine } = await import("./apps/api/src/engine/index.ts");
  const e = new MatchingEngine();
  e.getBook("BTCUSDT").addOrder({ id: "s1", userId: "u2", symbol: "BTCUSDT", side: "sell", type: "limit", price: 75000n * 10n ** 18n, quantity: 1n, filled: 0n, timestamp: Date.now() });
  const t = { id: "b1", userId: "u1", symbol: "BTCUSDT", side: "buy", type: "limit", price: 70000n * 10n ** 18n, quantity: 1n, filled: 0n, timestamp: Date.now() };
  const r = e.submitOrder(t);
  console.log("buy@70000 vs sell@75000 trades:", r.trades.length, "(should be 0)");
  const r2 = e.submitOrder({ ...t, id: "b2", price: 80000n * 10n ** 18n });
  console.log("buy@80000 vs sell@75000 trades:", r2.trades.length, "(should be 1)");
  console.log("SELL@75000 vs BID@70000 trades:", r.trades.length === 0 ? "OK" : "FAIL");
  console.log("SELL@75000 vs BID@80000 trades:", r2.trades.length === 1 ? "OK" : "FAIL");
  process.exit(r.trades.length === 0 && r2.trades.length === 1 ? 0 : 1);
} catch (e) {
  console.error("ERR:", e.message);
  process.exit(1);
}
