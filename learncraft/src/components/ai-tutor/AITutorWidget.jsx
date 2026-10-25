
import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, X, Minus, Send, Sparkles, Grip } from 'lucide-react'
import './AITutor.css'

const SUGGESTIONS = [
  'Explain a difficult concept',
  'Help me prepare for a quiz',
  'Create a study plan',
]

const INITIAL_MESSAGE = {
  role: 'assistant',
  text: "Hi there! 👋 I'm your LearnCraft AI Tutor. What would you like to learn today?",
}

const EDGE = 8
const FAB_SIZE = 60
const PANEL_WIDTH = 350
const PANEL_HEIGHT = 470
const PANEL_GAP = 12

const clamp = (value, min, max) =>
  Math.max(min, Math.min(value, Math.max(min, max)))

export default function AITutorWidget() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [position, setPosition] = useState(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })

  const inputRef = useRef(null)
  const dragRef = useRef(null)
  const draggedRef = useRef(false)
  const ignoreClickRef = useRef(false)
  const clickTimerRef = useRef(null)

  const isExpanded = open && !minimized

  // Keep the robot inside the browser viewport.
  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setViewport({ width, height })

      setPosition((current) => {
        if (!current) {
          return {
            x: Math.max(EDGE, width - FAB_SIZE - 24),
            y: Math.max(EDGE, height - FAB_SIZE - 24),
          }
        }

        return {
          x: clamp(current.x, EDGE, width - FAB_SIZE - EDGE),
          y: clamp(current.y, EDGE, height - FAB_SIZE - EDGE),
        }
      })
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)

    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isExpanded) return

    const timer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    return () => clearTimeout(timer)
  }, [isExpanded])

  // Start dragging from either the robot or the panel header.
  const handlePointerDown = useCallback((event) => {
    if (event.button !== 0) return

    if (event.target.closest('button, input, textarea') &&
        !event.currentTarget.classList.contains('lc-ai-fab')) {
      return
    }

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }

    draggedRef.current = false
    ignoreClickRef.current = false

    dragRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: position?.x ?? EDGE,
      startY: position?.y ?? EDGE,
    }

    // Capture the pointer on the actual element being dragged.
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Continue if pointer capture is unavailable.
    }

    event.preventDefault()
  }, [position])

  // Move the robot using the pointer's movement delta.
  const handlePointerMove = useCallback((event) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) return

    const dx = event.clientX - drag.pointerX
    const dy = event.clientY - drag.pointerY

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      draggedRef.current = true
    }

    if (!draggedRef.current) return

    event.preventDefault()

    setPosition({
      x: clamp(
        drag.startX + dx,
        EDGE,
        window.innerWidth - FAB_SIZE - EDGE
      ),
      y: clamp(
        drag.startY + dy,
        EDGE,
        window.innerHeight - FAB_SIZE - EDGE
      ),
    })
  }, [])

  const handlePointerUp = useCallback((event) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) return

    if (draggedRef.current) {
      // Prevent a drag-release from accidentally opening the tutor.
      ignoreClickRef.current = true

      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }

      clickTimerRef.current = window.setTimeout(() => {
        ignoreClickRef.current = false
        clickTimerRef.current = null
      }, 300)
    }

    dragRef.current = null
  }, [])

  const handleFabClick = useCallback(() => {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false

      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
      }

      return
    }

    setMinimized(false)
    setOpen(true)
  }, [])

  const minimizeTutor = useCallback(() => {
    setMinimized(true)
    setOpen(false)
  }, [])

  const closeTutor = useCallback(() => {
    setOpen(false)
    setMinimized(false)
  }, [])

  const sendMessage = useCallback((text = message) => {
    const cleanText = text.trim()
    if (!cleanText) return

    setMessages((current) => [
      ...current,
      { role: 'user', text: cleanText },
      {
        role: 'assistant',
        text: 'Thanks for your question! The chat interface is ready. Connect your AI service to generate real tutoring answers.',
      },
    ])

    setMessage('')
  }, [message])

  if (!position || !viewport.width || !viewport.height) {
    return null
  }

  // Keep the chat panel within the screen, independently of the robot.
  const panelWidth = Math.min(
    PANEL_WIDTH,
    viewport.width - EDGE * 2
  )

  const panelHeight = Math.min(
    PANEL_HEIGHT,
    viewport.height - EDGE * 2
  )

  const panelLeft = clamp(
    position.x + FAB_SIZE - panelWidth,
    EDGE,
    viewport.width - panelWidth - EDGE
  )

  const roomAbove = position.y - EDGE
  const roomBelow = viewport.height - position.y - FAB_SIZE - EDGE

  const opensAbove =
    roomAbove >= Math.min(
      panelHeight + PANEL_GAP,
      viewport.height - EDGE * 2
    ) || roomAbove >= roomBelow

  const panelTop = opensAbove
    ? Math.max(EDGE, position.y - panelHeight - PANEL_GAP)
    : Math.min(
        viewport.height - panelHeight - EDGE,
        position.y + FAB_SIZE + PANEL_GAP
      )

  return (
    <>
      {/* Chat panel is separate from the draggable robot. */}
      {isExpanded && (
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
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <span className="lc-ai-avatar">
              <Bot size={24} />
            </span>

            <span className="lc-ai-header-copy">
              <strong>LearnCraft Tutor</strong>
              <small>
                <span className="lc-ai-online-dot" />
                Ready to help you learn
              </small>
            </span>

            <button
              type="button"
              className="lc-ai-header-button"
              onClick={minimizeTutor}
              aria-label="Minimize AI Tutor"
              title="Minimize"
            >
              <Minus size={18} />
            </button>

            <button
              type="button"
              className="lc-ai-header-button"
              onClick={closeTutor}
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
              YOUR LEARNING COMPANION
            </span>

            <h3>What can I help you with?</h3>
            <p>Ask a question or choose a suggestion to get started.</p>
          </div>

          <div className="lc-ai-messages" aria-live="polite">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`lc-ai-message lc-ai-message-${item.role}`}
              >
                {item.text}
              </div>
            ))}
          </div>

          {messages.length === 1 && (
            <div className="lc-ai-suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                >
                  <Sparkles size={14} />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            className="lc-ai-composer"
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage()
            }}
          >
            <input
              ref={inputRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask your tutor anything..."
              aria-label="Message your tutor"
            />

            <button
              type="submit"
              disabled={!message.trim()}
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </form>

          <p className="lc-ai-disclaimer">
            Learning support · Verify important answers
          </p>
        </section>
      )}

      {/* The floating robot has its own position and pointer handlers. */}
      {!isExpanded && (
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
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleFabClick}
            aria-label={minimized ? 'Reopen AI Tutor' : 'Open AI Tutor'}
            title="Drag to move or click to open"
          >
            <Bot size={27} strokeWidth={1.8} />

            <span className="lc-ai-fab-sparkle">
              <Sparkles size={12} />
            </span>
          </button>
        </div>
      )}
    </>
  )
}
