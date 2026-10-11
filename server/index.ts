/*
 * Node.js entrypoint, run by `pnpm dev:api` (tsx watch server/index.ts).
 * It starts the HTTP listener; app.ts defines what each route does.
 */
// Load .env values into process.env before the application modules run.
import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app";

// The Node adapter forwards incoming requests to Hono's fetch handler.
// Vite's /api proxy targets this port during frontend development.
serve({
  fetch: app.fetch,
  port: 3000,
});
