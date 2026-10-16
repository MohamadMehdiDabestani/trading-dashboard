import fp from "fastify-plugin";
import websocket from "@fastify/websocket";
import { WebSocket } from "ws";

// فقط این نمادها قابل subscribe هستند (از env یا کانفیگ هم می‌توانی بخوانی)
const ALLOWED_SYMBOLS = new Set(["BTCUSDT", "ETHUSDT" , "ADAUSDT" , "BNBUSDT" , "XRPUSDT" , "SOLUSDT"]);
const HEARTBEAT_MS = 30_000;
const MAX_BUFFERED_BYTES = 1_000_000;

interface Room {
  clients: Set<WebSocket>;
  unsubscribe: () => void;
}

const stringify = (v: unknown) =>
  JSON.stringify(v, (_k, val) =>
    typeof val === "bigint" ? val.toString() : val,
  );

export default fp(async (fastify) => {
  await fastify.register(websocket);

  const rooms = new Map<string, Room>(); // key = symbol
  const socketRooms = new WeakMap<WebSocket, Set<string>>(); // هر سوکت در کدام roomها است
  const alive = new WeakMap<WebSocket, boolean>();

  function joinRoom(socket: WebSocket, symbol: string) {
    let room = rooms.get(symbol);

    if (!room) {
      const clients = new Set<WebSocket>();

      const handler = (event: unknown) => {
        if (clients.size === 0) return;

        const payload = stringify(event);
        for (const client of clients) {
          if (
            client.readyState === WebSocket.OPEN &&
            client.bufferedAmount < MAX_BUFFERED_BYTES
          ) {
            client.send(payload);
          }
        }
      };

      fastify.eventBus.subscribe(symbol, handler);

      const unsubscribe = () => {
        // اسم واقعی متد eventBus را بگذار:
        // off / unsubscribe / removeListener
        fastify.eventBus.unsubscribe(symbol, handler);
      };

      room = { clients, unsubscribe };
      rooms.set(symbol, room);
    }

    room.clients.add(socket);
    socketRooms.get(socket)!.add(symbol);

    socket.send(
      stringify({
        type: "snapshot",
        ...fastify.engine.getSnapshot(symbol, 20),
      }),
    );
  }

  function leaveRoom(socket: WebSocket, symbol: string) {
    const room = rooms.get(symbol);
    if (!room) return;

    room.clients.delete(socket);
    socketRooms.get(socket)?.delete(symbol);

    if (room.clients.size === 0) {
      room.unsubscribe(); // لغو واقعی subscription روی bus
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
          if (!ALLOWED_SYMBOLS.has(symbol)) {
            socket.send(
              stringify({ type: "error", message: "UNKNOWN_SYMBOL" }),
            );
            return;
          }
          if (socketRooms.get(socket)!.has(symbol)) return; // قبلاً subscribe شده
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

  // heartbeat: کلاینت‌های مرده را پاک کن
  const heartbeat = setInterval(() => {
    for (const client of fastify.websocketServer.clients) {
      if (alive.get(client) === false) {
        client.terminate(); // close emit می‌شود و cleanup اجرا می‌شود
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
