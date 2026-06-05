import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres("postgresql://postgres:admin@localhost:5432/trading", {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(client);
export type Db = typeof db;
