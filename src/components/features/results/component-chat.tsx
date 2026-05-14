'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IdentifiedComponent } from '@/lib/ai/schemas';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTED_PROMPTS = [
  "What's a typical circuit using this part?",
  'What are the common failure modes?',
  'Give me a simple example application.',
];

export function ComponentChat({
  component,
}: {
  component: IdentifiedComponent;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  // Reset chat when switching to a different component
  useEffect(() => {
    setMessages([]);
    setInput('');
    setError(null);
    abortRef.current?.abort();
  }, [component.id]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    const userTurn: Message = { role: 'user', content: trimmed };
    const history = [...messages, userTurn];

    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component, messages: history }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const msg =
          res.status === 429
            ? 'Slow down — too many requests. Try again in a moment.'
            : res.status === 401
              ? 'You need to be signed in to chat.'
              : 'Something went wrong. Try again.';
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMessages((prev) => prev.slice(0, -1)); // drop empty placeholder
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="bg-card flex h-[600px] flex-col rounded-lg border">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="text-primary size-4" />
          Ask about {component.identifiedAs}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Grounded in this specific part's specs.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="text-muted-foreground/40 mb-3 size-8" />
            <p className="text-muted-foreground mb-4 text-sm">
              Ask me anything about this component.
            </p>
            <div className="flex w-full max-w-md flex-col gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="hover:bg-accent hover:text-accent-foreground border-border w-full rounded-md border px-3 py-2 text-left text-sm transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1}
              />
            ))}
            {error && (
              <div className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isStreaming ? 'Thinking…' : 'Ask a question…'}
            disabled={isStreaming}
            className="bg-background border-input focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isStreaming}
          >
            {isStreaming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming: boolean;
}) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
        )}
      >
        {message.content || (isStreaming && '…')}
        {isStreaming && !isUser && message.content && (
          <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-current" />
        )}
      </div>
    </div>
  );
}