import Link from 'next/link';
import { Code2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="text-muted-foreground container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm md:flex-row">
        <p>
          Software Engineering CA · Electronic & Computer
          Engineering
        </p>
        <Link
          href="https://github.com/Opiummmm/component-identifier"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <Code2 className="size-4" />
          Source
        </Link>
      </div>
    </footer>
  );
}