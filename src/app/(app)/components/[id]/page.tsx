import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/db/server';
import { ScanResultSchema } from '@/lib/ai/schemas';
import { ResultsView } from '@/components/features/results/results-view';
import { deleteScanAndRedirect } from '@/lib/actions/scans';
import { formatDistanceToNow } from '@/lib/format';

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: scan, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !scan) notFound();

  const { data: signed } = await supabase.storage
    .from('component-images')
    .createSignedUrl(scan.image_path, 3600);

  if (!signed?.signedUrl) notFound();

  const result = ScanResultSchema.parse(scan.result);

  async function handleDelete() {
    'use server';
    await deleteScanAndRedirect(id);
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/history">
            <ArrowLeft className="mr-2 size-4" />
            History
          </Link>
        </Button>
        <form action={handleDelete}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
        </form>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {result.components.length}{' '}
          {result.components.length === 1 ? 'component' : 'components'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Scanned {formatDistanceToNow(new Date(scan.created_at))}
          {result.sceneNotes && ` · ${result.sceneNotes}`}
        </p>
      </div>

      <ResultsView imageUrl={signed.signedUrl} result={result} />
    </div>
  );
}