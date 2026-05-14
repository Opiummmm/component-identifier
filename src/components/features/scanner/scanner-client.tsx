'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, RotateCcw, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UploadZone } from './upload-zone';
import { CameraCapture } from './camera-capture';
import { ScanProgress } from './scan-progress';
import { ResultsView } from '@/components/features/results/results-view';
import { ScanResultSchema, type ScanResult } from '@/lib/ai/schemas';
import { saveScan } from '@/lib/actions/scans';

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let bin = '';
  new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

async function resizeImage(file: File, maxEdge = 1600): Promise<File> {
  // Skip resize for small files — not worth the canvas work.
  if (file.size < 1_500_000) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  if (scale === 1) return file;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise<File>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(file);
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.88,
    );
  });
}

export function ScannerClient() {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [status, setStatus] =
    React.useState<'idle' | 'identifying' | 'done' | 'error'>('idle');
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [saving, setSaving] = React.useState(false);

  function handleFile(f: File) {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setStatus('idle');
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setStatus('idle');
  }

  async function identify() {
    if (!file) return;
    setStatus('identifying');
    try {
      const resized = await resizeImage(file);
      const form = new FormData();
      form.append('image', resized);
      const res = await fetch('/api/identify', { method: 'POST', body: form });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Request failed (${res.status})`);
      }

      const json = await res.json();
      const parsed = ScanResultSchema.parse(json);
      setResult(parsed);
      setStatus('done');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Identification failed');
      setStatus('error');
    }
  }

  async function save() {
    if (!file || !result) return;
    setSaving(true);
    try {
      const resized = await resizeImage(file);
      const base64 = await fileToBase64(resized);
      const { id } = await saveScan({
        imageBase64: base64,
        imageMediaType: resized.type,
        result,
      });
      toast.success('Saved to history');
      router.push(`/components/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {status !== 'done' && (
        <UploadZone
          onFile={handleFile}
          onCamera={() => setCameraOpen(true)}
          file={file}
          previewUrl={previewUrl}
          onClear={reset}
          disabled={status === 'identifying'}
        />
      )}

      {file && status === 'idle' && (
        <div className="flex justify-center">
          <Button onClick={identify} size="lg" className="shadow-glow">
            <Sparkles className="mr-2 size-4" />
            Identify components
          </Button>
        </div>
      )}

      {status === 'identifying' && <ScanProgress />}

      {status === 'done' && result && previewUrl && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                {result.components.length}{' '}
                {result.components.length === 1 ? 'component' : 'components'}{' '}
                identified
              </h2>
              {result.sceneNotes && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {result.sceneNotes}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="mr-2 size-4" />
                Scan another
              </Button>
              <Button onClick={save} disabled={saving}>
                <Bookmark className="mr-2 size-4" />
                {saving ? 'Saving…' : 'Save to history'}
              </Button>
            </div>
          </div>

          <ResultsView imageUrl={previewUrl} result={result} />
        </div>
      )}

      <CameraCapture
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={handleFile}
      />
    </div>
  );
}