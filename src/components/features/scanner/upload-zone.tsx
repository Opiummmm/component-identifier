'use client';

import * as React from 'react';
import { ImageUp, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ACCEPTED_ATTR = ACCEPTED_MIME.join(',');
const MAX_SIZE = 15 * 1024 * 1024; // 15mb raw — phones produce big files

interface Props {
  onFile: (file: File) => void;
  onCamera: () => void;
  file: File | null;
  previewUrl: string | null;
  onClear: () => void;
  disabled?: boolean;
}

export function UploadZone({
  onFile,
  onCamera,
  file,
  previewUrl,
  onClear,
  disabled,
}: Props) {
  const [drag, setDrag] = React.useState(false);
  const dragCounter = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function isImage(f: File): boolean {
    if (ACCEPTED_MIME.includes(f.type)) return true;
    // Some systems give odd or empty MIME types — fall back to extension.
    const name = f.name.toLowerCase();
    return ACCEPTED_EXT.some((ext) => name.endsWith(ext));
  }

  function validate(f: File): boolean {
    if (!isImage(f)) {
      toast.error('Unsupported file type. JPEG, PNG, WebP, or GIF.');
      return false;
    }
    if (f.size > MAX_SIZE) {
      toast.error('File exceeds 15mb.');
      return false;
    }
    return true;
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items.length > 0) setDrag(true);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDrag(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDrag(false);

    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (validate(f)) onFile(f);
  }

  // Preview state ----------------------------------------------------------
  if (previewUrl) {
    return (
      <div className="relative">
        <div className="bg-card relative overflow-hidden rounded-xl border shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-[60vh] w-full object-contain"
          />
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={onClear}
            className="absolute right-3 top-3 size-8 rounded-full shadow-elevated"
          >
            <X className="size-4" />
          </Button>
        )}
        {file && (
          <div className="text-muted-foreground mt-3 flex justify-between text-xs">
            <span className="truncate">{file.name}</span>
            <span>{(file.size / 1024).toFixed(0)} KB</span>
          </div>
        )}
      </div>
    );
  }

  // Empty state ------------------------------------------------------------
  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'relative flex aspect-4/3 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all',
        drag
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border bg-card/50 hover:border-primary/50 hover:bg-card',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_ATTR}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && validate(f)) onFile(f);
          // Reset so picking the same file twice still fires onChange
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* All inner content has pointer-events-none so the events stay on the
          outer div and drag-leave doesn't fire on child hover. */}
      <div className="pointer-events-none flex flex-col items-center">
        <div className="bg-primary/10 text-primary mb-4 grid size-14 place-items-center rounded-full">
          <ImageUp className="size-6" />
        </div>

        <p className="text-base font-medium">
          {drag ? 'Drop to upload' : 'Drop an image or click to upload'}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          JPEG, PNG, WebP, GIF · up to 15mb
        </p>

        <div className="text-muted-foreground my-4 flex items-center gap-2 text-xs">
          <span className="h-px w-8 bg-current opacity-30" />
          <span>or</span>
          <span className="h-px w-8 bg-current opacity-30" />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onCamera();
        }}
      >
        <Camera className="mr-2 size-4" />
        Use camera
      </Button>
    </div>
  );
}