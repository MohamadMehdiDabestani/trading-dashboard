import fp from "fastify-plugin";
import websocket from "@fastify/websocket";
import { WebSocket } from "ws";
import { SYMBOLS } from "@repo/types";

const HEARTBEAT_MS = 30_000;
const MAX_BUFFERED_BYTES = 1_000_000;
// تغییرات دفتر سفارش‌ها حداکثر هر ۲۰۰ms یک‌بار به‌صورت snapshot کامل ارسال می‌شود
const SNAPSHOT_THROTTLE_MS = 200;

interface Room {
  clients: Set<WebSocket>;
  unsubscribe: () => void;
}

const stringify = (v: unknown) =>
  JSON.stringify(v, (_k, val) =>
    typeof val === "bigint" ? val.toString() : val,
  );

function broadcast(clients: Set<WebSocket>, payload: string) {
  for (const client of clients) {
    if (
      client.readyState === WebSocket.OPEN &&
      client.bufferedAmount < MAX_BUFFERED_BYTES
    ) {
      client.send(payload);
    }
  }
}

export default fp(async (fastify) => {
  await fastify.register(websocket);

  const rooms = new Map<string, Room>();
  const socketRooms = new WeakMap<WebSocket, Set<string>>();
  const alive = new WeakMap<WebSocket, boolean>();

  const snapshotPayload = (symbol: string) =>
    stringify({
      type: "snapshot",
      ...fastify.engine.getSnapshot(symbol, 20),
      lastPrice: fastify.priceFeed.get(symbol) ?? null,
    });

  function joinRoom(socket: WebSocket, symbol: string) {
    let room = rooms.get(symbol);

    if (!room) {
      const clients = new Set<WebSocket>();
      let timer: NodeJS.Timeout | null = null;

      const flush = () => {
        timer = null;
        if (clients.size === 0) return;
        broadcast(clients, snapshotPayload(symbol));
      };

      const handler = (event: any) => {
        if (clients.size === 0) return;

        // قیمت لحظه‌ای: مستقیم پخش می‌شود
        if (event?.type === "ticker") {
          broadcast(clients, stringify(event));
          return;
        }
        // هر event دیگری (سفارش جدید، لغو، match، ...) یعنی دفتر عوض شده → snapshot throttle شده
        if (!timer) timer = setTimeout(flush, SNAPSHOT_THROTTLE_MS);
      };

      fastify.eventBus.subscribe(symbol, handler);

      const unsubscribe = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        fastify.eventBus.unsubscribe(symbol, handler);
      };

      room = { clients, unsubscribe };
      rooms.set(symbol, room);
    }

    room.clients.add(socket);
    socketRooms.get(socket)!.add(symbol);

    socket.send(snapshotPayload(symbol));
  }

  function leaveRoom(socket: WebSocket, symbol: string) {
    const room = rooms.get(symbol);
    if (!room) return;

    room.clients.delete(socket);
    socketRooms.get(socket)?.delete(symbol);

    if (room.clients.size === 0) {
      room.unsubscribe();
      rooms.delete(symbol);
      fastify.log.debug(`[WS] room ${symbol} empty, cleaned up`);
    }
  }

  fastify.get("/ws", { websocket: true }, (socket) => {
    socketRooms.set(socket, new Set());
    alive.set(socket, true);

    socket.on("pong", () => alive.set(socket, true));

    socket.on("message", (raw: Buffer) => {
      try {
        const data = JSON.parse(raw.toString());
        const symbol =
          typeof data?.symbol === "string" ? data.symbol.toUpperCase() : "";

        if (data?.type === "subscribe") {
          if (!SYMBOLS.find((s) => s.value == symbol)) {
            socket.send(
              stringify({ type: "error", message: "UNKNOWN_SYMBOL" }),
            );
            return;
          }
          if (socketRooms.get(socket)!.has(symbol)) return;
          joinRoom(socket, symbol);
        } else if (data?.type === "unsubscribe") {
          leaveRoom(socket, symbol);
        }
      } catch (err) {
        fastify.log.warn({ err }, "[WS] bad message");
      }
    });

    const cleanup = () => {
      const symbols = socketRooms.get(socket);
      if (!symbols) return;
      for (const symbol of [...symbols]) leaveRoom(socket, symbol);
    };

    socket.on("close", cleanup);
    socket.on("error", (err) => {
      fastify.log.warn({ err }, "[WS] socket error");
      cleanup();
    });
  });

  const heartbeat = setInterval(() => {
    for (const client of fastify.websocketServer.clients) {
      if (alive.get(client) === false) {
        client.terminate();
        continue;
      }
      alive.set(client, false);
      client.ping();
    }
  }, HEARTBEAT_MS);

  fastify.addHook("onClose", async () => {
    clearInterval(heartbeat);
    for (const room of rooms.values()) room.unsubscribe();
    rooms.clear();
  });
});
