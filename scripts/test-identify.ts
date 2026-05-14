import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  identifyComponents,
  type ImageMediaType,
} from '@/lib/ai/clients';

interface Sample {
  name: string;
  path: string;
  mediaType: ImageMediaType;
}

const SAMPLES: Sample[] = [
  { name: 'Single component', path: 'samples/single.png', mediaType: 'image/png' },
  { name: 'Breadboard',       path: 'samples/breadboard.jpg', mediaType: 'image/jpeg' },
  { name: 'PCB',              path: 'samples/pcb.jpg', mediaType: 'image/jpeg' },
];

async function run(sample: Sample): Promise<void> {
  const full = resolve(process.cwd(), sample.path);
  if (!existsSync(full)) {
    console.warn(`⚠️  Skipping "${sample.name}" — file not found at ${sample.path}`);
    return;
  }

  console.log(`\n🔍 ${sample.name}`);
  console.log('─'.repeat(60));

  const base64 = readFileSync(full).toString('base64');
  const start = Date.now();

  try {
    const result = await identifyComponents(base64, sample.mediaType);
    const ms = Date.now() - start;

    console.log(`✅ ${ms}ms`);
    console.log(`Scene type:        ${result.sceneType}`);
    console.log(`Components:        ${result.components.length}`);
    console.log(`Overall confidence: ${(result.overallConfidence * 100).toFixed(0)}%`);
    if (result.sceneNotes) console.log(`Notes:             ${result.sceneNotes}`);

    result.components.forEach((c, i) => {
      const conf = (c.confidence * 100).toFixed(0);
      const bb = c.boundingBox;
      console.log(
        `  ${String(i + 1).padStart(2)}. ${c.identifiedAs}`,
      );
      console.log(
        `      ${c.category} · ${conf}% · bbox(${bb.x.toFixed(2)}, ${bb.y.toFixed(2)}, ${bb.width.toFixed(2)}, ${bb.height.toFixed(2)})`,
      );
    });
  } catch (err) {
    console.error(`❌ Failed:`, err);
  }
}

async function main(): Promise<void> {
  if (!process.env.GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_API_KEY not set in .env.local');
    process.exit(1);
  }
  for (const sample of SAMPLES) {
    await run(sample);
  }
  console.log('\n✨ Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});