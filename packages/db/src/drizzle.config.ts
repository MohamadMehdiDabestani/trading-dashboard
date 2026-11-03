import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:kVuMaVooFVV3WGn4@services.irn13.chabokan.net:54791/angel",
  },
});
