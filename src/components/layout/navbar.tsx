import Link from 'next/link';
import { Cpu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/db/server';
import { UserMenu } from './user-menu';

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md">
            <Cpu className="size-4" />
          </div>
          <span className="tracking-tight">Componently</span>
        </Link>

        {user && (
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <Link
              href="/scan"
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 transition-colors"
            >
              Scan
            </Link>
            <Link
              href="/history"
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 transition-colors"
            >
              History
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <UserMenu email={user.email ?? ''} />
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}