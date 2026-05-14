'use client';

import * as React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const STAGES = [
  'Scanning scene…',
  'Detecting components…',
  'Reading markings…',
  'Decoding packages…',
  'Looking up specifications…',
  'Almost there…',
];

export function ScanProgress() {
  const [stage, setStage] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setStage((s) => (s + 1) % STAGES.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-card flex flex-col items-center gap-4 rounded-xl border p-12 shadow-soft">
      <div className="relative">
        <div className="bg-primary/10 grid size-16 place-items-center rounded-full">
          <Sparkles className="text-primary size-6" />
        </div>
        <Loader2 className="text-primary absolute inset-0 size-16 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-base font-medium" key={stage}>
          {STAGES[stage]}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          This usually takes 10–30 seconds
        </p>
      </div>
    </div>
  );
}