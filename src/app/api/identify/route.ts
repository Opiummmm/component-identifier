import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import {
  identifyComponents,
  IdentificationError,
  type ImageMediaType,
} from '@/lib/ai/clients';
import { createClient } from '@/lib/db/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: ImageMediaType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const buckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
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

function jsonError(
  message: string,
  status: number,
  requestId: string,
): NextResponse {
  return NextResponse.json(
    { error: message, requestId },
    { status, headers: { 'X-Request-Id': requestId } },
  );
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const ip = clientIp(request);
  console.log(`[${requestId}] POST /api/identify from ${ip}`);

  // Auth gate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError('Unauthorized', 401, requestId);
  }

  if (!rateLimit(ip)) {
    return jsonError('Rate limit exceeded', 429, requestId);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError('Invalid multipart form data', 400, requestId);
  }

  const file = formData.get('image');
  if (!(file instanceof File)) {
    return jsonError('Field "image" missing or not a file', 400, requestId);
  }
  if (file.size === 0) {
    return jsonError('Image file is empty', 400, requestId);
  }
  if (file.size > MAX_FILE_SIZE) {
    return jsonError('Image exceeds 15mb limit', 413, requestId);
  }
  if (!ALLOWED_TYPES.includes(file.type as ImageMediaType)) {
    return jsonError(`Unsupported media type: ${file.type}`, 400, requestId);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const result = await identifyComponents(
      base64,
      file.type as ImageMediaType,
    );
    console.log(
      `[${requestId}] success — ${result.components.length} components, ${result.sceneType}`,
    );
    return NextResponse.json(
      { ...result, requestId },
      { status: 200, headers: { 'X-Request-Id': requestId } },
    );
  } catch (err) {
  console.error(`[${requestId}] identification failed:`, err);
  if (err instanceof IdentificationError) {
    // Check if it's an overload
    const msg = String(err.cause);
    if (/503|UNAVAILABLE|high demand|overloaded/i.test(msg)) {
      return jsonError(
        'The AI service is temporarily overloaded. Please try again in a minute.',
        503,
        requestId,
      );
    }
    return jsonError('Identification failed', 502, requestId);
  }
  return jsonError('Internal server error', 500, requestId);
}
}