import { MarketEvent } from "@repo/types";
import EventEmitter from "eventemitter3";

export class MarketEventBus {
  private emitter = new EventEmitter();

  emit(event: MarketEvent) {
    const channel = `market:${event.data.symbol}`;
    this.emitter.emit(channel, event);
  }

  subscribe(symbol: string, listener: (event: MarketEvent) => void) {
    const channel = `market:${symbol}`;
    this.emitter.on(channel, listener);
  }

  unsubscribe(symbol: string, listener: (event: MarketEvent) => void) {
    const channel = `market:${symbol}`;
    this.emitter.off(channel, listener);
  }
}