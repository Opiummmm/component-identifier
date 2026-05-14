import { describe, it, expect } from 'vitest';
import {
  ScanResultSchema,
  IdentifiedComponentSchema,
  BoundingBoxSchema,
} from '@/lib/ai/schemas';

const validBox = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };

const validComponent = {
  id: 'c1',
  identifiedAs: '1kΩ Carbon Film Resistor',
  category: 'resistor' as const,
  confidence: 0.92,
  boundingBox: validBox,
  markings: ['brown', 'black', 'red'],
  specifications: { resistance: '1 kΩ', tolerance: '±5%' },
  commonUses: ['Pull-up'],
  typicalCircuits: ['I²C SDA pull-up to 5V'],
  alternatives: ['Any 1kΩ ±5% 1/4W resistor'],
  datasheetSearchQuery: '1kΩ carbon film resistor datasheet',
};

describe('BoundingBoxSchema', () => {
  it('accepts values in [0, 1]', () => {
    expect(BoundingBoxSchema.parse(validBox)).toEqual(validBox);
  });

  it('rejects x < 0', () => {
    expect(() =>
      BoundingBoxSchema.parse({ ...validBox, x: -0.1 }),
    ).toThrow();
  });

  it('rejects width > 1', () => {
    expect(() =>
      BoundingBoxSchema.parse({ ...validBox, width: 1.5 }),
    ).toThrow();
  });
});

describe('IdentifiedComponentSchema', () => {
  it('parses a complete component', () => {
    expect(() => IdentifiedComponentSchema.parse(validComponent)).not.toThrow();
  });

  it('accepts component without pinout (optional)', () => {
    const { ...withoutPinout } = validComponent;
    expect(() => IdentifiedComponentSchema.parse(withoutPinout)).not.toThrow();
  });

  it('rejects unknown category', () => {
    expect(() =>
      IdentifiedComponentSchema.parse({
        ...validComponent,
        category: 'unobtainium',
      }),
    ).toThrow();
  });

  it('rejects confidence > 1', () => {
    expect(() =>
      IdentifiedComponentSchema.parse({ ...validComponent, confidence: 1.5 }),
    ).toThrow();
  });

  it('rejects negative confidence', () => {
    expect(() =>
      IdentifiedComponentSchema.parse({ ...validComponent, confidence: -0.1 }),
    ).toThrow();
  });
});

describe('ScanResultSchema', () => {
  it('parses a single-component scan', () => {
    const result = ScanResultSchema.parse({
      sceneType: 'single-component',
      components: [validComponent],
      overallConfidence: 0.92,
    });
    expect(result.components).toHaveLength(1);
    expect(result.sceneNotes).toBeUndefined();
  });

  it('parses a multi-component PCB scan', () => {
    const result = ScanResultSchema.parse({
      sceneType: 'pcb',
      components: [
        validComponent,
        { ...validComponent, id: 'c2', category: 'ic' },
        { ...validComponent, id: 'c3', category: 'capacitor' },
      ],
      overallConfidence: 0.85,
      sceneNotes: 'Arduino Uno R3 layout',
    });
    expect(result.components).toHaveLength(3);
    expect(result.sceneNotes).toBe('Arduino Uno R3 layout');
  });

  it('accepts an empty components array', () => {
    expect(() =>
      ScanResultSchema.parse({
        sceneType: 'mixed',
        components: [],
        overallConfidence: 0.0,
      }),
    ).not.toThrow();
  });

  it('rejects invalid sceneType', () => {
    expect(() =>
      ScanResultSchema.parse({
        sceneType: 'circuit',
        components: [],
        overallConfidence: 0.5,
      }),
    ).toThrow();
  });
});