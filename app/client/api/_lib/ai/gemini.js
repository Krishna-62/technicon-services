import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.5-flash-lite';

// Lazily constructed (not at module-import time) so a missing GEMINI_API_KEY produces a clean,
// caught error only when the assistant is actually used, rather than crashing the whole server at
// boot the way a missing DATABASE_URL intentionally does for the DB pool — this feature is new and
// non-essential to the rest of the app, so it should degrade gracefully, not take the server down.
let client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

// Two-turn function-calling exchange: turn 1 lets the model either answer directly (no tool
// matched) or request exactly one of the whitelisted tools; turn 2 feeds the tool's real,
// backend-computed result back so the model's final answer is grounded in actual data it was
// actually given, never in anything it produced on its own in turn 1.
//
// `history` (optional) is a short list of prior {role: 'user'|'model', text} turns from THIS
// conversation, prepended to give the model enough context to resolve follow-up references
// ("that", "January", "what about 2023") in natural language. It only ever carries the previous
// human-readable question/answer text — never raw tool data — so context length stays small and
// tool authorization for the CURRENT turn still goes through the exact same executeToolFn choke
// point regardless of what the history contains.
export async function askGemini({ question, systemInstruction, toolDeclarations, executeToolFn, history }) {
  const ai = getClient();
  const config = {
    systemInstruction,
    tools: [{ functionDeclarations: toolDeclarations }],
    temperature: 0.2,
  };

  const historyContents = (history || []).map((h) => ({ role: h.role, parts: [{ text: h.text }] }));
  const userTurn = { role: 'user', parts: [{ text: question }] };

  const turn1 = await ai.models.generateContent({
    model: MODEL,
    contents: [...historyContents, userTurn],
    config,
  });

  const call = turn1.functionCalls?.[0];
  if (!call) {
    return { text: turn1.text || '', intent: null, data: null, label: null, toolParams: null };
  }

  const { label, params, data } = await executeToolFn(call.name, call.args);

  const turn2 = await ai.models.generateContent({
    model: MODEL,
    contents: [
      ...historyContents,
      userTurn,
      turn1.candidates[0].content,
      { role: 'user', parts: [{ functionResponse: { name: call.name, response: data } }] },
    ],
    config,
  });

  return { text: turn2.text || '', intent: call.name, data, label, toolParams: params };
}
