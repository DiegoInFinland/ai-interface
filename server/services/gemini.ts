/**
 * AI service functions for interacting with the Gemini API.
 */

import { GoogleGenAI, type GroundingMetadata } from "@google/genai";

type GroundingData = {
  sources: { uri: string; title: string }[];
  searchEntryPoint?: string;
};

type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "grounding"; grounding: GroundingData };

function extractGrounding(
  metadata?: GroundingMetadata,
): GroundingData | undefined {
  if (!metadata) return;
  const sources = new Map<string, { uri: string; title: string }>();
  for (const chunk of metadata.groundingChunks ?? []) {
    if (!chunk.web?.uri) continue;
    try {
      const url = new URL(chunk.web.uri);
      if (url.protocol !== "https:" && url.protocol !== "http:") continue;
      sources.set(chunk.web.uri, {
        uri: chunk.web.uri,
        title: chunk.web.title?.trim() || url.hostname,
      });
    } catch {
      continue;
    }
  }
  const searchEntryPoint = metadata.searchEntryPoint?.renderedContent;
  if (!sources.size && !searchEntryPoint) return;
  return {
    sources: [...sources.values()],
    ...(searchEntryPoint ? { searchEntryPoint } : {}),
  };
}

function createClient() {
  // Initialize on demand so a missing key does not prevent the API from starting.
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: 30_000 },
  });
}

async function sendMessage(
  prompt: string,
  googleSearch = false,
): Promise<{ text: string; grounding?: GroundingData }> {
  const ai = createClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: googleSearch ? { tools: [{ googleSearch: {} }] } : undefined,
  });

  const text = response.text;
  if (!text?.trim()) {
    throw new Error("Gemini returned no text response.");
  }
  const grounding = extractGrounding(
    response.candidates?.[0]?.groundingMetadata,
  );
  return { text, ...(grounding ? { grounding } : {}) };
}

export { sendMessage };

async function* streamMessage(
  prompt: string,
  signal: AbortSignal,
  googleSearch = false,
): AsyncGenerator<ChatStreamEvent> {
  const ai = createClient();
  const response = await ai.models.generateContentStream({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      abortSignal: signal,
      ...(googleSearch ? { tools: [{ googleSearch: {} }] } : {}),
    },
  });
  let hasText = false;
  const sources = new Map<string, { uri: string; title: string }>();
  let searchEntryPoint: string | undefined;
  for await (const chunk of response) {
    if (signal.aborted) return;
    const text = chunk.text;
    if (text) {
      if (text.trim()) hasText = true;
      yield { type: "delta", text };
    }
    const grounding = extractGrounding(
      chunk.candidates?.[0]?.groundingMetadata,
    );
    if (grounding) {
      for (const source of grounding.sources) sources.set(source.uri, source);
      searchEntryPoint = grounding.searchEntryPoint ?? searchEntryPoint;
    }
  }
  if (!hasText && !signal.aborted) {
    throw new Error("Gemini returned no text response.");
  }
  if (!signal.aborted && (sources.size || searchEntryPoint)) {
    yield {
      type: "grounding",
      grounding: {
        sources: [...sources.values()],
        ...(searchEntryPoint ? { searchEntryPoint } : {}),
      },
    };
  }
}

export { streamMessage };
