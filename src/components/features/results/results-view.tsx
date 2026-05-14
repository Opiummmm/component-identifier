'use client';

import * as React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ScanResult } from '@/lib/ai/schemas';
import { AnnotatedScene } from './annotated-scene';
import { ComponentList } from './component-list';
import { ComponentDetail } from './component-detail';
import { ExportBomButton } from './export-bom';

interface Props {
  imageUrl: string;
  result: ScanResult;
}

export function ResultsView({ imageUrl, result }: Props) {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    result.components.length === 1 ? result.components[0]!.id : null,
  );
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const selected = result.components.find((c) => c.id === selectedId);
  const isSingle = result.components.length === 1;

  // For single-component scans, skip the scene and show detail directly
  if (isSingle && selected) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="bg-card overflow-hidden rounded-xl border shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Component"
            className="max-h-[60vh] w-full object-contain"
          />
        </div>
        <div className="bg-card rounded-xl border p-6 shadow-soft">
          <ComponentDetail component={selected} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <AnnotatedScene
          imageUrl={imageUrl}
          components={result.components}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={setSelectedId}
          onHover={setHoveredId}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Components</h3>
            <div className="flex gap-1">
              <ExportBomButton result={result} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="mr-2 size-4" />
                Print
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[60vh]">
            <ComponentList
              components={result.components}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={setSelectedId}
              onHover={setHoveredId}
            />
          </ScrollArea>
        </div>
      </div>

      <Sheet
        open={selected !== undefined}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="sr-only">
            <SheetTitle>Component detail</SheetTitle>
          </SheetHeader>
          {selected && <ComponentDetail component={selected} />}
        </SheetContent>
      </Sheet>
    </>
  );
}