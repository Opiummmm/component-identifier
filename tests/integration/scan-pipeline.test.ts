import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ScanResultSchema } from '@/lib/ai/schemas';

const FIXTURE_PATH = resolve(
  __dirname,
  '../fixtures/sample-scan.json',
);

describe('Scan pipeline integration', () => {
  const raw = readFileSync(FIXTURE_PATH, 'utf-8');

  it('parses a realistic AI response cleanly', () => {
    const json = JSON.parse(raw);
    const result = ScanResultSchema.parse(json);
    expect(result.components).toHaveLength(2);
    expect(result.sceneType).toBe('pcb');
  });

  it('handles markdown-fenced responses (model wraps in ```json)', () => {
    const fenced = '```json\n' + raw + '\n```';
    // Mirror the extractJson logic
    const match = fenced.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    expect(match?.[1]).toBeTruthy();
    const result = ScanResultSchema.parse(JSON.parse(match![1]!));
    expect(result.sceneType).toBe('pcb');
  });

  it('handles responses with prose preamble', () => {
    const messy =
      'Here is the analysis:\n\n' + raw + '\n\nLet me know if you need more detail.';
    const first = messy.indexOf('{');
    const last = messy.lastIndexOf('}');
    expect(first).toBeGreaterThan(-1);
    expect(last).toBeGreaterThan(first);
    const json = JSON.parse(messy.slice(first, last + 1));
    const result = ScanResultSchema.parse(json);
    expect(result.components).toHaveLength(2);
  });

  it('rejects responses that violate the schema', () => {
    const broken = { ...JSON.parse(raw), sceneType: 'invalid-scene' };
    expect(() => ScanResultSchema.parse(broken)).toThrow();
  });
});