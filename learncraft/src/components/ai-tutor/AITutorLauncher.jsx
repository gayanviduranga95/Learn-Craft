import { Bot, Sparkles } from "lucide-react";

export default function AITutorLauncher({
  position,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
  minimized,
}) {
  return (
    <div
      className="lc-ai-root"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <button
        type="button"
        className="lc-ai-fab"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        aria-label={minimized ? "Reopen LearnCraft AI Tutor" : "Open LearnCraft AI Tutor"}
        title="Drag to move or click to open"
      >
        <Bot size={27} strokeWidth={1.8} />
        <span className="lc-ai-fab-sparkle">
          <Sparkles size={12} />
        </span>
      </button>
    </div>
  );
}
