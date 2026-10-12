import { useEffect, useLayoutEffect, useRef } from "react";
import { Conversation, type Message } from "./Conversation";

type ChatWindowProps = {
  messages: Message[];
  isSending: boolean;
};

const ChatWindow = ({ messages, isSending }: ChatWindowProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Remember the user's scroll intent before new streaming text changes height.
  const followBottomRef = useRef(true);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const distanceBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    followBottomRef.current = distanceBottom <= 64;
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container && followBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isSending]);

  // Observe changes in the container and content size to maintain scroll position.
  // Lazy-loaded Markdown and viewport resizing can change height without new text.
  useEffect(() => {
    const container = containerRef.current;
    const content = container?.firstElementChild;
    if (!container || !content) return;
    const observer = new ResizeObserver(() => {
      if (followBottomRef.current) container.scrollTop = container.scrollHeight;
    });
    observer.observe(container);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="
      mb-[24px] 
      min-h-0 
      flex-1 
      overflow-y-auto 
      rounded-[4px] 
      pt-[4px] 
      pr-[12px] 
      pb-[4px] 
      pl-[4px] 
      [overflow-anchor:none] 
      [scrollbar-width:none] 
      focus-visible:outline-2 
      focus-visible:outline-offset-4 
      focus-visible:outline-accent 
      [&::-webkit-scrollbar]:hidden"
      onScroll={handleScroll}
      role="region"
      aria-label="Chat messages"
      tabIndex={0}
    >
      <Conversation messages={messages} isSending={isSending} />
    </div>
  );
};
export default ChatWindow;
