import fp from "fastify-plugin";
import { BinancePriceFeed } from "../marketMaker/binancePriceFeed";
import { SYMBOLS } from "@repo/types";

const EMIT_MIN_MS = 500;

export default fp(async (fastify) => {
  const symbolMap: Record<string, string> = {};
  for (const s of SYMBOLS) symbolMap[s.value.toLowerCase()] = s.value;

  const feed = new BinancePriceFeed(symbolMap);
  const lastEmit = new Map<string, { at: number; price: string }>();

  feed.subscribe((tick) => {
    const now = Date.now();
    const prev = lastEmit.get(tick.symbol);
    if (prev && now - prev.at < EMIT_MIN_MS) return;

    const price = feed.get(tick.symbol)!;
    if (prev?.price === price) return;
    lastEmit.set(tick.symbol, { at: now, price });

    // نوع "ticker" را به MarketEvent در @repo/types اضافه کن
    fastify.eventBus.emit({
      type: "ticker",
      data: { symbol: tick.symbol, price, ts: now },
    } as any);
  });

  feed.start();
  fastify.decorate("priceFeed", feed);

  fastify.addHook("onClose", async () => feed.stop());
});