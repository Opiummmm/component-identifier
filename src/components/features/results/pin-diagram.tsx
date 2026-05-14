import type { Pin } from '@/lib/ai/schemas';

interface Props {
  pins: Pin[];
  packageType?: string;
}

export function PinDiagram({ pins, packageType }: Props) {
  if (pins.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No pinout data available.</p>
    );
  }

  const sorted = [...pins].sort((a, b) => a.pin - b.pin);
  const total = sorted.length;
  const half = Math.ceil(total / 2);
  const left = sorted.slice(0, half);
  const right = sorted.slice(half).reverse();

  return (
    <div className="bg-muted/30 rounded-lg border p-6">
      {packageType && (
        <p className="text-muted-foreground mb-4 text-center text-xs">
          Package: <span className="font-mono">{packageType}</span>
        </p>
      )}
      <div className="mx-auto grid max-w-md grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 text-sm">
        {/* left column */}
        <div className="contents">
          {left.map((p) => (
            <div key={p.pin} className="contents">
              <span className="text-muted-foreground text-right font-mono text-xs tabular-nums">
                {p.pin}
              </span>
              <span className="bg-card flex items-center justify-between rounded-md border px-2.5 py-1.5">
                <span className="font-mono text-xs font-semibold">
                  {p.label}
                </span>
                <span className="text-muted-foreground ml-2 truncate text-xs">
                  {p.description}
                </span>
              </span>
              <span />
            </div>
          ))}
        </div>
      </div>
      {right.length > 0 && (
        <div className="mt-2 grid max-w-md grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 mx-auto text-sm">
          {right.map((p) => (
            <div key={p.pin} className="contents">
              <span />
              <span className="bg-card flex items-center justify-between rounded-md border px-2.5 py-1.5">
                <span className="text-muted-foreground mr-2 truncate text-xs">
                  {p.description}
                </span>
                <span className="font-mono text-xs font-semibold">
                  {p.label}
                </span>
              </span>
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {p.pin}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}