/*
 * Browser-side HTTP client: App.tsx calls sendMessage(), which sends JSON to
 * Hono and returns the reply text. AI SDKs and API keys belong on the server.
 */

// This describes the expected response shape at compile time. The runtime
// checks below still matter because a server can return unexpected data.
type ChatResponse = {
  text: string;
};

// Small helper that extracts text from an already validated response.
function retrieveAnswer(response: ChatResponse): string {
  return response.text;
}

async function sendMessage(
  prompt: string,
  provider: string,
  signal?: AbortSignal,
  onChunk?: (text: string) => void,
): Promise<string> {
  // In development Vite proxies this relative URL to Hono on port 3000.
  // signal allows App.tsx to cancel the request when starting a new chat.
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, provider, stream: Boolean(onChunk) }),
    signal,
  });

  // fetch does not throw for HTTP 400/500 responses, so check their status.
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    if (
      typeof body === "object" && body !== null &&
      "error" in body && typeof body.error === "string" && body.error.trim()
    ) {
      throw new Error(body.error);
    }
    throw new Error(`Chat request failed (${response.status}). Please try again.`);
  }

  if (response.headers.get("Content-Type")?.includes("application/x-ndjson")) {
    if (!response.body) throw new Error("The chat API returned an empty stream.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let done = false;
    const consume = (line: string) => {
      if (!line.trim()) return;
      const event: unknown = JSON.parse(line);
      if (typeof event !== "object" || event === null || !("type" in event) || done) {
        throw new Error("The chat API returned an invalid stream.");
      }
      if (event.type === "error" && "error" in event && typeof event.error === "string") {
        throw new Error(event.error);
      }
      if (event.type === "done") {
        done = true;
      } else if (event.type === "delta" && "text" in event && typeof event.text === "string") {
        text += event.text;
        onChunk?.(event.text);
      } else {
        throw new Error("The chat API returned an invalid stream.");
      }
    };
    try {
      while (!done) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        let newline: number;
        while ((newline = buffer.indexOf("\n")) !== -1) {
          consume(buffer.slice(0, newline));
          buffer = buffer.slice(newline + 1);
        }
        if (chunk.done) {
          consume(buffer);
          break;
        }
      }
      if (!done || !text.trim()) throw new Error("The chat response ended before it was complete. Please try again.");
      return text;
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }

  // Treat external JSON as unknown, then check its shape before using it.
  const body: unknown = await response.json();
  if (
    typeof body !== "object" || body === null ||
    !("text" in body) || typeof body.text !== "string" || !body.text.trim()
  ) {
    throw new Error("The chat API returned an invalid response. Please try again.");
  }

  return retrieveAnswer({ text: body.text });
}

export { sendMessage, retrieveAnswer, type ChatResponse };
