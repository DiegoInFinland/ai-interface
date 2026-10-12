import type { Ref } from "react";
import { ArrowUp, ChevronDown, Globe, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MessageComposerProps = {
  text: string;
  onTextChange: (text: string) => void;
  provider: string;
  onProviderChange: (provider: string) => void;
  googleSearch: boolean;
  onGoogleSearchChange: (enabled: boolean) => void;
  onSend: () => void;
  onStop: () => void;
  inputRef: Ref<HTMLTextAreaElement>;
  isSending: boolean;
};
// MessageComposer component for composing and sending chat messages
export function MessageComposer({
  text,
  onTextChange,
  provider,
  onProviderChange,
  googleSearch,
  onGoogleSearchChange,
  onSend,
  onStop,
  inputRef,
  isSending,
}: MessageComposerProps) {
  return (
    <div className="mx-auto w-full max-w-[910px] shrink-0">
      {/* Message composer form for inputting and sending messages */}
      <form
        className="flex 
        items-center gap-[8px] 
        rounded-full 
        border border-border 
        bg-background 
        p-[6px] 
        shadow-[0_4px_24px_color-mix(in_srgb,var(--text-h)_10%,transparent)] 
        transition-[border-color,box-shadow] 
        duration-150 
        focus-within:border-neutral-700
        focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.03)]
        "
        onSubmit={(event) => {
          event.preventDefault();
          if (!isSending) onSend();
        }}
      >
        <label className="sr-only" htmlFor="message">
          Your message
        </label>
        <Textarea
          ref={inputRef}
          id="message"
          name="message"
          className="min-h-[calc(1lh+16px)] max-h-[260px] min-w-0 max-w-full flex-1 
          resize-none 
          rounded-full 
          border-0 
          bg-transparent 
          px-[12px] 
          py-[8px] 
          text-[16px] 
          leading-[1.5] 
          text-strong 
          shadow-none 
          placeholder:text-foreground 
          focus-visible:shadow-none 
          focus-visible:ring-0 
          md:text-[16px] 
          dark:bg-transparent
          focus:placeholder-transparent
          "
          placeholder="Your message…"
          value={text}
          rows={1}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyDown={(event) => {
            // Don't submit while an input method editor is composing text.
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              if (!isSending) onSend();
            }
          }}
          aria-describedby="composer-hint"
        />
        <div className="flex shrink-0 items-center gap-[8px]">
          <div className="relative flex items-center gap-[7px] text-strong">
            <Sparkles
              className="text-accent max-[600px]:hidden"
              size={15}
              aria-hidden="true"
            />
            <label className="sr-only" htmlFor="provider">
              AI provider
            </label>
            <select
              id="provider"
              className="
              cursor-pointer 
              appearance-none 
              rounded-[4px] 
              border-0 
              bg-transparent 
              py-[7px] 
              pr-[22px] 
              pl-0 
              text-[13px] 
              text-inherit 
              focus-visible:outline-2 
              focus-visible:outline-offset-4 
              focus-visible:outline-transparent"
              value={provider}
              disabled={isSending}
              onChange={(event) => onProviderChange(event.target.value)}
            >
              <option>Gemini</option>
              <option>ChatGPT</option>
              <option>Claude</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-[3px] text-foreground"
              size={13}
              aria-hidden="true"
            />
          </div>
          <Button
            type={isSending ? "button" : "submit"}
            size="icon"
            className="size-[38px] rounded-full disabled:bg-border disabled:text-foreground disabled:opacity-100"
            disabled={!isSending && !text.trim()}
            onClick={isSending ? onStop : undefined}
            aria-label={isSending ? "Stop generation" : "Send message"}
            title={isSending ? "Stop generation" : "Send message"}
          >
            {isSending ? (
              <Square size={16} fill="currentColor" aria-hidden="true" />
            ) : (
              <ArrowUp size={20} aria-hidden="true" />
            )}
          </Button>
        </div>
      </form>
      {/* Composer hint and additional options for the message composer */}
      <div className="mt-[12px] flex flex-wrap items-center justify-center gap-x-[16px] gap-y-[8px]">
        {provider === "Gemini" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={
              googleSearch
                ? "h-[28px] rounded-full border-accent-border bg-accent-soft px-[10px] text-[11px] text-strong"
                : "h-[28px] rounded-full px-[10px] text-[11px] text-foreground"
            }
            aria-pressed={googleSearch}
            disabled={isSending}
            onClick={() => onGoogleSearchChange(!googleSearch)}
            title="Let Gemini use Google Search for current information and sources"
          >
            <Globe size={13} aria-hidden="true" /> Google Search
          </Button>
        )}
        <p className="text-center text-[11px]" id="composer-hint">
          {isSending ? (
            "Generating a reply · Stop anytime"
          ) : (
            <>
              Self hosted AI-interface. Diego(c) Under
              <a href="https://opensource.org"> MIT</a> License
            </>
          )}
        </p>
      </div>
    </div>
  );
}
