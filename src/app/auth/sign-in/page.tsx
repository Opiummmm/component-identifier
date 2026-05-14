'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/db/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/scan';
  const supabase = createClient();

  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);

  async function handleGoogle() {
    setLoading('google');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(null);
    }
  }

  async function handleEmail() {
    setLoading('email');
    const action =
      mode === 'sign-in'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await action;

    if (error) {
      toast.error(error.message);
      setLoading(null);
      return;
    }

    if (mode === 'sign-up') {
      toast.success('Check your email to confirm your account.');
      setLoading(null);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  const passwordOk =
    mode === 'sign-up' ? password.length >= 6 : password.length > 0;
  const canSubmit = loading === null && email.length > 0 && passwordOk;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Welcome</CardTitle>
        <CardDescription>
          Sign in to scan, save, and revisit components.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={loading !== null}
        >
          {loading === 'google' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card text-muted-foreground px-2">or</span>
          </div>
        </div>

        {/* Segmented toggle */}
        <div className="bg-muted grid grid-cols-2 gap-1 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('sign-in')}
            className={cn(
              'rounded-md py-1.5 text-sm font-medium transition-all',
              mode === 'sign-in'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('sign-up')}
            className={cn(
              'rounded-md py-1.5 text-sm font-medium transition-all',
              mode === 'sign-up'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Sign up
          </button>
        </div>

        {/* Single form for both modes */}
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading !== null}
          />
          <Input
            type="password"
            placeholder={
              mode === 'sign-up' ? 'Password (min 6 chars)' : 'Password'
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading !== null}
          />
          <Button
            className="w-full"
            onClick={handleEmail}
            disabled={!canSubmit}
          >
            {loading === 'email' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function CloseButton() {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') router.push('/');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => router.push('/')}
      aria-label="Close and return home"
      className="bg-card hover:bg-accent text-muted-foreground hover:text-foreground fixed right-4 top-4 grid size-9 place-items-center rounded-full border shadow-soft transition-colors"
    >
      <X className="size-4" />
    </button>
  );
}

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={<div>Loading…</div>}>
        <CloseButton />
        <SignInForm />
      </Suspense>
    </main>
  );
}