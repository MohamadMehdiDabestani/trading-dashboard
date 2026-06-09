// ws.gateway.ts

import { WebSocketServer, WebSocket } from "ws";
import { MarketEventBus } from "./evrntBus";
import { MarketEvent } from "@repo/types";

type Client = WebSocket & {
  subscriptions?: Set<string>;
};

export class WsGateway {
  private wss: WebSocketServer;
  private rooms: Map<string, Set<Client>> = new Map();

  constructor(
    port: number,
    private eventBus: MarketEventBus
  ) {
    this.wss = new WebSocketServer({ port });
    this.bootstrap();
  }

  private bootstrap() {
    this.wss.on("connection", (ws: Client) => {
      ws.subscriptions = new Set();

      ws.on("message", (msg) => {
        try {
          const parsed = JSON.parse(msg.toString());
          this.handleMessage(ws, parsed);
        } catch {
          ws.send(JSON.stringify({ error: "Invalid message" }));
        }
      });

      ws.on("close", () => {
        this.cleanup(ws);
      });
    });
  }

  private handleMessage(ws: Client, msg: any) {
    const { type, symbol } = msg;

    if (type === "subscribe" && symbol) {
      this.subscribe(ws, symbol);
    }

    if (type === "unsubscribe" && symbol) {
      this.unsubscribe(ws, symbol);
    }
  }

  private subscribe(ws: Client, symbol: string) {
    const room = `market:${symbol}`;

    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());

      // attach emitter listener once per room
      this.eventBus.subscribe(symbol, (event: MarketEvent) => {
        this.broadcast(room, event);
      });
    }

    this.rooms.get(room)!.add(ws);
    ws.subscriptions!.add(room);

    ws.send(JSON.stringify({
      type: "subscribed",
      symbol
    }));
  }

  private unsubscribe(ws: Client, symbol: string) {
    const room = `market:${symbol}`;
    this.rooms.get(room)?.delete(ws);
    ws.subscriptions?.delete(room);
  }

  private broadcast(room: string, event: MarketEvent) {
    const clients = this.rooms.get(room);
    if (!clients) return;

    const payload = JSON.stringify(event);

    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  private cleanup(ws: Client) {
    if (!ws.subscriptions) return;

    for (const room of ws.subscriptions) {
      this.rooms.get(room)?.delete(ws);
    }
  }
}
