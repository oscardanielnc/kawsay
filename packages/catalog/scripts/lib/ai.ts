/**
 * The AI client of the catalog scripts (ADR 0028): Gemini first (free tier allowed: no personal data), deepseek-flash
 * as fallback. JSON answers, cached on disk by prompt hash so a run can stop and resume; every call's tokens are
 * appended to .cache/usage.jsonl for the spend report. Keys come only from the environment and are never printed.
 */
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const cacheDir = new URL('.cache/ai/', root);
mkdirSync(cacheDir, { recursive: true });
const usageFile = new URL('.cache/usage.jsonl', root);

export const GEMINI_MODEL = 'gemini-3.5-flash-lite';
export const DEEPSEEK_MODEL = 'deepseek-flash';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function gemini(
  system: string,
  user: string,
): Promise<{ text: string; inTokens: number; outTokens: number }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(180_000),
    },
  );
  if (!response.ok) throw new Error(`gemini HTTP ${response.status}`);
  const body = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      thoughtsTokenCount?: number;
    };
  };
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  const u = body.usageMetadata ?? {};
  return {
    text,
    inTokens: u.promptTokenCount ?? 0,
    outTokens: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
  };
}

async function deepseek(
  system: string,
  user: string,
): Promise<{ text: string; inTokens: number; outTokens: number }> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY is not set');
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      reasoning_effort: 'none',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) throw new Error(`deepseek HTTP ${response.status}`);
  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  return {
    text: body.choices?.[0]?.message?.content ?? '',
    inTokens: body.usage?.prompt_tokens ?? 0,
    outTokens: body.usage?.completion_tokens ?? 0,
  };
}

/** One JSON answer for a prompt; cached by its hash. Gemini with backoff on 429/5xx, then deepseek-flash. */
export async function askJson(label: string, system: string, user: string): Promise<unknown> {
  const hash = createHash('sha256').update(`${system}\n---\n${user}`).digest('hex').slice(0, 24);
  const file = new URL(`${hash}.json`, cacheDir);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as unknown;

  let parsed: unknown;
  let provider = 'gemini';
  let answer: { text: string; inTokens: number; outTokens: number } | null;
  // Up to 3 Gemini answers that parse, each with backoff on 429/5xx; then deepseek-flash once.
  for (let tries = 0; tries < 3 && parsed === undefined; tries++) {
    answer = null;
    for (let attempt = 0; attempt < 5 && !answer; attempt++) {
      try {
        answer = await gemini(system, user);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown';
        if (!/HTTP (429|5\d\d)|timeout|fetch failed|aborted/i.test(message)) throw error;
        await sleep(Math.min(60_000, 5_000 * 2 ** attempt));
      }
    }
    if (!answer) break;
    logUsage(label, provider, answer);
    parsed = tryParse(answer.text);
  }
  if (parsed === undefined) {
    provider = 'deepseek';
    answer = await deepseek(system, user);
    logUsage(label, provider, answer);
    parsed = tryParse(answer.text);
    if (parsed === undefined) throw new Error(`${label}: no valid JSON from any model`);
  }
  writeFileSync(file, JSON.stringify(parsed));
  return parsed;
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function logUsage(
  label: string,
  provider: string,
  answer: { inTokens: number; outTokens: number },
) {
  const row = {
    at: new Date().toISOString(),
    label,
    provider,
    in: answer.inTokens,
    out: answer.outTokens,
  };
  appendFileSync(usageFile, `${JSON.stringify(row)}\n`);
}
