/**
 * Chat API utility functions for the application.
 */
export type GroundingData = {
  sources: {
    uri: string;
    title: string;
  }[];
  searchEntryPoint?: string;
};

type ChatResponse = {
  text: string;
  grounding?: GroundingData;
};

function parseGrounding(value: unknown): GroundingData {
  if (
    typeof value !== "object" ||
    value === null ||
    !("sources" in value) ||
    !Array.isArray(value.sources)
  ) {
    throw new Error("The chat API returned invalid grounding metadata.");
  }
  const sources = value.sources.map((source: unknown) => {
    if (
      typeof source !== "object" ||
      source === null ||
      !("uri" in source) ||
      typeof source.uri !== "string" ||
      !("title" in source) ||
      typeof source.title !== "string"
    ) {
      throw new Error("The chat API returned an invalid source.");
    }
    let url: URL;
    try {
      url = new URL(source.uri);
    } catch {
      throw new Error("The chat API returned an invalid source URL.");
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("The chat API returned an invalid source URL.");
    }
    return { uri: source.uri, title: source.title };
  });
  if (
    "searchEntryPoint" in value &&
    typeof value.searchEntryPoint !== "string"
  ) {
    throw new Error("The chat API returned invalid search suggestions.");
  }
  return {
    sources,
    ...("searchEntryPoint" in value &&
    typeof value.searchEntryPoint === "string"
      ? { searchEntryPoint: value.searchEntryPoint }
      : {}),
  };
}

function retrieveAnswer(response: ChatResponse): string {
  return response.text;
}

async function sendMessage(
  prompt: string,
  provider: string,
  signal?: AbortSignal,
  onChunk?: (text: string) => void,
  options?: {
    googleSearch?: boolean;
    onGrounding?: (grounding: GroundingData) => void;
  },
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      provider,
      stream: Boolean(onChunk),
      googleSearch: options?.googleSearch ?? false,
    }),
    signal,
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string" &&
      body.error.trim()
    ) {
      throw new Error(body.error);
    }
    throw new Error(
      `Chat request failed (${response.status}). Please try again.`,
    );
  }

  if (response.headers.get("Content-Type")?.includes("application/x-ndjson")) {
    if (!response.body)
      throw new Error("The chat API returned an empty stream.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let done = false;
    const consume = (line: string) => {
      if (!line.trim()) return;
      const event: unknown = JSON.parse(line);
      if (
        typeof event !== "object" ||
        event === null ||
        !("type" in event) ||
        done
      ) {
        throw new Error("The chat API returned an invalid stream.");
      }
      if (
        event.type === "error" &&
        "error" in event &&
        typeof event.error === "string"
      ) {
        throw new Error(event.error);
      }
      if (event.type === "done") {
        done = true;
      } else if (
        event.type === "delta" &&
        "text" in event &&
        typeof event.text === "string"
      ) {
        text += event.text;
        onChunk?.(event.text);
      } else if (event.type === "grounding" && "grounding" in event) {
        const grounding = parseGrounding(event.grounding);
        options?.onGrounding?.(grounding);
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
      if (!done || !text.trim())
        throw new Error(
          "The chat response ended before it was complete. Please try again.",
        );
      return text;
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }

  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("text" in body) ||
    typeof body.text !== "string" ||
    !body.text.trim()
  ) {
    throw new Error(
      "The chat API returned an invalid response. Please try again.",
    );
  }

  if ("grounding" in body) {
    const grounding = parseGrounding(body.grounding);
    options?.onGrounding?.(grounding);
  }
  return retrieveAnswer({ text: body.text });
}

export { sendMessage, retrieveAnswer, type ChatResponse };
