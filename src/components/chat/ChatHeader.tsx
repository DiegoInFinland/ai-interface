// Page branding and New chat action. App.tsx supplies the reset callback;
// the header itself does not own or modify conversation state.
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatHeaderProps = {
  onNewChat: () => void;
};

export function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      {/* This is a normal navigation link; New chat below resets without reloading. */}
      <a className="chat-brand" href="./" aria-label="AI Interface home">
        <span className="brand-mark">
          <Sparkles size={19} aria-hidden="true" />
        </span>
        <span>AI Interface</span>
      </a>
      <Button variant="ghost" className="new-chat-button" onClick={onNewChat}>
        <Plus size={16} aria-hidden="true" /> New chat
      </Button>
    </header>
  );
}
