import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MathText, tokenizeMathText, cleanUnicodeMath } from "@/components/MathText";

describe("MathText & KaTeX rendering", () => {
  it("cleans and normalizes unicode exponents and symbols", () => {
    expect(cleanUnicodeMath("x² + y³ = r²")).toBe("x^2 + y^3 = r^2");
    expect(cleanUnicodeMath("πr²")).toBe("\\pi r^2");
    expect(cleanUnicodeMath("±5")).toBe("\\pm 5");
    expect(cleanUnicodeMath("x ≤ 10")).toBe("x \\le 10");
  });

  it("safely distinguishes currency amounts from LaTeX delimiters", () => {
    const text = "Sean rents a tent at a cost of $11 per day plus a fee of $10.";
    const tokens = tokenizeMathText(text);
    // Neither $11 nor $10 should be parsed as LaTeX formula delimiters
    const inlineTokens = tokens.filter((t) => t.type === "inline" || t.type === "block");
    expect(inlineTokens.length).toBe(0);
    expect(tokens[0].value).toContain("$11");
    expect(tokens[0].value).toContain("$10");
  });

  it("handles standalone currency options without breaking", () => {
    const text = "$1.50";
    const tokens = tokenizeMathText(text);
    expect(tokens).toEqual([{ type: "text", value: "$1.50" }]);
  });

  it("detects and formats standalone fractions into KaTeX fractions", () => {
    const text = "29/100";
    const tokens = tokenizeMathText(text);
    expect(tokens).toEqual([{ type: "inline", value: "\\frac{29}{100}" }]);
  });

  it("tokenizes inline LaTeX formulas enclosed in $...$", () => {
    const text = "What is the positive solution to $x^2 - 14x + 49 = 0$?";
    const tokens = tokenizeMathText(text);
    expect(tokens).toEqual([
      { type: "text", value: "What is the positive solution to " },
      { type: "inline", value: "x^2 - 14x + 49 = 0" },
      { type: "text", value: "?" },
    ]);
  });

  it("tokenizes block formulas in $$...$$ and \\[...] correctly", () => {
    const text = "Evaluate:\n$$f(x) = \\int_0^1 x^2 dx$$\nand solve.";
    const tokens = tokenizeMathText(text);
    expect(tokens.some((t) => t.type === "block")).toBe(true);
  });

  it("renders MathText component with KaTeX DOM elements", () => {
    const { container } = render(<MathText text="Solve $x^2 + 4 = 20$" />);
    // KaTeX outputs elements with .katex class
    const katexEl = container.querySelector(".katex");
    expect(katexEl).not.toBeNull();
  });

  it("renders direct math formula with prop math", () => {
    const { container } = render(<MathText math="A = \pi r^2" display />);
    const katexEl = container.querySelector(".katex");
    expect(katexEl).not.toBeNull();
  });
});
