/**
 * Preprocesses markdown text to ensure LaTeX math notation is properly
 * formatted for KaTeX rendering via remark-math and rehype-katex.
 * 
 * Accurately handles:
 * - \[ ... \] to $$ ... $$ (display math)
 * - \( ... \) to $ ... $ (inline math)
 * - Environments like \begin{aligned} ... \end{aligned} wrapped in $$ ... $$
 * - Raw/naked LaTeX commands like \frac{...}{...}, \sqrt{...}, \text{...}, \cdot, \times,
 *   \left, \right, Greek letters, and formulas that are outside dollar delimiters.
 * - Preserves code blocks (``` and `) and normal markdown completely.
 */

// Helper to match balanced curly braces: { ... }
function extractBalancedBraces(str: string, startIndex: number): number {
  if (str[startIndex] !== '{') return -1;
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function formatMathInMarkdown(content: string): string {
  if (!content) return '';

  let text = content;

  // 1. Convert display math delimiters \[ ... \] to $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, equation) => {
    return `\n\n$$\n${equation.trim()}\n$$\n\n`;
  });

  // 2. Convert inline math delimiters \( ... \) to $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, equation) => {
    return `$${equation.trim()}$`;
  });

  // 3. Convert LaTeX environments (\begin{aligned}, etc.) to $$ ... $$ if not already inside $$
  text = text.replace(/(?<!\$\$[\s\S]*?)(\\begin\{(aligned|align\*?|matrix|pmatrix|bmatrix|cases|gather\*?)\}[\s\S]*?\\end\{\2\})/g, (match) => {
    return `\n\n$$\n${match.trim()}\n$$\n\n`;
  });

  // 4. Split text by code blocks (```...```) to ensure code is never modified
  const codeBlockRegex = /(```[\s\S]*?```)/g;
  const parts = text.split(codeBlockRegex);

  for (let i = 0; i < parts.length; i++) {
    // Skip code blocks
    if (parts[i].startsWith('```')) {
      continue;
    }

    // Process non-code block segments
    parts[i] = processTextSegment(parts[i]);
  }

  return parts.join('');
}

function processTextSegment(segment: string): string {
  // Split by inline code (`...`) and existing math ($$...$$ and $...$)
  // We want to avoid touching already formatted math or inline code.
  const tokenRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|`[^`\n]+?`)/g;
  const subParts = segment.split(tokenRegex);

  for (let j = 0; j < subParts.length; j++) {
    const chunk = subParts[j];
    // If it's already an inline code, or math delimiter, leave it untouched
    if (
      (chunk.startsWith('$$') && chunk.endsWith('$$')) ||
      (chunk.startsWith('$') && chunk.endsWith('$')) ||
      (chunk.startsWith('`') && chunk.endsWith('`'))
    ) {
      continue;
    }

    // Transform unbracketed LaTeX commands in this plain text chunk
    subParts[j] = wrapNakedLatexCommands(chunk);
  }

  return subParts.join('');
}

function wrapNakedLatexCommands(chunk: string): string {
  let result = chunk;

  // Pattern A: Complex multi-term formulas starting with \frac, \sqrt, \left, etc.
  // e.g., \frac{\text{Charge}}{\text{Time}} or \frac{a}{b} + \frac{c}{d}
  // We identify occurrences of backslash LaTeX keywords outside of $
  const latexCommandPattern = /\\(frac|sqrt|left|right|text|cdot|times|pm|mp|sum|int|lim|prod|alpha|beta|gamma|delta|Delta|theta|Theta|pi|Pi|sigma|Sigma|lambda|Lambda|omega|Omega|mu|partial|nabla|infty|approx|neq|leq|geq|rightarrow|Rightarrow|degree)\b/;

  if (!latexCommandPattern.test(result)) {
    return result;
  }

  // Scan lines to safely wrap formulas or mathematical phrases
  const lines = result.split('\n');
  const processed = lines.map((line) => {
    // If line is empty or purely whitespace, return as is
    if (!line.trim()) return line;

    // If the entire trimmed line is a formula starting with or containing LaTeX commands and math symbols
    // e.g., "P = \frac{W}{t}" or "F = m \cdot a" or "\frac{\text{Charge}}{\text{Time}}"
    const lineHasLatex = latexCommandPattern.test(line);
    if (!lineHasLatex) return line;

    // Check if the line has a label like "Formula: \frac{W}{t}" or "Given: m = 5kg"
    const labelMatch = line.match(/^(\s*(?:[-*•]|\d+\.)?\s*(?:Formula|Given|Equation|Definition|Calculation|Substitution|Answer|Note):\s*)(.+)$/i);
    if (labelMatch) {
      const prefix = labelMatch[1];
      const rest = labelMatch[2].trim();
      if (latexCommandPattern.test(rest) && !rest.startsWith('$')) {
        return `${prefix}$${rest}$`;
      }
    }

    // Check if bullet point is purely a formula
    const bulletMatch = line.match(/^(\s*[-*•]\s*)(.+)$/);
    if (bulletMatch) {
      const bulletPrefix = bulletMatch[1];
      const formulaCandidate = bulletMatch[2].trim();
      // If it looks like a pure math expression with LaTeX
      if (isLikelyPureMath(formulaCandidate)) {
        return `${bulletPrefix}$${formulaCandidate}$`;
      }
    }

    // If the line is an isolated math line: e.g. "P = \frac{W}{t}" or "\frac{2}{3}x = 10"
    if (isLikelyPureMath(line.trim())) {
      return `$$${line.trim()}$$`;
    }

    // Otherwise, wrap individual inline LaTeX expressions within the sentence
    return wrapInlineLatexExpressions(line);
  });

  return processed.join('\n');
}

function isLikelyPureMath(str: string): boolean {
  if (!/\\(frac|sqrt|left|right|cdot|times|sum|int|partial|alpha|beta|gamma|theta|pi|sigma|lambda)/.test(str)) {
    return false;
  }
  // If it has long English sentences without formulas, it's not pure math
  const wordsWithoutBackslash = str.split(/\s+/).filter(w => !w.startsWith('\\') && /^[A-Za-z]{4,}$/.test(w));
  if (wordsWithoutBackslash.length > 4) {
    return false;
  }
  return true;
}

function wrapInlineLatexExpressions(line: string): string {
  // Replace unbracketed \frac{...}{...}
  let output = line;

  // Wrap \frac{...}{...} expressions including any preceding variable assignment like "I = \frac{Q}{t}"
  output = output.replace(
    /((?:[A-Za-z]\s*=\s*)?\\frac\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g,
    (match) => `$${match.trim()}$`
  );

  // Wrap \sqrt{...}
  output = output.replace(
    /(\\sqrt(?:\s*\[[^\]]+\])?\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g,
    (match) => `$${match.trim()}$`
  );

  // Wrap \left( ... \right) or \left[ ... \right]
  output = output.replace(
    /(\\left[\(\[\{][^\$]+?\\right[\)\]\}])/g,
    (match) => `$${match.trim()}$`
  );

  // Wrap isolated Greek letters or math symbols with variables like "\cdot", "m \cdot a", "\alpha"
  output = output.replace(
    /(?<!\$|\w)(\b[A-Za-z0-9_]+\s*\\cdot\s*[A-Za-z0-9_]+)(?!\$)/g,
    (match) => `$${match.trim()}$`
  );

  output = output.replace(
    /(?<!\$|\w)(\\(?:alpha|beta|gamma|delta|Delta|theta|Theta|lambda|Lambda|pi|Pi|sigma|Sigma|omega|Omega|mu|partial|nabla|infty))\b(?!\$)/g,
    (match) => `$${match.trim()}$`
  );

  // Clean up any double dollars accidentally produced like $$...$$ inside an inline $...$
  output = output.replace(/\$\$(\s*[^$]+?\s*)\$\$/g, (_m, inner) => `$$${inner}$$`);
  output = output.replace(/\$+\s*\$+/g, '$$');

  return output;
}
