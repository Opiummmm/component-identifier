'use client';

import { cn } from '@/lib/utils';
import type { IdentifiedComponent } from '@/lib/ai/schemas';
import { ConfidenceBadge } from './confidence-badge';
import { CategoryChip } from './category-chip';

interface Props {
  components: IdentifiedComponent[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function ComponentList({
  components,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: Props) {
  return (
    <ul className="space-y-1">
      {components.map((c, i) => {
        const active = selectedId === c.id;
        const hover = hoveredId === c.id;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              onMouseEnter={() => onHover(c.id)}
              onMouseLeave={() => onHover(null)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all',
                active
                  ? 'border-primary bg-primary/5 shadow-soft'
                  : hover
                    ? 'border-border bg-card'
                    : 'border-transparent hover:border-border hover:bg-card/50',
              )}
            >
              <span className="text-muted-foreground w-6 shrink-0 text-center font-mono text-xs tabular-nums">
                {i + 1}
              </span>
              <CategoryChip category={c.category} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {c.identifiedAs}
                </div>
              </div>
              <ConfidenceBadge value={c.confidence} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}