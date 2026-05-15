import { GoogleGenAI, type Part } from '@google/genai';
import { ScanResultSchema, type ScanResult } from './schemas';
import { SYSTEM_PROMPT } from './prompts';

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

// Comma-separated fallback chain. The client walks the list left-to-right,
// only falling through to the next model if the previous one exhausts retries.
const MODEL_CHAIN = (
  process.env.GEMINI_MODEL ??
  'gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const MAX_OUTPUT_TOKENS = 32_768;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

export type ImageMediaType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif';

export class IdentificationError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'IdentificationError';
  }
}

export class ResponseTruncatedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResponseTruncatedError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /503|429|500|UNAVAILABLE|RESOURCE_EXHAUSTED|INTERNAL|ECONNRESET|ETIMEDOUT|timeout/i.test(
    msg,
  );
}

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // fall through
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // fall through
    }
  }

  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) {
    return JSON.parse(text.slice(first, last + 1));
  }

  throw new Error('No valid JSON object found in model response');
}

async function callOnce(
  imageBase64: string,
  imageMediaType: ImageMediaType,
  model: string,
): Promise<ScanResult> {
  const parts: Part[] = [
    {
      inlineData: {
        mimeType: imageMediaType,
        data: imageBase64,
      },
    },
    {
      text: 'Identify all electronic components in this image. Return only the JSON object.',
    },
  ];

  const response = await genAI.models.generateContent({
    model,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason === 'MAX_TOKENS') {
    throw new ResponseTruncatedError(
      `Response truncated at ${MAX_OUTPUT_TOKENS} tokens. Scene may be too complex — try a less dense image, or increase the token budget.`,
    );
  }

  const text = response.text;
  if (!text) {
    throw new Error('Model returned no text content');
  }

  const raw = extractJson(text);
  return ScanResultSchema.parse(raw);
}

export async function identifyComponents(
  imageBase64: string,
  imageMediaType: ImageMediaType,
): Promise<ScanResult> {
  let lastError: unknown;

  for (let modelIndex = 0; modelIndex < MODEL_CHAIN.length; modelIndex++) {
    const model = MODEL_CHAIN[modelIndex]!;
    const isLastModel = modelIndex === MODEL_CHAIN.length - 1;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (modelIndex > 0 && attempt === 1) {
          console.warn(`[identifyComponents] falling back to ${model}`);
        }
        return await callOnce(imageBase64, imageMediaType, model);
      } catch (err) {
        lastError = err;

        // Truncation is not retryable on the same model. Try the next one —
        // sometimes a different model produces shorter (still valid) output.
        if (err instanceof ResponseTruncatedError) {
          console.warn(
            `[identifyComponents] ${model} truncated, advancing to next model`,
          );
          break;
        }

        const transient = isTransientError(err);
        const reason = transient ? 'transient' : 'parse/validation';

        // Non-transient errors: parse failure or schema mismatch. The same
        // model will almost certainly produce the same shape, so move on.
        if (!transient) {
          console.warn(
            `[identifyComponents] ${model} attempt ${attempt}/${MAX_RETRIES} failed (${reason}), advancing to next model`,
          );
          break;
        }

        // Transient: back off and retry the same model
        if (attempt < MAX_RETRIES) {
          const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
          console.warn(
            `[identifyComponents] ${model} attempt ${attempt}/${MAX_RETRIES} failed (${reason}), retrying in ${backoff}ms`,
          );
          await sleep(backoff);
        } else if (!isLastModel) {
          console.warn(
            `[identifyComponents] ${model} exhausted retries, falling back to next model`,
          );
        }
      }
    }
  }

  throw new IdentificationError(
    'All models failed after retries',
    lastError,
  );
}