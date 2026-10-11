import { GoogleGenAI } from "@google/genai";

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

async function sendMessage(prompt: string): Promise<{ text: string }> {
  const ai = createClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  });

  const text = response.text;
  if (!text?.trim()) {
    throw new Error("Gemini returned no text response.");
  }
  return { text };
}

export { sendMessage };

export async function* streamMessage(prompt: string, signal: AbortSignal) {
  const ai = createClient();
  const response = await ai.models.generateContentStream({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: { abortSignal: signal },
  });
  let hasText = false;
  for await (const chunk of response) {
    if (signal.aborted) return;
    const text = chunk.text;
    if (text) {
      if (text.trim()) hasText = true;
      yield text;
    }
  }
  if (!hasText && !signal.aborted) {
    throw new Error("Gemini returned no text response.");
  }
}
