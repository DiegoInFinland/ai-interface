// Draft shortcuts for the empty state. Selecting one fills the textarea via
// App.tsx's callback; the user can edit it before sending.
import { Code2, Lightbulb, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

// Each entry pairs a short button label with an icon and the actual draft text.
const suggestions = [
  { label: "Write something", icon: PenLine, prompt: "Help me write a clear, friendly email about " },
  { label: "Explore an idea", icon: Lightbulb, prompt: "Help me brainstorm ideas for " },
  { label: "Work through code", icon: Code2, prompt: "Help me understand and improve this code:\n\n" },
];

type PromptSuggestionsProps = {
  onSelectPrompt: (prompt: string) => void;
};

export function PromptSuggestions({ onSelectPrompt }: PromptSuggestionsProps) {
  return (
    <div className="prompt-suggestions" aria-label="Prompt ideas">
      {suggestions.map(({ label, icon: Icon, prompt }) => (
        <Button
          key={label}
          variant="outline"
          className="suggestion-button"
          onClick={() => onSelectPrompt(prompt)}
        >
          <Icon size={16} aria-hidden="true" />{label}
        </Button>
      ))}
    </div>
  );
}
