/*
 * Chat page coordinator. Child components display the UI; this component owns
 * the shared state and handles sending, resetting, and selecting prompt ideas.
 * Flow: MessageComposer -> handleSubmit -> lib/chat-api.ts -> server/app.ts
 *       -> reply added to messages -> Conversation renders the updated list.
 */
import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import type { Message } from "@/components/chat/Conversation";
import ChatWindow from "@/components/chat/ChatWindow";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { PromptSuggestions } from "@/components/chat/PromptSuggestions";
import { sendMessage } from "@/lib/chat-api";
import { cn } from "@/lib/utils";

function App() {
  // State changes trigger a render. text is the draft, while messages is the
  // visible conversation, stored only in memory until the page is refreshed.
  const [text, setText] = useState("");
  const [provider, setProvider] = useState("ChatGPT");
  const [messages, setMessages] = useState<Message[]>([]);
  // These two states drive loading feedback and the error notice.
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Refs keep values between renders without triggering a render themselves.
  // inputRef points to the textarea; requestRef tracks the active HTTP request.
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  // Cancel an unfinished request if the page component is removed.
  useEffect(() => () => requestRef.current?.abort(), []);

  // Both clicking Send and pressing Enter call this same function.
  const handleSubmit = async () => {
    const prompt = text.trim();
    // The ref is updated immediately, so rapid clicks cannot send duplicates.
    if (!prompt || requestRef.current) return;
    // Pass this controller's signal to fetch so New chat can cancel the request.
    const controller = new AbortController();
    requestRef.current = controller;
    setIsSending(true);
    setError(null);
    // Show the user message immediately, before the server responds. The
    // updater receives the latest list; UUIDs give React stable, unique keys.
    setMessages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        text: prompt,
        provider,
        role: "user",
      },
    ]);
    setText("");
    inputRef.current?.focus();

    const answerId = crypto.randomUUID();
    let receivedText = false;
    try {
      // Only the current prompt/provider are sent, not the conversation history.
      const answer = await sendMessage(
        prompt,
        provider,
        controller.signal,
        (chunk) => {
          if (controller.signal.aborted) return;
          receivedText = true;
          setMessages((previous) => {
            const existing = previous.find(
              (message) => message.id === answerId,
            );
            return existing
              ? previous.map((message) =>
                  message.id === answerId
                    ? { ...message, text: message.text + chunk }
                    : message,
                )
              : [
                  ...previous,
                  { id: answerId, text: chunk, provider, role: "assistant" },
                ];
          });
        },
      );
      // A cancelled request must not append a reply to a newly reset chat.
      if (controller.signal.aborted) return;
      if (!receivedText) {
        setMessages((previous) => [
          ...previous,
          {
            id: answerId,
            text: answer,
            provider,
            role: "assistant",
          },
        ]);
      }
    } catch (cause) {
      // Cancellation is intentional, so it should not appear as a failure.
      if (controller.signal.aborted) return;
      setError(
        cause instanceof TypeError
          ? "Couldn’t reach the chat API. Check that the backend is running and try again."
          : cause instanceof Error
            ? cause.message
            : "Couldn’t send your message. Please try again.",
      );
      // Restore the failed prompt for retry unless the user typed a new draft.
      // The previously displayed user message remains in the conversation.
      if (!receivedText) setText((current) => current || prompt);
    } finally {
      // An older request finishing must not clear a newer request's loading state.
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsSending(false);
      }
    }
  };

  const stopGeneration = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setIsSending(false);
    inputRef.current?.focus();
  };

  const startNewChat = () => {
    // Clear the request ref as well as cancelling fetch, allowing a new send.
    requestRef.current?.abort();
    requestRef.current = null;
    setIsSending(false);
    setError(null);
    setMessages([]);
    setText("");
    inputRef.current?.focus();
  };

  const selectPrompt = (prompt: string) => {
    // Suggestions populate the draft and focus the textarea; they do not send.
    setText(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="flex min-h-svh flex-col text-[14px] leading-normal motion-reduce:[&_*]:transition-none motion-reduce:[&_*::before]:transition-none motion-reduce:[&_*::after]:transition-none">
      <ChatHeader onNewChat={startNewChat} />

      <main className={cn(
        "mx-auto w-full max-w-[780px] px-[24px] max-[600px]:px-[20px]",
        messages.length
          ? "mt-[24px] mb-auto pt-0 pb-[32px] max-[600px]:mt-[12px] max-[600px]:pb-[64px]"
          : "my-auto pt-[64px] pb-[100px] max-[600px]:pt-[40px] max-[600px]:pb-[64px]",
      )}>
        {/* The empty state becomes a conversation after the first message. */}
        {messages.length === 0 ? (
          <ChatWelcome />
        ) : (
          <ChatWindow messages={messages} isSending={isSending} />
        )}

        {error && (
          <p className="mb-[16px] rounded-[12px] border border-destructive px-[16px] py-[12px] text-[13px] text-destructive" role="alert">
            {error}
          </p>
        )}

        {/* Controlled values flow down as props; callbacks send changes up. */}
        <MessageComposer
          text={text}
          onTextChange={setText}
          provider={provider}
          onProviderChange={setProvider}
          onSend={handleSubmit}
          onStop={stopGeneration}
          inputRef={inputRef}
          isSending={isSending}
        />

        {messages.length === 0 && (
          <PromptSuggestions onSelectPrompt={selectPrompt} />
        )}
      </main>
    </div>
  );
}

export default App;
