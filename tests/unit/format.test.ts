import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDistanceToNow } from '@/lib/format';

describe('formatDistanceToNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-14T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for under a minute', () => {
    expect(formatDistanceToNow(new Date('2026-05-14T11:59:30Z'))).toBe(
      'just now',
    );
  });

  it('returns minutes for under an hour', () => {
    expect(formatDistanceToNow(new Date('2026-05-14T11:45:00Z'))).toBe(
      '15m ago',
    );
  });

  it('returns hours for under a day', () => {
    expect(formatDistanceToNow(new Date('2026-05-14T05:00:00Z'))).toBe(
      '7h ago',
    );
  });

  it('returns days for under a month', () => {
    expect(formatDistanceToNow(new Date('2026-05-09T12:00:00Z'))).toBe(
      '5d ago',
    );
  });

  it('falls back to a locale date for older entries', () => {
    const result = formatDistanceToNow(new Date('2025-12-01T12:00:00Z'));
    expect(result).not.toMatch(/ago/);
    expect(result.length).toBeGreaterThan(0);
  });
});