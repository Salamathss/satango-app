// src/components/MathText.tsx
import React, { useMemo } from "react";
import katex from "katex";
import { cn } from "@/lib/utils";

export interface MathTextProps {
  /** The text string containing prose and/or math formulas */
  text?: string;
  /** Direct children can also be a string or ReactNode */
  children?: React.ReactNode;
  /** Explicit formula to render directly in KaTeX */
  math?: string;
  /** Force block display mode */
  display?: boolean;
  /** Wrapper HTML tag */
  as?: "span" | "div" | "p";
  /** Optional class name */
  className?: string;
}

interface MathToken {
  type: "text" | "inline" | "block";
  value: string;
}

// In-memory cache for rendered KaTeX HTML strings to maximize rendering performance
const mathCache = new Map<string, string>();

export function cleanUnicodeMath(str: string): string {
  return str
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/⁴/g, "^4")
    .replace(/⁵/g, "^5")
    .replace(/⁶/g, "^6")
    .replace(/⁷/g, "^7")
    .replace(/⁸/g, "^8")
    .replace(/⁹/g, "^9")
    .replace(/⁰/g, "^0")
    .replace(/\s*±\s*/g, " \\pm ")
    .replace(/\s*×\s*/g, " \\times ")
    .replace(/\s*·\s*/g, " \\cdot ")
    .replace(/\s*≤\s*/g, " \\le ")
    .replace(/\s*≥\s*/g, " \\ge ")
    .replace(/\s*≠\s*/g, " \\ne ")
    .replace(/π/g, "\\pi ")
    .replace(/√(\w+|\([^)]+\))/g, "\\sqrt{$1}")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function renderKatexToString(tex: string, displayMode: boolean): string {
  const normalized = cleanUnicodeMath(tex.trim());
  const cacheKey = `${displayMode ? "D:" : "I:"}${normalized}`;
  const cached = mathCache.get(cacheKey);
  if (cached) return cached;

  try {
    const html = katex.renderToString(normalized, {
      throwOnError: false,
      displayMode,
      output: "htmlAndMathml",
    });

    if (mathCache.size > 2000) mathCache.clear();
    mathCache.set(cacheKey, html);
    return html;
  } catch {
    return `<span class="katex-error">${normalized}</span>`;
  }
}

export function tokenizeMathText(text: string): MathToken[] {
  if (!text || typeof text !== "string") return [];

  const trimmed = text.trim();

  // 1. Check if entire string is a standalone fraction: "29/100", "1/29", "-3/4", "1/2,900"
  if (/^[-+]?\d+(?:,\d+)?\s*\/\s*[-+]?\d+(?:,\d+)?$/.test(trimmed)) {
    const parts = trimmed.split("/");
    const tex = `\\frac{${parts[0].trim()}}{${parts[1].trim()}}`;
    return [{ type: "inline", value: tex }];
  }

  // 2. Standalone equation: "y = 7x + 5", "f(x) = 4x + b", "p = 0.96(15,000)^x"
  if (
    /^[a-zA-Z](?:\([a-zA-Z0-9]\))?\s*=\s*[-+0-9a-zA-Z\.\,\(\)\/\^\*\+\s\\]+$/.test(trimmed) &&
    trimmed.length <= 80 &&
    !/\b(the|is|and|or|what|if|of|for|with|cost|costs|spent|price)\b/i.test(trimmed)
  ) {
    return [{ type: "inline", value: trimmed }];
  }

  // 3. Standalone expression with powers or symbols: "3x² + 7x - 8", "x^2 - 4x + 4 = 0", "c² = a² + b²"
  if (
    /^[-+0-9a-zA-Z\.\,\(\)\/\^\*\+\s\\]*(?:\^|[²³⁴±≤≥≠π])[ -+0-9a-zA-Z\.\,\(\)\/\^\*\+\s\\]*$/.test(
      trimmed
    ) &&
    trimmed.length <= 80 &&
    !/\b(the|is|and|or|what|if|of|for|with|cost|costs|spent|price)\b/i.test(trimmed)
  ) {
    return [{ type: "inline", value: trimmed }];
  }

  // 4. Tokenize explicit delimiters: $$, \\[, \\(, $
  const delimiterRegex =
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)(?:\\.|[^\$\\\n])+?(?<!\s)\$)/g;

  if (!delimiterRegex.test(text)) {
    // If no delimiters, check for standalone caret powers like x^2, t^3, etc.
    const inlinePowerRegex = /\b([a-zA-Z0-9\(\)]+[\^²³][a-zA-Z0-9\(\)]*)\b/g;
    if (inlinePowerRegex.test(text)) {
      inlinePowerRegex.lastIndex = 0;
      const tokens: MathToken[] = [];
      let lastIdx = 0;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = inlinePowerRegex.exec(text)) !== null) {
        if (pMatch.index > lastIdx) {
          tokens.push({ type: "text", value: text.slice(lastIdx, pMatch.index) });
        }
        tokens.push({ type: "inline", value: cleanUnicodeMath(pMatch[0]) });
        lastIdx = inlinePowerRegex.lastIndex;
      }
      if (lastIdx < text.length) {
        tokens.push({ type: "text", value: text.slice(lastIdx) });
      }
      return tokens;
    }
    return [{ type: "text", value: text }];
  }

  delimiterRegex.lastIndex = 0;
  const tokens: MathToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = delimiterRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    const raw = match[0];

    if (raw.startsWith("$$")) {
      tokens.push({ type: "block", value: raw.slice(2, -2).trim() });
    } else if (raw.startsWith("\\[")) {
      tokens.push({ type: "block", value: raw.slice(2, -2).trim() });
    } else if (raw.startsWith("\\(")) {
      tokens.push({ type: "inline", value: raw.slice(2, -2).trim() });
    } else if (raw.startsWith("$")) {
      const inner = raw.slice(1, -1);
      // Currency safety: if it starts with digits and contains words like "and", "per", "for", it's currency text
      const isLikelyCurrency =
        /^\d+[\s\w,]+(?:\band\b|\bor\b|\bper\b|\bfor\b|\beach\b|\bspent\b|\bdollars\b)/i.test(
          inner
        );
      const hasMathOps = /[=+\\^_<>\/\(\)*\{\}\[\]]/.test(inner);

      if (isLikelyCurrency && !hasMathOps) {
        tokens.push({ type: "text", value: raw });
      } else {
        tokens.push({ type: "inline", value: inner });
      }
    }

    lastIndex = delimiterRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}

export const MathText: React.FC<MathTextProps> = ({
  text,
  children,
  math,
  display = false,
  as,
  className,
}) => {
  // Direct math prop override
  if (math !== undefined) {
    const html = renderKatexToString(math, display);
    const Tag = as || (display ? "div" : "span");
    return (
      <Tag
        className={cn(
          "inline-block",
          display && "block my-2 overflow-x-auto text-center w-full",
          className
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Determine target text
  const rawText =
    typeof text === "string"
      ? text
      : typeof children === "string"
      ? children
      : null;

  // Non-string children fallback
  if (rawText === null) {
    const Tag = as || "span";
    return <Tag className={className}>{children}</Tag>;
  }

  // Parse and render tokens
  const tokens = useMemo(() => tokenizeMathText(rawText), [rawText]);
  const hasBlockMath = tokens.some((t) => t.type === "block");
  const Tag = as || (hasBlockMath || display ? "div" : "span");

  return (
    <Tag className={cn("leading-normal", className)}>
      {tokens.map((token, index) => {
        if (token.type === "text") {
          return <React.Fragment key={index}>{token.value}</React.Fragment>;
        }

        const isBlock = token.type === "block" || display;
        const html = renderKatexToString(token.value, isBlock);

        return (
          <span
            key={index}
            className={cn(
              "inline-math select-text",
              isBlock && "block my-2 overflow-x-auto text-center w-full"
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </Tag>
  );
};

export default MathText;
