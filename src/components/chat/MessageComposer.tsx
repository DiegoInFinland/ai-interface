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
    <div className="composer-area">
      <form
        className="message-composer"
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
          className="message-input"
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
        <div className="composer-toolbar">
          <div className="provider-picker">
            <Sparkles size={15} aria-hidden="true" />
            <label className="sr-only" htmlFor="provider">AI provider</label>
            {/* Lock the selection during a request so it matches the pending reply. */}
            <select
              id="provider"
              value={provider}
              disabled={isSending}
              onChange={(event) => onProviderChange(event.target.value)}
            >
              <option>ChatGPT</option>
              <option>Gemini</option>
              <option>Claude</option>
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </div>
          {/* Submission is also guarded in App.tsx, not just by this disabled state. */}
          <Button
            type={isSending ? "button" : "submit"}
            size="icon"
            className="send-button"
            disabled={!isSending && !text.trim()}
            onClick={isSending ? onStop : undefined}
            aria-label={isSending ? "Stop generation" : "Send message"}
            title={isSending ? "Stop generation" : "Send message"}
          >
            {isSending ? <Square size={16} fill="currentColor" aria-hidden="true" /> : <ArrowUp size={20} aria-hidden="true" />}
          </Button>
        </div>
      </form>
      <p className="composer-hint" id="composer-hint">
        {isSending ? "Generating a reply · Stop anytime" : (
          <>Enter to send <span aria-hidden="true">·</span> Shift + Enter for a new line</>
        )}
      </p>
    </div>
  );
}
