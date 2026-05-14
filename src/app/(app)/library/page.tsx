import { Construction } from 'lucide-react';

export default function LibraryPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="bg-muted text-muted-foreground mx-auto mb-6 grid size-16 place-items-center rounded-full">
        <Construction className="size-7" />
      </div>
      <h1 className="text-2xl font-bold">Library coming soon</h1>
      <p className="text-muted-foreground mt-2">
        A public gallery of anonymized scans is on the roadmap.
      </p>
    </div>
  );
}