import type { ComponentCategory } from '@/lib/ai/schemas';

interface CategoryMeta {
  label: string;        // Display name
  short: string;        // Short ref (e.g., "R" for marker dots)
  hue: number;          // OKLCH hue for color tokens
}

export const CATEGORY_META: Record<ComponentCategory, CategoryMeta> = {
  resistor:    { label: 'Resistor',    short: 'R',  hue: 30  },
  capacitor:   { label: 'Capacitor',   short: 'C',  hue: 220 },
  inductor:    { label: 'Inductor',    short: 'L',  hue: 290 },
  diode:       { label: 'Diode',       short: 'D',  hue: 145 },
  transistor:  { label: 'Transistor',  short: 'Q',  hue: 0   },
  ic:          { label: 'IC',          short: 'U',  hue: 70  },
  connector:   { label: 'Connector',   short: 'J',  hue: 190 },
  sensor:      { label: 'Sensor',      short: 'S',  hue: 165 },
  switch:      { label: 'Switch',      short: 'SW', hue: 250 },
  led:         { label: 'LED',         short: 'LD', hue: 95  },
  crystal:     { label: 'Crystal',     short: 'Y',  hue: 270 },
  other:       { label: 'Other',       short: '?',  hue: 0   },
};

export function categoryColor(category: ComponentCategory, alpha = 1): string {
  const { hue } = CATEGORY_META[category];
  if (category === 'other') return `oklch(0.6 0 0 / ${alpha})`;
  return `oklch(0.72 0.16 ${hue} / ${alpha})`;
}

export function categoryColorDeep(category: ComponentCategory): string {
  const { hue } = CATEGORY_META[category];
  if (category === 'other') return `oklch(0.45 0 0)`;
  return `oklch(0.55 0.18 ${hue})`;
}