import { cn } from '@/lib/utils';

interface Props {
  value: number;       // 0–1
  className?: string;
}

export function ConfidenceBadge({ value, className }: Props) {
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.8
      ? 'bg-success/10 text-success border-success/20'
      : value >= 0.6
        ? 'bg-warning/10 text-warning border-warning/30'
        : 'bg-muted text-muted-foreground border-border';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs tabular-nums',
        tone,
        className,
      )}
    >
      {pct}%
    </span>
  );
}