'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { ScanResult } from '@/lib/ai/schemas';

export function ExportBomButton({ result }: { result: ScanResult }) {
  function exportCsv() {
    const headers = [
      'Ref',
      'Identified As',
      'Category',
      'Confidence',
      'Package',
      'Markings',
      'Datasheet Query',
    ];

    const rows = result.components.map((c, i) => [
      `${c.category.charAt(0).toUpperCase()}${i + 1}`,
      c.identifiedAs,
      c.category,
      c.confidence.toFixed(2),
      c.packageType ?? '',
      c.markings.join(' '),
      c.datasheetSearchQuery,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bom-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('BOM exported');
  }

  return (
    <Button variant="outline" size="sm" onClick={exportCsv}>
      <Download className="mr-2 size-4" />
      Export BOM
    </Button>
  );
}