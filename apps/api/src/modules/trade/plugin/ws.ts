// ws plugin
import fp from "fastify-plugin";
import websocket from "@fastify/websocket";
import { WebSocket } from "ws";

export default fp(async (fastify) => {
  await fastify.register(websocket);

  // ذخیره اتاق‌ها و تابع Unsubscribe مربوط به هر اتاق برای جلوگیری از نشت حافظه
  const rooms = new Map<string, Set<WebSocket>>();
  const busSubscriptions = new Map<string, () => void>(); // نگهدارنده تابع لغو اشتراک ایونت‌باس
  fastify.get("/ws", { websocket: true }, (socket, req) => {
    // const socket = socket; // در این بخش socket دیگر هرگز undefined نخواهد بود

    console.log("🔌 [WS_GATEWAY] New client connected");

    socket.on("message", (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "subscribe") {
          const symbol = data.symbol.toUpperCase();
          const room = `market:${symbol}`;

          console.log("🔹 [WS_GATEWAY] Client subscribing to room:", room);

          // ایجاد اتاق در صورت عدم وجود
          if (!rooms.has(room)) {
            rooms.set(room, new Set());

            // اشتراک در ایونت‌باس (فقط یک‌بار برای هر نماد)
            // فرض بر اینکه متد subscribe یک تابع برای unsubscribe برمی‌گرداند
            const unsubscribe = fastify.eventBus.subscribe(symbol, (event) => {
              console.log(
                "📡 [WS_GATEWAY] Event received from Bus:",
                event,
                symbol,
              );

              const clients = rooms.get(room);
              if (!clients || clients.size === 0) return;
              // console.log(clients)
              const payload = JSON.stringify(event, (_key, value) =>
                typeof value === "bigint" ? value.toString() : value,
              );
              console.log(payload);
              for (const client of clients) {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(payload);
                }
              }
            });

            // ذخیره تابع لغو اشتراک
            // busSubscriptions.set(room, unsubscribe);
          }

          // اضافه کردن سوکت کلاینت به اتاق
          rooms.get(room)!.add(socket);
        }
      } catch (err) {
        console.error("❌ [WS_GATEWAY] Error parsing message:", err);
      }
    });

    // مدیریت دیسکانکت شدن کلاینت و پاکسازی حافظه
    socket.on("close", () => {
      console.log("🔌 [WS_GATEWAY] Client disconnected");

      for (const [room, clients] of rooms.entries()) {
        if (clients.has(socket)) {
          clients.delete(socket);

          // اگر اتاق کاملاً خالی شد، اشتراک ایونت‌باس را لغو کن تا سرور کرش نکند یا کند نشود
          if (clients.size === 0) {
            rooms.delete(room);
            const unsubscribe = busSubscriptions.get(room);
            if (unsubscribe) {
              unsubscribe(); // لغو اشتراک واقعی از ایونت‌باس
              busSubscriptions.delete(room);
            }
            console.log(
              `🧹 [WS_GATEWAY] Room ${room} is empty. Cleaned up resources.`,
            );
          }
        }
      }
    });
  });

  fastify.decorate("rooms", rooms);
});
