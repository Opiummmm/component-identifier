import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/db/server';
import { streamComponentQa, type QaMessage } from '@/lib/ai/qa';
import { IdentifiedComponentSchema } from '@/lib/ai/schemas';

export const runtime = 'nodejs';
export const maxDuration = 30;

const QaMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const RequestSchema = z.object({
  component: IdentifiedComponentSchema,
  history: z.array(QaMessageSchema).max(20),
  question: z.string().min(1).max(500),
});

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

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const ip = clientIp(request);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', requestId },
      { status: 401 },
    );
  }

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', requestId },
      { status: 429 },
    );
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body', requestId },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = streamComponentQa(
          body.component,
          body.history as QaMessage[],
          body.question,
        );
        for await (const chunk of generator) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        console.error(`[${requestId}] QA stream failed:`, err);
        controller.enqueue(
          encoder.encode('\n\n[Error: response interrupted]'),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Request-Id': requestId,
      'Cache-Control': 'no-store',
    },
  });
}