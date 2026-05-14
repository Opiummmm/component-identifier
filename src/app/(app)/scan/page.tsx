import { ScannerClient } from '@/components/features/scanner/scanner-client';

export default function ScanPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-balance text-3xl font-bold tracking-tight">
          Scan a component
        </h1>
        <p className="text-muted-foreground mt-2 text-balance">
          Upload or capture a photo of a single part, breadboard, or PCB.
          We'll identify everything we can see.
        </p>
      </div>
      <ScannerClient />
    </div>
  );
}