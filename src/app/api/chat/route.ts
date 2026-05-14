import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { IdentifiedComponentSchema } from '@/lib/ai/schemas';
import { buildChatSystemPrompt } from '@/lib/ai/chat-prompt';
import { createClient } from '@/lib/db/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

const ChatRequestSchema = z.object({
  component: IdentifiedComponentSchema,
  messages: z.array(ChatMessageSchema).min(1).max(20),
});

// Rate limit — generous on chat since it's per-question
const buckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_LIMIT) return false;
  b.count += 1;
  return true;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'anonymous';
}

function jsonError(message: string, status: number, requestId: string) {
  return NextResponse.json(
    { error: message, requestId },
    { status, headers: { 'X-Request-Id': requestId } },
  );
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const ip = clientIp(request);
  console.log(`[${requestId}] POST /api/chat from ${ip}`);

  // Auth gate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError('Unauthorized', 401, requestId);

  if (!rateLimit(ip)) return jsonError('Rate limit exceeded', 429, requestId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400, requestId);
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Invalid request shape', 400, requestId);
  }

  const { component, messages } = parsed.data;

  // Gemini uses 'model' instead of 'assistant'
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const stream = await genAI.models.generateContentStream({
      model: MODEL,
      contents,
      config: {
        systemInstruction: buildChatSystemPrompt(component),
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          console.error(`[${requestId}] stream error:`, err);
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Request-Id': requestId,
      },
    });
  } catch (err) {
    console.error(`[${requestId}] chat failed:`, err);
    return jsonError('Chat failed', 502, requestId);
  }
}