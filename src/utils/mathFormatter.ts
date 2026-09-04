/**
 * Preprocesses markdown text to ensure LaTeX math notation is properly
 * formatted for KaTeX rendering via remark-math and rehype-katex.
 * 
 * Normalizes:
 * - \[ ... \] to $$ ... $$ (display math)
 * - \( ... \) to $ ... $ (inline math)
 * - Naked LaTeX commands like \frac{...}{...} that are outside dollar delimiters
 */
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

  // 3. Fix instances where equations start with $$ or $ but have improper spacing or single-slash confusion
  // Also detect standalone lines containing \frac, \sqrt, \cdot, \text etc. that aren't enclosed in $ or $$
  const lines = text.split('\n');
  let inCodeBlock = false;
  let inBlockMath = false;

  const processedLines = lines.map((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    if (inCodeBlock) return line;

    if (trimmed.startsWith('$$')) {
      inBlockMath = !inBlockMath;
      return line;
    }
    if (inBlockMath) return line;

    // Check if line looks like an equation containing LaTeX commands like \frac, \text, \cdot, \times, \int, \sum, \sqrt
    // but without outer $ delimiters
    const hasLatexCommands = /\\(frac|sqrt|text|cdot|times|pm|sum|int|lim|alpha|beta|gamma|theta|lambda|pi|sigma|partial|rightarrow|left|right|degree)\b/.test(line);
    const hasDollars = line.includes('$');

    if (hasLatexCommands && !hasDollars) {
      // Check if this line is predominantly a formula (e.g. Formula: \frac{2}{3}x + 5 = 15 or pure math)
      // If it has a label like "Formula:" or "In simple terms:", wrap the formula part
      const labelMatch = line.match(/^([A-Za-z\s]+:)\s*(.+)$/);
      if (labelMatch) {
        const prefix = labelMatch[1];
        const rest = labelMatch[2].trim();
        return `${prefix} $${rest}$`;
      } else if (/^[-*•]\s*(.+)$/.test(line)) {
        // Bullet with formula
        const bulletMatch = line.match(/^([ -*•]+\s*)(.+)$/);
        if (bulletMatch) {
          const bullet = bulletMatch[1];
          const math = bulletMatch[2].trim();
          return `${bullet}$${math}$`;
        }
      } else {
        // Line itself is a formula
        return `$$${trimmed}$$`;
      }
    }

    return line;
  });

  return processedLines.join('\n');
}
