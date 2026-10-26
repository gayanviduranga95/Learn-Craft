import { Sparkles } from "lucide-react";

export default function AITutorSuggestions({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="lc-ai-suggestions">
      {suggestions.map((suggestion) => (
        <button
          type="button"
          key={suggestion}
          onClick={() => onSelect(suggestion)}
        >
          <Sparkles size={14} />
          {suggestion}
        </button>
      ))}
    </div>
  );
}
