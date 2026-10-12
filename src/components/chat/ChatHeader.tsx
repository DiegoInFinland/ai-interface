import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatHeaderProps = {
  onNewChat: () => void;
};

export function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-[16px] px-[36px] py-[12px] max-[600px]:px-[20px] max-[600px]:py-[10px]">
      <a
        className="
        inline-flex 
        items-center 
        gap-[10px] 
        rounded-[4px] 
        text-[15px] 
        font-[650] 
        tracking-[-0.4px] 
        text-strong 
        no-underline 
        focus-visible:outline-2 
        focus-visible:outline-offset-4 
        focus-visible:outline-accent"
        href="./"
        aria-label="AI Interface home"
      >
        <span className="grid size-[34px] place-items-center rounded-[11px] bg-accent-soft text-accent">
          <Sparkles size={19} aria-hidden="true" />
        </span>
        <span>AI Interface</span>
      </a>
      <Button
        variant="ghost"
        className="h-[36px] px-[12px] text-[13px] text-foreground"
        onClick={onNewChat}
      >
        <Plus size={16} aria-hidden="true" /> New chat
      </Button>
    </header>
  );
}
