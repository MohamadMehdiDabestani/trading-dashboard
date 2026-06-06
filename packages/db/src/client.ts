import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

export function createDb(url: string) {
  const client = postgres(url, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
  });

  return drizzle(client);
}
export type Db = ReturnType<typeof createDb>;

