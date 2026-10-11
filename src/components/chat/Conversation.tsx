// Displays the in-memory message list supplied by App.tsx; it makes no API calls.
import { Sparkles } from "lucide-react";
import { lazy, Suspense } from "react";

const MarkdownMessage = lazy(() => import("./MarkdownMessage"));

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
      className="grid gap-[36px]"
      aria-label="Conversation"
      aria-live="polite"
    >
      {messages.map((message) => (
        <article className="min-w-0" key={message.id}>
          {/* User messages appear as bubbles; assistant replies are left aligned. */}
          <div
            className={
              message.role === "user"
                ? "ml-auto w-fit max-w-[90%] rounded-[20px_20px_5px_20px] bg-accent-soft px-[20px] py-[14px] text-strong"
                : "text-strong"
            }
          >
            <span className={message.role === "user"
              ? "text-[11px] font-semibold text-foreground"
              : "flex items-center gap-[8px] text-[12px] font-semibold text-foreground"}>
              {message.role === "user" ? (
                "You"
              ) : (
                <>
                  <Sparkles className="text-accent" size={16} aria-hidden="true" />
                  {message.provider}
                  {message.provider !== "Gemini" && " · Demo"}
                </>
              )}
            </span>
            {message.role === "assistant" ? (
              <Suspense fallback={<p className="mt-[12px] text-[15px] leading-[1.7] whitespace-pre-wrap [overflow-wrap:anywhere]">{message.text}</p>}>
                <MarkdownMessage text={message.text} />
              </Suspense>
            ) : (
              <p className="mt-[4px] text-[15px] whitespace-pre-wrap [overflow-wrap:anywhere]">{message.text}</p>
            )}
          </div>
        </article>
      ))}
      {isSending && (
        <p className="text-[13px]" role="status">
          {messages.at(-1)?.role === "assistant" ? "Generating…" : "Thinking…"}
        </p>
      )}
    </section>
  );
}
