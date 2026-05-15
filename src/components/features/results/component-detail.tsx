'use client';

import * as React from 'react';
import { Copy, ExternalLink, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { IdentifiedComponent } from '@/lib/ai/schemas';
import { CATEGORY_META } from '@/lib/categories';
import { CategoryChip } from './category-chip';
import { ConfidenceBadge } from './confidence-badge';
import { PinDiagram } from './pin-diagram';
import { ComponentQa } from './component-qa';
import { cn } from '@/lib/utils';

type TabId = 'overview' | 'specs' | 'pinout' | 'uses' | 'ask';

interface Tab {
  id: TabId;
  label: string;
  icon?: React.ReactNode;
}

export function ComponentDetail({ component: c }: { component: IdentifiedComponent }) {
  const hasPinout = c.pinout && c.pinout.length > 0;

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'specs', label: 'Specs' },
    ...(hasPinout ? [{ id: 'pinout' as TabId, label: 'Pinout' }] : []),
    { id: 'uses', label: 'Uses' },
    {
      id: 'ask',
      label: 'Ask',
      icon: <MessageSquare className="size-3" />,
    },
  ];

  const [active, setActive] = React.useState<TabId>('overview');

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}`);
  }

  const datasheetUrl = `https://www.google.com/search?q=${encodeURIComponent(c.datasheetSearchQuery)}`;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-start gap-3">
          <CategoryChip category={c.category} />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold leading-tight">
              {c.identifiedAs}
            </h3>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span>{CATEGORY_META[c.category].label}</span>
              {c.packageType && (
                <>
                  <span>·</span>
                  <span className="font-mono">{c.packageType}</span>
                </>
              )}
            </div>
          </div>
          <ConfidenceBadge value={c.confidence} />
        </div>

        {c.warnings && c.warnings.length > 0 && (
          <div className="bg-warning/10 border-warning/30 text-warning rounded-md border px-3 py-2 text-xs">
            {c.warnings.join(' · ')}
          </div>
        )}
      </header>

      {/* Segmented tab bar */}
      <div
        role="tablist"
        className="bg-muted flex w-full gap-1 rounded-lg p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all',
              active === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div role="tabpanel">
        {active === 'overview' && (
          <div className="space-y-4">
            {c.markings.length > 0 && (
              <Section title="Markings">
                <div className="flex flex-wrap gap-1.5">
                  {c.markings.map((m, i) => (
                    <code
                      key={i}
                      onClick={() => copy(m, 'marking')}
                      className="bg-muted hover:bg-muted/70 cursor-pointer rounded px-2 py-0.5 font-mono text-xs"
                    >
                      {m}
                    </code>
                  ))}
                </div>
              </Section>
            )}

            {c.datasheetSearchQuery && (
              <Section title="Datasheet">
                <a
                  href={datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                >
                  Search: {c.datasheetSearchQuery}
                  <ExternalLink className="size-3" />
                </a>
              </Section>
            )}

            {c.alternatives.length > 0 && (
              <Section title="Alternatives">
                <ul className="space-y-1 text-sm">
                  {c.alternatives.map((a, i) => (
                    <li key={i} className="text-muted-foreground">
                      · {a}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {c.markings.length === 0 &&
              !c.datasheetSearchQuery &&
              c.alternatives.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No overview details available for this component.
                </p>
              )}
          </div>
        )}

        {active === 'specs' && (
          <div>
            {Object.keys(c.specifications).length > 0 ? (
              <dl className="divide-y rounded-lg border">
                {Object.entries(c.specifications).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                  >
                    <dt className="text-muted-foreground capitalize">{k}</dt>
                    <dd className="flex items-center gap-2">
                      <span className="font-mono">{v}</span>
                      <button
                        onClick={() => copy(v, k)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Copy ${k}`}
                      >
                        <Copy className="size-3" />
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">
                No specifications available.
              </p>
            )}
          </div>
        )}

        {active === 'pinout' && hasPinout && (
          <PinDiagram pins={c.pinout!} packageType={c.packageType} />
        )}

        {active === 'uses' && (
          <div className="space-y-4">
            {c.commonUses.length > 0 && (
              <Section title="Common uses">
                <ul className="space-y-1 text-sm">
                  {c.commonUses.map((u, i) => (
                    <li key={i} className="text-muted-foreground">
                      · {u}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {c.typicalCircuits.length > 0 && (
              <Section title="Typical circuits">
                <ul className="space-y-1 text-sm">
                  {c.typicalCircuits.map((u, i) => (
                    <li key={i} className="text-muted-foreground">
                      · {u}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {c.commonUses.length === 0 && c.typicalCircuits.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No usage data available.
              </p>
            )}
          </div>
        )}

        {active === 'ask' && <ComponentQa key={c.id} component={c} />}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wider">
        {title}
      </h4>
      {children}
    </div>
  );
}