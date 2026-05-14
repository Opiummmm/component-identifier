import { z } from 'zod';

export const ComponentCategorySchema = z.enum([
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
]);

export const SceneTypeSchema = z.enum([
  'single-component',
  'pcb',
  'breadboard',
  'schematic',
  'mixed',
]);

export const BoundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export const PinSchema = z.object({
  pin: z.number().int().positive(),
  label: z.string(),
  description: z.string(),
});

export const IdentifiedComponentSchema = z.object({
  id: z.string(),
  identifiedAs: z.string(),
  category: ComponentCategorySchema,
  confidence: z.number().min(0).max(1),
  boundingBox: BoundingBoxSchema,
  markings: z.array(z.string()),
  specifications: z.record(z.string(), z.string()),
  pinout: z.array(PinSchema).optional(),
  packageType: z.string().optional(),
  commonUses: z.array(z.string()),
  typicalCircuits: z.array(z.string()),
  alternatives: z.array(z.string()),
  datasheetSearchQuery: z.string(),
  warnings: z.array(z.string()).optional(),
});

export const ScanResultSchema = z.object({
  sceneType: SceneTypeSchema,
  components: z.array(IdentifiedComponentSchema),
  overallConfidence: z.number().min(0).max(1),
  sceneNotes: z.string().optional(),
});

export type ComponentCategory = z.infer<typeof ComponentCategorySchema>;
export type SceneType = z.infer<typeof SceneTypeSchema>;
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;
export type Pin = z.infer<typeof PinSchema>;
export type IdentifiedComponent = z.infer<typeof IdentifiedComponentSchema>;
export type ScanResult = z.infer<typeof ScanResultSchema>;