'use client';

import * as React from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { ScanResult } from '@/lib/ai/schemas';

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load image for PDF');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface Props {
  result: ScanResult;
  imageUrl: string;
}

export function ExportPdfButton({ result, imageUrl }: Props) {
  const [loading, setLoading] = React.useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      // Dynamic import keeps @react-pdf out of the initial bundle
      const [{ pdf }, { ScanPDFDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./pdf-document'),
      ]);

      const imageDataUrl = await urlToDataUrl(imageUrl);

      const blob = await pdf(
        <ScanPDFDocument
          result={result}
          imageDataUrl={imageDataUrl}
          generatedAt={new Date()}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `component-scan-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('PDF exported');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'PDF export failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 size-4" />
      )}
      Export PDF
    </Button>
  );
}