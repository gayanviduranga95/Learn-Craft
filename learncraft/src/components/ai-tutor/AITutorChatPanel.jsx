import { useRef, useEffect } from "react";
import { Bot, X, Minus, Send, Sparkles, Grip } from "lucide-react";
import AITutorMessages from "./AITutorMessages";
import AITutorSuggestions from "./AITutorSuggestions";

export default function AITutorChatPanel({
  panelLeft,
  panelTop,
  panelWidth,
  panelHeight,
  messages,
  message,
  loading,
  suggestions,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onMinimize,
  onClose,
  onChangeMessage,
  onSendMessage,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <section
      className="lc-ai-panel"
      style={{
        left: panelLeft,
        top: panelTop,
        width: panelWidth,
        height: panelHeight,
      }}
      aria-label="LearnCraft AI Tutor"
    >
      <header
        className="lc-ai-header"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="lc-ai-avatar">
          <Bot size={24} />
        </span>

        <span className="lc-ai-header-copy">
          <strong>LearnCraft AI Tutor</strong>
          <small>
            <span className="lc-ai-online-dot" />
            Active · Ready to help
          </small>
        </span>

        <button
          type="button"
          className="lc-ai-header-button"
          onClick={onMinimize}
          aria-label="Minimize AI Tutor"
          title="Minimize"
        >
          <Minus size={18} />
        </button>

        <button
          type="button"
          className="lc-ai-header-button"
          onClick={onClose}
          aria-label="Close AI Tutor"
          title="Close"
        >
          <X size={18} />
        </button>

        <Grip className="lc-ai-grip" size={15} />
      </header>

      <div className="lc-ai-welcome">
        <span className="lc-ai-eyebrow">
          <Sparkles size={15} />
          YOUR AI STUDY COMPANION
        </span>
        <h3>What can I help you learn?</h3>
        <p>Ask for explanations, summaries, examples, or practice quizzes!</p>
      </div>

      <AITutorMessages messages={messages} loading={loading} />

      {messages.length <= 2 && (
        <AITutorSuggestions
          suggestions={suggestions}
          onSelect={(text) => onSendMessage(text)}
        />
      )}

      <form
        className="lc-ai-composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSendMessage(message);
        }}
      >
        <input
          ref={inputRef}
          value={message}
          onChange={(event) => onChangeMessage(event.target.value)}
          placeholder="Ask your tutor anything..."
          aria-label="Message your tutor"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading || !message.trim()}
          aria-label="Send message"
        >
          <Send size={17} />
        </button>
      </form>

      <p className="lc-ai-disclaimer">
        AI Learning Assistant · Verify key concepts
      </p>
    </section>
  );
}
