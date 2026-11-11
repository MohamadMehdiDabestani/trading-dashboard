import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:onliQj4AzxWGq5O7AeTx@pgapi-orx-service:5432/pgapihxa_db",
  },
});
