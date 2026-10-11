// Load .env values into process.env before the application modules run.
import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app";

serve({
  fetch: app.fetch,
  port: 3000,
});
