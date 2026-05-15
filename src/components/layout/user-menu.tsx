'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User, ScanLine, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function UserMenu({ email }: { email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch('/auth/sign-out', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="User menu"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'rounded-full',
        )}
      >
        <User className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-muted-foreground truncate text-xs">{email}</p>
        </div>

        <DropdownMenuSeparator />

        {/* Mobile-only nav — desktop has these in the navbar */}
        <DropdownMenuItem
          onClick={() => router.push('/scan')}
          className="md:hidden"
        >
          <ScanLine className="mr-2 size-4" />
          Scan
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push('/history')}
          className="md:hidden"
        >
          <Clock className="mr-2 size-4" />
          History
        </DropdownMenuItem>
        <DropdownMenuSeparator className="md:hidden" />

        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}