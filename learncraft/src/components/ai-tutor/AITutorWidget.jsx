import { useCallback, useEffect, useRef, useState } from "react";
import AITutorLauncher from "./AITutorLauncher";
import AITutorChatPanel from "./AITutorChatPanel";
import { aiApi } from "../../services/api";
import "./AITutor.css";

const SUGGESTIONS = [
  "Explain a difficult concept with an analogy",
  "Summarize key study tips for my next quiz",
  "Give me 2 practice questions to test my memory",
];

const INITIAL_MESSAGE = {
  role: "assistant",
  text: "Hi there! 👋 I'm your LearnCraft AI Tutor. What would you like to explore or practice today?",
};

const EDGE = 8;
const FAB_SIZE = 60;
const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 490;
const PANEL_GAP = 12;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(value, Math.max(min, max)));

export default function AITutorWidget({ context }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const dragRef = useRef(null);
  const draggedRef = useRef(false);
  const ignoreClickRef = useRef(false);
  const clickTimerRef = useRef(null);

  const isExpanded = open && !minimized;

  // Keep floating robot within browser boundaries
  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setViewport({ width, height });

      setPosition((current) => {
        if (!current) {
          return {
            x: Math.max(EDGE, width - FAB_SIZE - 24),
            y: Math.max(EDGE, height - FAB_SIZE - 24),
          };
        }

        return {
          x: clamp(current.x, EDGE, width - FAB_SIZE - EDGE),
          y: clamp(current.y, EDGE, height - FAB_SIZE - EDGE),
        };
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  // Pointer drag logic
  const handlePointerDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      if (
        event.target.closest("button, input, textarea") &&
        !event.currentTarget.classList.contains("lc-ai-fab")
      ) {
        return;
      }

      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }

      draggedRef.current = false;
      ignoreClickRef.current = false;

      dragRef.current = {
        pointerId: event.pointerId,
        pointerX: event.clientX,
        pointerY: event.clientY,
        startX: position?.x ?? EDGE,
        startY: position?.y ?? EDGE,
      };

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // continue
      }

      event.preventDefault();
    },
    [position]
  );

  const handlePointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.pointerX;
    const dy = event.clientY - drag.pointerY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      draggedRef.current = true;
    }

    if (!draggedRef.current) return;
    event.preventDefault();

    setPosition({
      x: clamp(drag.startX + dx, EDGE, window.innerWidth - FAB_SIZE - EDGE),
      y: clamp(drag.startY + dy, EDGE, window.innerHeight - FAB_SIZE - EDGE),
    });
  }, []);

  const handlePointerUp = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (draggedRef.current) {
      ignoreClickRef.current = true;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickTimerRef.current = window.setTimeout(() => {
        ignoreClickRef.current = false;
        clickTimerRef.current = null;
      }, 300);
    }

    dragRef.current = null;
  }, []);

  const handleFabClick = useCallback(() => {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }
    setMinimized(false);
    setOpen(true);
  }, []);

  const sendMessage = useCallback(
    async (textToSend = message) => {
      const cleanText = textToSend.trim();
      if (!cleanText || loading) return;

      const userMsg = { role: "user", text: cleanText };
      const currentHistory = [...messages, userMsg];
      setMessages(currentHistory);
      setMessage("");
      setLoading(true);

      try {
        const response = await aiApi.chat(
          cleanText,
          messages.slice(-6),
          context || {}
        );

        const replyText =
          response?.data?.reply ||
          "I'm here to support your learning! What shall we review next?";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: replyText,
            error: response?.data?.error,
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `Sorry, I couldn't reach the tutoring service: ${err.message}. Please check your connection and try again.`,
            error: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [message, messages, loading, context]
  );

  if (!position || !viewport.width || !viewport.height) {
    return null;
  }

  const panelWidth = Math.min(PANEL_WIDTH, viewport.width - EDGE * 2);
  const panelHeight = Math.min(PANEL_HEIGHT, viewport.height - EDGE * 2);
  const panelLeft = clamp(
    position.x + FAB_SIZE - panelWidth,
    EDGE,
    viewport.width - panelWidth - EDGE
  );

  const roomAbove = position.y - EDGE;
  const roomBelow = viewport.height - position.y - FAB_SIZE - EDGE;
  const opensAbove =
    roomAbove >= Math.min(panelHeight + PANEL_GAP, viewport.height - EDGE * 2) ||
    roomAbove >= roomBelow;

  const panelTop = opensAbove
    ? Math.max(EDGE, position.y - panelHeight - PANEL_GAP)
    : Math.min(
        viewport.height - panelHeight - EDGE,
        position.y + FAB_SIZE + PANEL_GAP
      );

  return (
    <>
      {isExpanded && (
        <AITutorChatPanel
          panelLeft={panelLeft}
          panelTop={panelTop}
          panelWidth={panelWidth}
          panelHeight={panelHeight}
          messages={messages}
          message={message}
          loading={loading}
          suggestions={SUGGESTIONS}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onMinimize={() => {
            setMinimized(true);
            setOpen(false);
          }}
          onClose={() => {
            setOpen(false);
            setMinimized(false);
          }}
          onChangeMessage={setMessage}
          onSendMessage={sendMessage}
        />
      )}

      {!isExpanded && (
        <AITutorLauncher
          position={position}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleFabClick}
          minimized={minimized}
        />
      )}
    </>
  );
}
