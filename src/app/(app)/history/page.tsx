import Link from 'next/link';
import { ImageOff, ScanSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/db/server';
import { CategoryChip } from '@/components/features/results/category-chip';
import { ConfidenceBadge } from '@/components/features/results/confidence-badge';
import { formatDistanceToNow } from '@/lib/format';

interface ScanRow {
  id: string;
  image_path: string;
  scene_type: string | null;
  component_count: number | null;
  confidence: number | null;
  created_at: string;
  result: {
    sceneType: string;
    components: Array<{ category: string; identifiedAs: string }>;
    sceneNotes?: string;
  };
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: scans } = await supabase
    .from('scans')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<ScanRow[]>();

  if (!scans || scans.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="bg-muted text-muted-foreground mx-auto mb-6 grid size-16 place-items-center rounded-full">
          <ScanSearch className="size-7" />
        </div>
        <h1 className="text-2xl font-bold">No scans yet</h1>
        <p className="text-muted-foreground mt-2">
          Your saved component scans will appear here.
        </p>
        <Button asChild className="mt-6">
          <Link href="/scan">Start scanning</Link>
        </Button>
      </div>
    );
  }

  const signedUrls = await Promise.all(
    scans.map(async (s) => {
      const { data } = await supabase.storage
        .from('component-images')
        .createSignedUrl(s.image_path, 3600);
      return data?.signedUrl ?? null;
    }),
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground mt-1">
            {scans.length} {scans.length === 1 ? 'scan' : 'scans'} saved
          </p>
        </div>
        <Button asChild>
          <Link href="/scan">New scan</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scans.map((scan, i) => {
          const url = signedUrls[i];
          const cats = new Set(scan.result.components.map((c) => c.category));
          return (
            <Link
              key={scan.id}
              href={`/components/${scan.id}`}
              className="group bg-card overflow-hidden rounded-xl border transition-all hover:shadow-elevated"
            >
              <div className="bg-muted relative aspect-4/3 overflow-hidden">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt=""
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <ImageOff className="text-muted-foreground size-8" />
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  {scan.confidence !== null && (
                    <ConfidenceBadge value={scan.confidence} />
                  )}
                </div>
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {scan.component_count}{' '}
                    {scan.component_count === 1 ? 'component' : 'components'}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(scan.created_at))}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(cats)
                    .slice(0, 6)
                    .map((cat) => (
                      <CategoryChip
                        key={cat}
                        category={cat as never}
                        size="sm"
                      />
                    ))}
                </div>
                {scan.result.sceneNotes && (
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {scan.result.sceneNotes}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}