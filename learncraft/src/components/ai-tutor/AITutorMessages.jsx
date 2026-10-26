export default function AITutorMessages({ messages, loading }) {
  return (
    <div className="lc-ai-messages" aria-live="polite">
      {messages.map((item, index) => (
        <div
          key={`${item.role}-${index}`}
          className={`lc-ai-message lc-ai-message-${item.role} ${item.error ? "lc-ai-message-error" : ""}`}
        >
          {item.text.split("\n").map((line, lIdx) => (
            <p key={lIdx} style={{ margin: line ? "0 0 6px 0" : "0 0 10px 0" }}>
              {line}
            </p>
          ))}
        </div>
      ))}

      {loading && (
        <div className="lc-ai-message lc-ai-message-assistant lc-ai-typing">
          <span className="lc-ai-dot" />
          <span className="lc-ai-dot" />
          <span className="lc-ai-dot" />
        </div>
      )}
    </div>
  );
}
