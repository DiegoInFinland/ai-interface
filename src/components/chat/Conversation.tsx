// Displays the in-memory message list supplied by App.tsx; it makes no API calls.
import { Sparkles } from "lucide-react";

// UI message shape: role controls the label/layout, and id is React's list key.
// provider records the selection at send time, even if the picker changes later.
export type Message = {
  id: string;
  text: string;
  provider: string;
  role: "user" | "assistant";
};

type ConversationProps = {
  messages: Message[];
  isSending: boolean;
};

export function Conversation({ messages, isSending }: ConversationProps) {
  // aria-live announces new content without interrupting the screen reader.
  return (
    <section
      className="conversation"
      aria-label="Conversation"
      aria-live="polite"
    >
      {messages.map((message) => (
        <article className="conversation-turn" key={message.id}>
          {/* User messages appear as bubbles; assistant replies are left aligned. */}
          <div className={message.role === "user" ? "user-message" : "assistant-message"}>
            <span>
              {message.role === "user" ? "You" : (
                <><Sparkles size={16} aria-hidden="true" />{message.provider}{message.provider !== "Gemini" && " · Demo"}</>
              )}
            </span>
            {/* Render as plain text; App.css preserves newlines. No Markdown parser. */}
            <p>{message.text}</p>
          </div>
        </article>
      ))}
      {isSending && <p className="chat-pending" role="status">
        {messages.at(-1)?.role === "assistant" ? "Generating…" : "Thinking…"}
      </p>}
    </section>
  );
}
