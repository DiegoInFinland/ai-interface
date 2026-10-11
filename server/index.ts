// Load .env values into process.env before the application modules run.
import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app.js";

const server = serve({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port: 3000,
});

const shutdown = () => {
  server.close((error) => process.exit(error ? 1 : 0));
  setTimeout(() => process.exit(1), 30_000).unref();
};

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
