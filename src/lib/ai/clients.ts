import { GoogleGenAI, type Part } from '@google/genai';
import { ScanResultSchema, type ScanResult } from './schemas';
import { SYSTEM_PROMPT } from './prompts';

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
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
    model: MODEL,
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

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callOnce(imageBase64, imageMediaType);
    } catch (err) {
      lastError = err;

      // Truncation is not retryable — the response is consistently too long
      if (err instanceof ResponseTruncatedError) {
        throw new IdentificationError(err.message, err);
      }

      if (attempt < MAX_RETRIES) {
        const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        const reason = isTransientError(err) ? 'transient' : 'parse/validation';
        console.warn(
          `[identifyComponents] attempt ${attempt}/${MAX_RETRIES} failed (${reason}), retrying in ${backoff}ms`,
        );
        await sleep(backoff);
      }
    }
  }

  throw new IdentificationError('Failed after retries', lastError);
}