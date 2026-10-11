import { Hono } from "hono";
import { ApiError } from "@google/genai";
import { stream } from "hono/streaming";
import { sendMessage, streamMessage } from "./services/ai";

function geminiError(error: unknown): string {
  return error instanceof ApiError && error.status === 429
    ? "Gemini quota or rate limit reached. Please try again later."
    : "Gemini could not generate a reply. Please try again.";
}

const app = new Hono();

app.get("/api/health", (c) => {
  return c.text("ok");
});

app.post("/api/chat", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Request body must be valid JSON." }, 400);
  }

  if (
    typeof body !== "object" || body === null ||
    !("prompt" in body) || typeof body.prompt !== "string" || !body.prompt.trim() ||
    !("provider" in body) || typeof body.provider !== "string" ||
    !["ChatGPT", "Gemini", "Claude"].includes(body.provider)
  ) {
    return c.json({ error: "Provide a non-empty prompt and a supported provider." }, 400);
  }

  if (body.provider === "Gemini") {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      return c.json({ error: "Gemini is not configured. Set GEMINI_API_KEY on the server." }, 503);
    }

    if ("stream" in body && body.stream === true) {
      const prompt = body.prompt.trim();
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
          for await (const text of streamMessage(prompt, controller.signal)) {
            if (controller.signal.aborted) return;
            await output.writeln(JSON.stringify({ type: "delta", text }));
          }
          if (!controller.signal.aborted) {
            await output.writeln(JSON.stringify({ type: "done" }));
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            await output.writeln(JSON.stringify({ type: "error", error: geminiError(error) }));
          }
        } finally {
          controller.abort();
          c.req.raw.signal.removeEventListener("abort", abort);
        }
      });
    }

    try {
      return c.json(await sendMessage(body.prompt.trim()));
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        return c.json({ error: "Gemini quota or rate limit reached. Please try again later." }, 429);
      }
      // Keep provider diagnostics and credentials out of browser responses.
      return c.json({ error: "Gemini could not generate a reply. Please try again." }, 502);
    }
  }

  return c.json({
    text: `This is a dummy reply from the Hono API. You selected ${body.provider} and asked:\n\n${body.prompt.trim()}\n\nThe chat workflow is working. No AI provider was called.`,
  });
});

export default app;
