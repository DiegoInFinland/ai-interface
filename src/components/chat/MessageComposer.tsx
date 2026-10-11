/*
 * Controlled message form: App.tsx owns text/provider and supplies callbacks.
 * This component handles input events and delegates sending through onSend.
 * inputRef lets the parent focus the actual textarea after reset or suggestion.
 */
import type { Ref } from "react";
import { ArrowUp, ChevronDown, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MessageComposerProps = {
  text: string;
  onTextChange: (text: string) => void;
  provider: string;
  onProviderChange: (provider: string) => void;
  onSend: () => void;
  onStop: () => void;
  inputRef: Ref<HTMLTextAreaElement>;
  isSending: boolean;
};

export function MessageComposer({
  text,
  onTextChange,
  provider,
  onProviderChange,
  onSend,
  onStop,
  inputRef,
  isSending,
}: MessageComposerProps) {
  return (
    <div>
      <form
        className="rounded-[24px] border border-border bg-background p-[8px] shadow-[0_4px_24px_color-mix(in_srgb,var(--text-h)_4%,transparent)] transition-[border-color,box-shadow] duration-150 focus-within:border-accent-border focus-within:shadow-[0_0_0_3px_var(--accent-bg)]"
        onSubmit={(event) => {
          // Keep form submission inside React instead of navigating/reloading.
          event.preventDefault();
          if (!isSending) onSend();
        }}
      >
        {/* sr-only hides the label visually while keeping it accessible. */}
        <label className="sr-only" htmlFor="message">Your message</label>
        <Textarea
          ref={inputRef}
          id="message"
          name="message"
          className="min-h-[112px] max-h-[280px] w-full resize-none rounded-[16px] border-0 bg-transparent px-[16px] py-[14px] text-[16px] leading-[1.65] text-strong shadow-none placeholder:text-foreground focus-visible:shadow-none focus-visible:ring-0 md:text-[16px] dark:bg-transparent"
          placeholder="Ask anything, or start with an idea…"
          value={text}
          rows={3}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter keeps a newline. Do not send while an
            // input method editor is composing characters (e.g. Japanese input).
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (!isSending) onSend();
            }
          }}
          aria-describedby="composer-hint"
        />
        <div className="flex items-center justify-between pt-[4px] pr-[6px] pb-[6px] pl-[12px]">
          <div className="relative flex items-center gap-[7px] text-strong">
            <Sparkles className="text-accent" size={15} aria-hidden="true" />
            <label className="sr-only" htmlFor="provider">AI provider</label>
            {/* Lock the selection during a request so it matches the pending reply. */}
            <select
              id="provider"
              className="cursor-pointer appearance-none rounded-[4px] border-0 bg-transparent py-[7px] pr-[22px] pl-0 text-[13px] text-inherit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              value={provider}
              disabled={isSending}
              onChange={(event) => onProviderChange(event.target.value)}
            >
              <option>ChatGPT</option>
              <option>Gemini</option>
              <option>Claude</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-[3px] text-foreground" size={13} aria-hidden="true" />
          </div>
          {/* Submission is also guarded in App.tsx, not just by this disabled state. */}
          <Button
            type={isSending ? "button" : "submit"}
            size="icon"
            className="size-[38px] rounded-[14px] disabled:bg-border disabled:text-foreground disabled:opacity-100"
            disabled={!isSending && !text.trim()}
            onClick={isSending ? onStop : undefined}
            aria-label={isSending ? "Stop generation" : "Send message"}
            title={isSending ? "Stop generation" : "Send message"}
          >
            {isSending ? <Square size={16} fill="currentColor" aria-hidden="true" /> : <ArrowUp size={20} aria-hidden="true" />}
          </Button>
        </div>
      </form>
      <p className="mt-[12px] text-center text-[11px]" id="composer-hint">
        {isSending ? "Generating a reply · Stop anytime" : (
          <>Enter to send <span className="mx-[6px]" aria-hidden="true">·</span> Shift + Enter for a new line</>
        )}
      </p>
    </div>
  );
}
