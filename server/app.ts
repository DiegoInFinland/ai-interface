import { Hono } from "hono";
import { fileURLToPath } from "node:url";
import { ApiError } from "@google/genai";
import { serveStatic } from "@hono/node-server/serve-static";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { stream } from "hono/streaming";
import * as z from "zod";
import { sendMessage, streamMessage } from "./services/ai.js";

const chatSchema = z
  .object({
    prompt: z.string().trim().min(1),
    provider: z.enum(["Gemini", "ChatGPT", "Claude"]),
    stream: z.boolean().optional(),
    googleSearch: z.boolean().optional(),
  })
  .refine((body) => !body.googleSearch || body.provider === "Gemini", {
    message: "Google Search grounding is only supported by Gemini.",
    path: ["googleSearch"],
  });

const validateChat = zValidator("json", chatSchema, (result, c) => {
  if (!result.success) {
    return c.json(
      {
        error:
          "Provide a non-empty prompt, a supported provider, and boolean chat options. Google Search is only supported by Gemini.",
      },
      400,
    );
  }
});

function geminiError(error: unknown, googleSearch = false): string {
  if (
    googleSearch &&
    error instanceof ApiError &&
    (error.status === 400 || error.status === 403)
  ) {
    return "Google Search grounding is unavailable for this request. Check your Gemini key's access and billing, or turn off Google Search.";
  }
  return error instanceof ApiError && error.status === 429
    ? "Gemini quota or rate limit reached. Please try again later."
    : "Gemini could not generate a reply. Please try again.";
}

const app = new Hono();

app.onError((error, c) => {
  if (error instanceof HTTPException && error.status === 400) {
    return c.json({ error: "Request body must be valid JSON." }, 400);
  }
  return c.json(
    { error: "The chat API could not process the request. Please try again." },
    500,
  );
});

app.get("/api/health", (c) => {
  return c.text("ok");
});

app.post("/api/chat", validateChat, async (c) => {
  const body = c.req.valid("json");

  if (body.provider === "Gemini") {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      return c.json(
        {
          error: "Gemini is not configured. Set GEMINI_API_KEY on the server.",
        },
        503,
      );
    }

    if (body.stream === true) {
      const prompt = body.prompt;
      c.header("Content-Type", "application/x-ndjson; charset=utf-8");
      c.header("Cache-Control", "no-cache, no-transform");
      c.header("X-Accel-Buffering", "no");
      return stream(c, async (output) => {
        const controller = new AbortController();
        output.onAbort(() => controller.abort());
        const abort = () => controller.abort();
        c.req.raw.signal.addEventListener("abort", abort, { once: true });
        if (c.req.raw.signal.aborted) controller.abort();
        try {
          for await (const event of streamMessage(
            prompt,
            controller.signal,
            body.googleSearch,
          )) {
            if (controller.signal.aborted) return;
            await output.writeln(JSON.stringify(event));
          }
          if (!controller.signal.aborted) {
            await output.writeln(JSON.stringify({ type: "done" }));
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            await output.writeln(
              JSON.stringify({
                type: "error",
                error: geminiError(error, body.googleSearch),
              }),
            );
          }
        } finally {
          controller.abort();
          c.req.raw.signal.removeEventListener("abort", abort);
        }
      });
    }

    try {
      return c.json(await sendMessage(body.prompt, body.googleSearch));
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        return c.json(
          {
            error:
              "Gemini quota or rate limit reached. Please try again later.",
          },
          429,
        );
      }
      // Keep provider diagnostics and credentials out of browser responses.
      return c.json({ error: geminiError(error, body.googleSearch) }, 502);
    }
  }

  return c.json({
    text: `Please, add an API key to start using the service.`,
  });
});

if (process.env.NODE_ENV === "production") {
  const root = fileURLToPath(new URL("../dist/", import.meta.url));
  app.all("/api", (c) => c.json({ error: "API route not found." }, 404));
  app.all("/api/*", (c) => c.json({ error: "API route not found." }, 404));
  app.get(
    "/assets/*",
    serveStatic({
      root,
      onFound: (_path, c) =>
        c.header("Cache-Control", "public, max-age=31536000, immutable"),
    }),
    (c) => c.notFound(),
  );
  app.get("*", serveStatic({ root }));
  app.get(
    "*",
    serveStatic({
      path: fileURLToPath(new URL("../dist/index.html", import.meta.url)),
    }),
  );
}

export default app;
