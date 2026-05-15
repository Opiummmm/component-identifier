'use client';

import * as React from 'react';
import { Send, Sparkles, RotateCcw, User2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { IdentifiedComponent } from '@/lib/ai/schemas';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function suggestionsFor(c: IdentifiedComponent): string[] {
  const base = [
    `Show me a typical circuit using this part`,
    `What's the most common failure mode?`,
    `Cheaper or more available alternatives?`,
  ];
  if (c.category === 'ic') {
    return [
      'Walk me through the pin functions',
      'What clock speed should I run it at?',
      ...base.slice(0, 2),
    ];
  }
  if (c.category === 'resistor' || c.category === 'capacitor') {
    return [
      `Why this value specifically?`,
      `How does tolerance affect a circuit?`,
      ...base.slice(0, 2),
    ];
  }
  if (c.category === 'transistor') {
    return [
      `When would I use this vs a MOSFET?`,
      `Bias point for small-signal use?`,
      ...base.slice(0, 2),
    ];
  }
  return base;
}

export function ComponentQa({ component }: { component: IdentifiedComponent }) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [streaming, setStreaming] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  async function ask(questionText: string) {
    const question = questionText.trim();
    if (!question || streaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    };
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component, history, question }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: m.content + chunk } : m,
          ),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
    } finally {
      setStreaming(false);
    }
  }

  function reset() {
    setMessages([]);
    setInput('');
  }

  const suggestions = suggestionsFor(component);
  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full min-h-96 flex-col gap-3">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-6 text-center">
            <div className="bg-primary/10 text-primary grid size-10 place-items-center rounded-full">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Ask anything about this part</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Suggestions to get you started:
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  disabled={streaming}
                  className="bg-muted hover:bg-muted/70 rounded-full px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      <div className="border-t pt-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            placeholder="Ask a question…"
            disabled={streaming}
            rows={2}
            className={cn(
              'flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-50',
            )}
          />
          <div className="flex flex-col gap-1.5">
            <Button
              type="button"
              size="icon"
              onClick={() => ask(input)}
              disabled={streaming || !input.trim()}
            >
              <Send className="size-4" />
            </Button>
            {messages.length > 0 && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={reset}
                disabled={streaming}
                aria-label="Reset conversation"
              >
                <RotateCcw className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mt-1.5 text-[10px]">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-full',
          isUser ? 'bg-secondary' : 'bg-primary/10 text-primary',
        )}
      >
        {isUser ? (
          <User2 className="size-3.5" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-xl px-3 py-2 text-sm',
          isUser ? 'bg-secondary text-secondary-foreground' : 'bg-muted/40',
        )}
      >
        {message.content ? (
          <div className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>
        ) : (
          <TypingDots />
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full" />
    </div>
  );
}