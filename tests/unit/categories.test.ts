import { describe, it, expect } from 'vitest';
import {
  CATEGORY_META,
  categoryColor,
  categoryColorDeep,
} from '@/lib/categories';
import type { ComponentCategory } from '@/lib/ai/schemas';

const ALL_CATEGORIES: ComponentCategory[] = [
  'resistor',
  'capacitor',
  'inductor',
  'diode',
  'transistor',
  'ic',
  'connector',
  'sensor',
  'switch',
  'led',
  'crystal',
  'other',
];

describe('CATEGORY_META', () => {
  it('has an entry for every category', () => {
    ALL_CATEGORIES.forEach((cat) => {
      expect(CATEGORY_META[cat]).toBeDefined();
      expect(CATEGORY_META[cat].label).toBeTruthy();
      expect(CATEGORY_META[cat].short).toBeTruthy();
    });
  });

  it('has unique short labels (except "other")', () => {
    const shorts = ALL_CATEGORIES.filter((c) => c !== 'other').map(
      (c) => CATEGORY_META[c].short,
    );
    expect(new Set(shorts).size).toBe(shorts.length);
  });
});

describe('categoryColor', () => {
  it('returns an oklch string', () => {
    const color = categoryColor('resistor');
    expect(color).toMatch(/^oklch\(/);
  });

  it('returns a grayscale color for "other"', () => {
    const color = categoryColor('other');
    expect(color).toContain('0 0');
  });

  it('respects alpha argument', () => {
    const color = categoryColor('ic', 0.5);
    expect(color).toContain('0.5');
  });
});

describe('categoryColorDeep', () => {
  it('returns a deeper variant than categoryColor', () => {
    const light = categoryColor('resistor');
    const deep = categoryColorDeep('resistor');
    expect(deep).not.toBe(light);
    expect(deep).toMatch(/^oklch\(/);
  });
});