import { MarketEvent } from "@repo/types";

export interface MarketEventPublisher {
  publish(event: MarketEvent): void;
}