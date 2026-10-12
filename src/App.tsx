import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import type { Message } from "@/components/chat/Conversation";
import ChatWindow from "@/components/chat/ChatWindow";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { sendMessage, type GroundingData } from "@/lib/chat-api";
import { cn } from "@/lib/utils";

function App() {
  const [text, setText] = useState("");
  const [provider, setProvider] = useState("ChatGPT");
  const [googleSearch, setGoogleSearch] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const handleSubmit = async () => {
    const prompt = text.trim();
    // The ref is updated immediately, so rapid clicks cannot send duplicates.
    if (!prompt || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setIsSending(true);
    setError(null);
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
    let grounding: GroundingData | undefined;
    try {
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
        {
          googleSearch: provider === "Gemini" && googleSearch,
          onGrounding: (data) => {
            if (controller.signal.aborted) return;
            grounding = data;
            if (receivedText) {
              setMessages((previous) =>
                previous.map((message) =>
                  message.id === answerId
                    ? { ...message, grounding: data }
                    : message,
                ),
              );
            }
          },
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
            ...(grounding ? { grounding } : {}),
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
    requestRef.current?.abort();
    requestRef.current = null;
    setIsSending(false);
    setError(null);
    setMessages([]);
    setText("");
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        `flex 
        flex-col 
        text-[14px] 
        leading-normal 
        [&>header]:shrink-0 
        motion-reduce:[&_*]:transition-none motion-reduce:[&_*::before]:transition-none 
        motion-reduce:[&_*::after]:transition-none`,
        messages.length ? "h-dvh overflow-hidden" : "min-h-svh",
      )}
    >
      <ChatHeader onNewChat={startNewChat} />
      <main
        className={cn(
          "mx-auto w-full max-w-[980px] px-[24px] max-[600px]:px-[20px]",
          messages.length
            ? "mt-[24px] flex min-h-0 flex-1 flex-col pt-0 pb-[20px] max-[700px]:mt-[12px] max-[700px]:pb-[16px]"
            : "my-auto pt-[64px] pb-[100px] max-[700px]:pt-[40px] max-[700px]:pb-[64px]",
        )}
      >
        {messages.length === 0 ? (
          <ChatWelcome />
        ) : (
          <ChatWindow messages={messages} isSending={isSending} />
        )}

        {error && (
          <p
            className="
            mb-[16px] 
            shrink-0 
            rounded-[12px] 
            border 
            border-destructive 
            px-[16px] 
            py-[12px] 
            text-[13px] 
            text-destructive
            "
            role="alert"
          >
            {error}
          </p>
        )}

        <MessageComposer
          text={text}
          onTextChange={setText}
          provider={provider}
          onProviderChange={setProvider}
          googleSearch={googleSearch}
          onGoogleSearchChange={setGoogleSearch}
          onSend={handleSubmit}
          onStop={stopGeneration}
          inputRef={inputRef}
          isSending={isSending}
        />
      </main>
    </div>
  );
}

export default App;
