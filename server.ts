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
Never write raw LaTeX commands like \\frac, \\text, \\cdot, \\left, \\right without enclosing them in $ or $$.

USER OVERRIDE RULE:
If the user explicitly asks for more detail (e.g., "Explain in detail", "Give me a long explanation", "Explain deeply", "Tell me everything"), provide more detail regardless of mode.
If the user explicitly asks for brevity (e.g., "Short answer", "One sentence", "Briefly"), make the response even shorter. The user's explicit request has priority over the default mode length.

NO UNNECESSARY SECTIONS:
Do NOT automatically add boilerplate sections like "Continue Studying", "Suggested Follow-ups", "Would you like to...", "Practice more...", or repeated conclusions. Keep the response clean and directly focused.
`;

const SYSTEM_PROMPTS: Record<string, string> = {
  simple: `You are Cram AI in "Simple" mode.
Purpose: Fast understanding.

Instructions:
Give a concise, direct answer to the user's question. Prioritize the core concept and remove unnecessary detail. Use simple language.
Normally stay within 50–120 words (1–4 short paragraphs OR 3–6 bullet points). If the question is extremely simple, answer in 1–3 sentences.
Do not add unnecessary examples, background information, follow-up suggestions, or repeated conclusions.
${MATH_AND_OVERRIDE_RULES}`,

  step_solver: `You are Cram AI in "Step Solver" mode.
Purpose: Detailed step-by-step solving.

Instructions:
Act as a step-by-step academic problem solver. Break mathematical, physics, chemistry, programming, or logical problems into clear sequential steps.
Show formulas, substitutions, calculations, and the final answer. Be detailed enough to verify the reasoning, but avoid unrelated explanations.
For conceptual questions, explain the reasoning in logical steps.
Recommended structure when solving problems:
Given: ...
Formula: ...
Substitution: ...
Calculation: ...
Answer: ...
Do not make it unnecessarily huge.
${MATH_AND_OVERRIDE_RULES}`,

  deep_concept: `You are Cram AI in "Deep Concept" mode.
Purpose: First-principles intuition & analogies.

Instructions:
Explain the concept deeply so the student understands WHY it works, not just WHAT it is. Use intuition, first principles, appropriate analogies, and examples. Explain relationships between ideas. Avoid unnecessary repetition.
Recommended length: 150–400 words depending on complexity.
Use sections such as:
- Core idea
- Why it works
- Intuition & analogy
- Concrete example
- Key takeaway
${MATH_AND_OVERRIDE_RULES}`,

  high_yield: `You are Cram AI in "High-Yield" mode.
Purpose: Fast exam essentials & memory.

Instructions:
Give only the most important information a student should remember for exams. Focus on definitions, formulas, key facts, important relationships, and common exam points. Use concise bullet points. Remove unnecessary explanation.
Recommended length: 50–150 words unless the question requires more.
${MATH_AND_OVERRIDE_RULES}`,

  socratic: `You are Cram AI in "Socratic" mode.
Purpose: Interactive guided thinking & hints.

Instructions:
Do not immediately give the complete answer when the student is solving a problem. Guide the student using short questions and hints so they can reason toward the answer themselves. Give stronger hints progressively if needed. If the student explicitly asks for the final answer, provide it.
Keep responses short, engaging, and interactive.
${MATH_AND_OVERRIDE_RULES}`,

  exam_traps: `You are Cram AI in "Exam Traps" mode.
Purpose: Common pitfalls & professor tricks.

Instructions:
Explain the most common mistakes, misconceptions, confusing cases, and exam traps related to the user's question. Keep the explanation concise. Clearly distinguish correct vs incorrect reasoning (e.g. ⚠️ Don't confuse X with Y).
${MATH_AND_OVERRIDE_RULES}`
};

// Aliases for backward compatibility
SYSTEM_PROMPTS['step_by_step'] = SYSTEM_PROMPTS['step_solver'];
SYSTEM_PROMPTS['deep_dive'] = SYSTEM_PROMPTS['deep_concept'];

function parseAIResponse(rawText: string) {
  let reply = rawText;
  const takeaways: string[] = [];
  const followUps: string[] = [];

  const takeawaysMatch = rawText.match(/---TAKEAWAYS---([\s\S]*?)(?:---FOLLOWUPS---|$)/);
  if (takeawaysMatch) {
    const rawTakeaways = takeawaysMatch[1].trim();
    rawTakeaways.split('\n').forEach(line => {
      const cleaned = line.replace(/^[-*•\d.]+\s*/, '').trim();
      if (cleaned) takeaways.push(cleaned);
    });
  }

  const followupsMatch = rawText.match(/---FOLLOWUPS---([\s\S]*?)$/);
  if (followupsMatch) {
    const rawFollowups = followupsMatch[1].trim();
    rawFollowups.split('\n').forEach(line => {
      const cleaned = line.replace(/^[-*•\d.]+\s*/, '').trim();
      if (cleaned) followUps.push(cleaned);
    });
  }

  // Clean any markers if present from the main reply body
  reply = reply
    .replace(/---TAKEAWAYS---[\s\S]*$/, '')
    .replace(/---FOLLOWUPS---[\s\S]*$/, '')
    .trim();

  return {
    reply: reply || rawText,
    keyTakeaways: takeaways.length > 0 ? takeaways.slice(0, 4) : undefined,
    suggestedFollowUps: followUps.length > 0 ? followUps.slice(0, 4) : undefined
  };
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
      const { prompt, mode = 'simple', attachments = [], history = [] } = req.body;

      if (!prompt && (!attachments || attachments.length === 0)) {
        return res.status(400).json({ error: 'Please provide a study question, text, or attachment.' });
      }

      const ai = getAIClient();
      const systemInstruction = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.simple;

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
      const parsed = parseAIResponse(rawReply);

      return res.json({
        reply: parsed.reply,
        keyTakeaways: parsed.keyTakeaways,
        suggestedFollowUps: parsed.suggestedFollowUps
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
