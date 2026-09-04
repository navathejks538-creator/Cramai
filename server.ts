import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please set your Gemini API key in the environment.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const MATH_AND_OVERRIDE_RULES = `
MATHEMATICAL NOTATION RULE:
Format all mathematical expressions, equations, and chemical formulas using clean standard LaTeX delimiters:
- Use single dollar signs for inline math: $F = ma$, $\\frac{2}{3}x = 10$, $x = 15$.
- Use double dollar signs on separate lines for block equations:
$$
P = \\frac{W}{t}
$$
Never write raw LaTeX commands like \\frac, \\text, \\cdot, \\times, \\left, \\right, \\sqrt without enclosing them in $ or $$.

USER OVERRIDE RULE:
If the user explicitly asks for more detail (e.g., "Explain in detail", "Give me a long explanation", "Explain deeply", "Tell me everything", "Comprehensive"), provide a more detailed response regardless of selected mode or length.
If the user explicitly asks for brevity (e.g., "Short answer", "One sentence", "Briefly", "Quick summary"), make the response even shorter regardless of selected mode or length.
The user's explicit request ALWAYS takes absolute priority over default settings.

NO AUTOMATIC FOLLOW-UPS OR BOILERPLATE:
CRITICAL: Do NOT append automatic follow-up questions, "Continue Studying" sections, "Suggested Follow-ups", "Would you like me to...", or practice suggestions. Answer the user's question directly and conclude naturally.
`;

const MODE_DEFINITIONS: Record<string, { name: string; purpose: string; instructions: string }> = {
  simple: {
    name: 'Simple',
    purpose: 'Fast, clear, direct understanding.',
    instructions: 'Give a concise, direct answer to the user\'s question. Prioritize the core concept and remove unnecessary detail. Use simple, direct language. Avoid fluff and background trivia.'
  },
  step_solver: {
    name: 'Step Solver',
    purpose: 'Methodical step-by-step problem solving.',
    instructions: 'Act as a step-by-step academic problem solver. Break mathematical, physics, chemistry, programming, or logical problems into clear sequential numbered steps. Show formulas, substitutions, calculations, and the verified final answer.'
  },
  deep_concept: {
    name: 'Deep Concept',
    purpose: 'First-principles intuition, analogies, and underlying WHY.',
    instructions: 'Explain the concept deeply so the student understands WHY it works from first principles, not just WHAT it is. Use clear intuition, relatable analogies, and concrete examples to illuminate relationships between ideas.'
  },
  high_yield: {
    name: 'High-Yield',
    purpose: 'Exam essentials, memory hooks, and critical distinctions.',
    instructions: 'Give only the most important information a student needs to score high on exams. Focus on definitions, core formulas, high-probability exam facts, and crucial distinctions in clear, high-density bullet points.'
  },
  socratic: {
    name: 'Socratic',
    purpose: 'Guided thinking, hints, and concept checks.',
    instructions: 'Do not immediately give away the complete final answer. Guide the student using thoughtful questions and progressive hints so they can reason through the problem themselves. If the user explicitly asks for the full answer, provide it.'
  },
  exam_traps: {
    name: 'Exam Traps',
    purpose: 'Common pitfalls, professor tricks, and misconceptions.',
    instructions: 'Highlight the most common mistakes, sign errors, misconceptions, and professor traps students fall into on exams regarding this topic. Clearly distinguish correct vs incorrect approaches (e.g., ⚠️ Don\'t confuse X with Y).'
  }
};

const LENGTH_DEFINITIONS: Record<string, string> = {
  short: 'SHORT: Very concise. Normally 1–4 sentences or 3–6 focused bullet points. Avoid unnecessary background or long examples.',
  balanced: 'BALANCED: Normal helpful explanation. Typically 100–250 words depending on problem complexity.',
  detailed: 'DETAILED: Thorough and comprehensive explanation when appropriate. Still adapt sensibly to the question without artificial filler.'
};

function buildSystemInstruction(mode: string = 'simple', length: string = 'balanced'): string {
  const normalizedMode = mode === 'step_by_step'
    ? 'step_solver'
    : mode === 'deep_dive'
    ? 'deep_concept'
    : mode;

  const modeInfo = MODE_DEFINITIONS[normalizedMode] || MODE_DEFINITIONS.simple;
  const lengthInfo = LENGTH_DEFINITIONS[length] || LENGTH_DEFINITIONS.balanced;

  return `You are Cram AI, the ultimate AI Study Helper for university & high school students.

CURRENT STUDY MODE:
${modeInfo.name} (${modeInfo.purpose})

MODE INSTRUCTIONS:
${modeInfo.instructions}

ANSWER LENGTH SETTING:
${lengthInfo}

MODE + LENGTH BEHAVIOR:
- Simple + Short: Very concise explanation (1–3 sentences or direct answer).
- Simple + Balanced: Concise but clear and fully answering the question.
- Simple + Detailed: Simple accessible language, but more complete coverage.
- Step Solver + Short: Only the essential solving steps and answer.
- Step Solver + Balanced: Clear, readable step-by-step resolution.
- Step Solver + Detailed: Thorough working, formulas, substitutions, and verified result.
- Deep Concept + Short: Short intuitive takeaway.
- Deep Concept + Balanced: Core concept, intuition, and why it works.
- Deep Concept + Detailed: Thorough conceptual breakdown with intuition, analogy, and examples.
- High-Yield + Short: Essential exam bullet points only.
- High-Yield + Balanced: Important exam points with brief explanations.
- High-Yield + Detailed: Comprehensive high-yield review sheet.
- Socratic + Short: Short hint or question.
- Socratic + Balanced: Interactive guided reasoning with hints.
- Socratic + Detailed: Structured guidance with milestones.
- Exam Traps + Short: Top 2–3 crucial mistakes.
- Exam Traps + Balanced: Common pitfalls with clear explanations.
- Exam Traps + Detailed: Comprehensive misconceptions and tricky edge cases.

${MATH_AND_OVERRIDE_RULES}`;
}

function cleanResponse(rawText: string): string {
  return rawText
    .replace(/---TAKEAWAYS---[\s\S]*$/, '')
    .replace(/---FOLLOWUPS---[\s\S]*$/, '')
    .replace(/^(\s*(\*\*Suggested Follow-ups\*\*|Suggested Follow-ups:|Continue Studying:?)[\s\S]*$)/im, '')
    .trim();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'Cram AI',
      hasApiKey: !!process.env.GEMINI_API_KEY
    });
  });

  // AI Study Analysis Endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const { prompt, mode = 'simple', length = 'balanced', attachments = [], history = [] } = req.body;

      if (!prompt && (!attachments || attachments.length === 0)) {
        return res.status(400).json({ error: 'Please provide a study question, text, or attachment.' });
      }

      const ai = getAIClient();
      const systemInstruction = buildSystemInstruction(mode, length);

      // Build Gemini contents array
      const contents: Array<{
        role: 'user' | 'model';
        parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
      }> = [];

      // Add prior multi-turn conversation history if present
      if (Array.isArray(history) && history.length > 0) {
        for (const msg of history) {
          if (msg.text) {
            contents.push({
              role: msg.role === 'model' ? 'model' : 'user',
              parts: [{ text: msg.text }]
            });
          }
        }
      }

      // Build latest user turn with text and any attachments
      const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      // Process attachments
      if (Array.isArray(attachments)) {
        for (const att of attachments) {
          if (!att.data) continue;

          // Strip data URL prefix if included
          const base64Data = att.data.includes(';base64,')
            ? att.data.split(';base64,')[1]
            : att.data;

          const mime = att.mimeType || 'image/jpeg';

          // If it's a plain text/markdown file, we can also inject the content as text
          if (mime.startsWith('text/') || mime === 'application/json') {
            try {
              const decodedText = Buffer.from(base64Data, 'base64').toString('utf-8');
              currentParts.push({
                text: `\n[Attached File: "${att.name}"]:\n\`\`\`\n${decodedText}\n\`\`\`\n`
              });
            } catch {
              currentParts.push({
                inlineData: {
                  mimeType: mime,
                  data: base64Data
                }
              });
            }
          } else {
            // Images, PDFs, and binary multi-modal documents
            currentParts.push({
              inlineData: {
                mimeType: mime,
                data: base64Data
              }
            });
          }
        }
      }

      // Add user prompt text
      const userText = prompt ? prompt.trim() : 'Please thoroughly analyze and explain the attached study material.';
      currentParts.push({ text: userText });

      contents.push({
        role: 'user',
        parts: currentParts
      });

      // Call Gemini model
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
        }
      });

      const rawReply = response.text || 'Unable to generate explanation. Please try again with additional details.';
      const cleanReplyText = cleanResponse(rawReply);

      return res.json({
        reply: cleanReplyText
      });
    } catch (err: unknown) {
      console.error('Error during AI analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown server error';
      return res.status(500).json({
        error: errorMessage
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cram AI server running on port ${PORT}`);
  });
}

startServer();
