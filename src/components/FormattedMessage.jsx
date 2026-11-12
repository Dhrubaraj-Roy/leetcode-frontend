import React, { useState } from "react";
import { Copy, Check, Terminal, Quote } from "lucide-react";
import { copyToClipboard } from "../lib/clipboard";

/**
 * Single Code Block with One-Click Copy
 */
export function CodeBlockItem({ language = "code", code = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayLang = (language || "CODE").toUpperCase();

  return (
    <div className="my-2.5 rounded-lg overflow-hidden border border-neutral-700/70 shadow-lg bg-[#18181b] text-neutral-100 text-xs font-mono">
      {/* Code Header Bar */}
      <div className="bg-[#27272a] px-3 py-1.5 flex items-center justify-between border-b border-neutral-700/60 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold tracking-wider text-neutral-300 font-sans">
            {displayLang}
          </span>
        </div>

        {/* One-Click Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="btn btn-ghost btn-xs h-6 px-2 text-[11px] gap-1.5 text-neutral-300 hover:text-white hover:bg-neutral-700/60 transition-all font-sans"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-success font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body Area */}
      <div className="p-3 overflow-x-auto leading-relaxed select-text text-[12px] bg-[#121214] font-mono">
        <pre className="m-0 p-0 font-mono whitespace-pre text-neutral-100 selection:bg-primary/30">
          {code}
        </pre>
      </div>
    </div>
  );
}

/**
 * Single Blockquote Item with One-Click Copy
 */
export function BlockQuoteItem({ text = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-2.5 border-l-4 border-warning bg-base-300/40 py-2 px-3 rounded-r-lg text-xs italic text-base-content/90">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <Quote className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5 opacity-80" />
          <div className="whitespace-pre-wrap">{text}</div>
        </div>

        {/* One-Click Copy Quote Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="btn btn-ghost btn-xs h-6 px-1.5 text-[10px] gap-1 shrink-0 bg-base-200/80 hover:bg-base-300 border border-base-content/10 transition-all"
          title="Copy quote"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-success" />
              <span className="text-success">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy quote</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Formats inline text: renders `code` and **bold**
 */
function renderInlineText(text) {
  if (!text) return null;

  // Split by inline code: `...`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, pIdx) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      const inlineCode = part.slice(1, -1);
      return (
        <code
          key={pIdx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-base-300/80 text-primary font-mono text-[11px] border border-base-content/10 font-semibold inline-block select-all"
        >
          {inlineCode}
        </code>
      );
    }

    // Split by bold: **...**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length > 4) {
        return (
          <strong key={`${pIdx}-${bIdx}`} className="font-semibold text-base-content">
            {bPart.slice(2, -2)}
          </strong>
        );
      }
      return bPart;
    });
  });
}

/**
 * Formats a block of text lines (headings, blockquotes, lists, paragraphs)
 */
function TextBlock({ content }) {
  const lines = content.split("\n");
  const elements = [];
  let quoteBuffer = [];

  const flushQuoteBuffer = () => {
    if (quoteBuffer.length > 0) {
      const fullQuote = quoteBuffer.join("\n");
      elements.push(
        <BlockQuoteItem key={`quote-${elements.length}`} text={fullQuote} />
      );
      quoteBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blockquote line: starts with >
    if (trimmed.startsWith(">")) {
      const cleanQuoteLine = trimmed.replace(/^>\s?/, "");
      quoteBuffer.push(cleanQuoteLine);
      continue;
    } else {
      flushQuoteBuffer();
    }

    // Empty line: spacing
    if (!trimmed) {
      elements.push(<div key={`spacer-${i}`} className="h-1.5" />);
      continue;
    }

    // Headings: ###, ##, #
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className="font-bold text-xs sm:text-sm text-base-content mt-2 mb-1 tracking-tight"
        >
          {renderInlineText(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="font-bold text-sm text-base-content mt-2.5 mb-1 tracking-tight"
        >
          {renderInlineText(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="font-bold text-sm sm:text-base text-base-content mt-3 mb-1.5 tracking-tight"
        >
          {renderInlineText(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
      continue;
    }

    // Bullet / Numbered list item
    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
    const isNumbered = /^\d+\.\s/.test(trimmed);

    if (isBullet || isNumbered) {
      const listContent = trimmed.replace(/^(-|\*|\d+\.)\s+/, "");
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-0.5 pl-1.5">
          <span className="text-primary font-bold text-[11px] mt-0.5 select-none">
            {isBullet ? "•" : trimmed.match(/^\d+\./)[0]}
          </span>
          <div className="flex-1 leading-relaxed text-xs">
            {renderInlineText(listContent)}
          </div>
        </div>
      );
      continue;
    }

    // Standard paragraph line
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed my-0.5">
        {renderInlineText(line)}
      </p>
    );
  }

  flushQuoteBuffer();

  return <div className="space-y-0.5">{elements}</div>;
}

/**
 * MessageFormatter Component
 * Parses markdown message text, rendering code blocks with one-click copy,
 * quotes with one-click copy, and clean typography.
 */
export default function FormattedMessage({ text = "" }) {
  if (!text) return null;

  // Split text by ```language\ncode``` blocks
  const codeBlockRegex = /```([a-zA-Z0-9_+#.-]*)\n([\s\S]*?)```/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore) {
      segments.push({ type: "text", content: textBefore });
    }

    segments.push({
      type: "code",
      language: match[1] || "code",
      code: match[2].trimEnd(),
    });

    lastIndex = match.index + match[0].length;
  }

  const remaining = text.slice(lastIndex);
  if (remaining) {
    // Check if there is an unclosed code block
    const unclosedMatch = remaining.match(/```([a-zA-Z0-9_+#.-]*)\n([\s\S]*)$/);
    if (unclosedMatch) {
      const beforeUnclosed = remaining.slice(0, unclosedMatch.index);
      if (beforeUnclosed) {
        segments.push({ type: "text", content: beforeUnclosed });
      }
      segments.push({
        type: "code",
        language: unclosedMatch[1] || "code",
        code: unclosedMatch[2].trimEnd(),
      });
    } else {
      segments.push({ type: "text", content: remaining });
    }
  }

  return (
    <div className="w-full break-words">
      {segments.map((seg, idx) => {
        if (seg.type === "code") {
          return (
            <CodeBlockItem
              key={`code-${idx}`}
              language={seg.language}
              code={seg.code}
            />
          );
        }
        return <TextBlock key={`text-${idx}`} content={seg.content} />;
      })}
    </div>
  );
}

