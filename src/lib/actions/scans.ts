'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/db/server';
import type { ScanResult } from '@/lib/ai/schemas';

interface SaveScanInput {
  imageBase64: string;        // raw base64 (no data URL prefix)
  imageMediaType: string;     // 'image/jpeg' etc.
  result: ScanResult;
}

export async function saveScan(input: SaveScanInput): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const scanId = randomUUID();
  const ext = input.imageMediaType.split('/')[1] ?? 'jpg';
  const imagePath = `${user.id}/${scanId}.${ext}`;

  const buffer = Buffer.from(input.imageBase64, 'base64');
  const { error: uploadError } = await supabase.storage
    .from('component-images')
    .upload(imagePath, buffer, {
      contentType: input.imageMediaType,
      upsert: false,
    });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const avgConf = input.result.components.length
    ? input.result.components.reduce((s, c) => s + c.confidence, 0) /
      input.result.components.length
    : input.result.overallConfidence;

  const { error: insertError } = await supabase.from('scans').insert({
    id: scanId,
    user_id: user.id,
    image_path: imagePath,
    result: input.result,
    scene_type: input.result.sceneType,
    component_count: input.result.components.length,
    confidence: Number(avgConf.toFixed(2)),
  });

  if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

  revalidatePath('/history');
  return { id: scanId };
}

export async function deleteScan(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: scan } = await supabase
    .from('scans')
    .select('image_path')
    .eq('id', id)
    .single();

  if (scan?.image_path) {
    await supabase.storage.from('component-images').remove([scan.image_path]);
  }

  const { error } = await supabase.from('scans').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/history');
}

export async function deleteScans(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => deleteScan(id)));
  revalidatePath('/history');
}

export async function deleteScanAndRedirect(id: string): Promise<void> {
  await deleteScan(id);
  redirect('/history');
}