import { useState } from 'react';
import {
  Copy,
  Check,
  Code,
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  CheckSquare,
  Square
} from 'lucide-react';
import './MarkdownViewer.css';

/**
 * Enhanced CodeBlock with Copy button, language tag, and modern terminal styling.
 */
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const displayLang = (language || 'code').toUpperCase();

  return (
    <div className="lc-code-block-wrapper">
      <div className="lc-code-header">
        <div className="lc-code-lang">
          <Code size={13} />
          <span>{displayLang}</span>
        </div>
        <button
          type="button"
          className={`lc-code-copy-btn ${copied ? 'is-copied' : ''}`}
          onClick={handleCopy}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={13} color="#4ade80" />
              <span style={{ color: '#4ade80' }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="lc-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Render inline formatting (bold, italic, strikethrough, inline code, links)
 */
function parseInline(text) {
  if (!text) return null;

  // Split into tokens based on markdown syntax
  const tokens = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // 1. Inline Code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code key={`code-${keyIdx++}`} className="lc-inline-code">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 2. Bold & Italic: ***text*** or ___text___
    const boldItalicMatch = remaining.match(/^(\*\*\*|___)(.+?)\1/);
    if (boldItalicMatch) {
      tokens.push(
        <strong key={`bi-${keyIdx++}`}>
          <em>{parseInline(boldItalicMatch[2])}</em>
        </strong>
      );
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // 3. Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      tokens.push(
        <strong key={`b-${keyIdx++}`}>{parseInline(boldMatch[2])}</strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 4. Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
    if (italicMatch) {
      tokens.push(
        <em key={`i-${keyIdx++}`}>{parseInline(italicMatch[2])}</em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 5. Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      tokens.push(
        <del key={`del-${keyIdx++}`}>{parseInline(strikeMatch[1])}</del>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // 6. Links: [label](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push(
        <a
          key={`a-${keyIdx++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="lc-md-link"
        >
          {linkMatch[1]}
          <ExternalLink size={11} className="lc-md-link-icon" />
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 7. Plain text chunk up to next special char
    const nextSpecial = remaining.search(/[`*_~\[]/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // First char is special but didn't match a pattern, push single char and advance
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

/**
 * Main Markdown Parser & Viewer component
 */
export default function MarkdownViewer({ content }) {
  if (!content || typeof content !== 'string') {
    return (
      <div className="lc-markdown-empty">
        <p>No instructional reading content provided for this lesson yet.</p>
      </div>
    );
  }

  const rawLines = content.replace(/\r\n/g, '\n').split('\n');
  const elements = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Fenced Code Block: ```lang
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <CodeBlock
          key={`block-${elements.length}`}
          code={codeLines.join('\n')}
          language={language}
        />
      );
      continue;
    }

    // 2. Alert / Callout Block: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING]
    const alertMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
    if (alertMatch) {
      const alertType = alertMatch[1].toUpperCase();
      const alertLines = [];
      i++;
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        alertLines.push(rawLines[i].replace(/^>\s?/, ''));
        i++;
      }
      const alertBody = alertLines.join('\n').trim();

      const alertConfigs = {
        NOTE: { icon: <Info size={18} color="#38bdf8" />, className: 'is-note', label: 'Note' },
        TIP: { icon: <Lightbulb size={18} color="#34d399" />, className: 'is-tip', label: 'Pro Tip' },
        IMPORTANT: { icon: <AlertCircle size={18} color="#a78bfa" />, className: 'is-important', label: 'Important' },
        WARNING: { icon: <AlertTriangle size={18} color="#fbbf24" />, className: 'is-warning', label: 'Warning' },
        CAUTION: { icon: <AlertTriangle size={18} color="#f87171" />, className: 'is-caution', label: 'Caution' },
      };

      const cfg = alertConfigs[alertType] || alertConfigs.NOTE;

      elements.push(
        <div key={`alert-${elements.length}`} className={`lc-md-alert ${cfg.className}`}>
          <div className="lc-md-alert-header">
            {cfg.icon}
            <span>{cfg.label}</span>
          </div>
          <div className="lc-md-alert-body">
            {alertBody.split('\n').map((p, pIdx) => (
              <p key={pIdx}>{parseInline(p)}</p>
            ))}
          </div>
        </div>
      );
      continue;
    }

    // 3. Standard Blockquote: > text
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        quoteLines.push(rawLines[i].replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote key={`quote-${elements.length}`} className="lc-md-blockquote">
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx}>{parseInline(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 4. Headings: #, ##, ###, ####
    if (trimmed.startsWith('#')) {
      const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const headingId = text.toLowerCase().replace(/[^\w]+/g, '-');
        const HeadingTag = `h${Math.min(level, 4)}`;

        elements.push(
          <HeadingTag
            key={`h-${elements.length}`}
            id={headingId}
            className={`lc-md-heading lc-md-h${level}`}
          >
            {parseInline(text)}
          </HeadingTag>
        );
        i++;
        continue;
      }
    }

    // 5. Horizontal Rule: --- or ***
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(<hr key={`hr-${elements.length}`} className="lc-md-hr" />);
      i++;
      continue;
    }

    // 6. Markdown Tables: | Header | Header |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headers = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((h) => h.trim());
        // line 1 is separator |---|---|
        const rows = tableLines.slice(2).map((rowLine) =>
          rowLine
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );

        elements.push(
          <div key={`table-wrap-${elements.length}`} className="lc-md-table-wrap">
            <table className="lc-md-table">
              <thead>
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx}>{parseInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{parseInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 7. Lists (Unordered or Ordered or Tasks)
    const listMatch = trimmed.match(/^(\*|-|\+|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const isOrdered = /^\d+\./.test(listMatch[1]);
      const listItems = [];

      while (i < rawLines.length) {
        const currLine = rawLines[i].trim();
        const currMatch = currLine.match(/^(\*|-|\+|\d+\.)\s+(.*)$/);
        if (!currMatch) break;

        const itemContent = currMatch[2];
        // Check for task checklist - [x] or - [ ]
        const taskMatch = itemContent.match(/^\[([ xX])\]\s*(.*)$/);

        if (taskMatch) {
          const isChecked = taskMatch[1].toLowerCase() === 'x';
          listItems.push(
            <li key={listItems.length} className="lc-md-task-item">
              {isChecked ? (
                <CheckSquare size={16} className="lc-task-checked" />
              ) : (
                <Square size={16} className="lc-task-unchecked" />
              )}
              <span>{parseInline(taskMatch[2])}</span>
            </li>
          );
        } else {
          listItems.push(
            <li key={listItems.length} className="lc-md-list-item">
              {parseInline(itemContent)}
            </li>
          );
        }
        i++;
      }

      if (isOrdered) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="lc-md-ol">
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="lc-md-ul">
            {listItems}
          </ul>
        );
      }
      continue;
    }

    // 8. Regular paragraph
    elements.push(
      <p key={`p-${elements.length}`} className="lc-md-paragraph">
        {parseInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="lc-markdown-container">{elements}</div>;
}
