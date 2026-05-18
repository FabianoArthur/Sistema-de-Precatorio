import { cn } from '@/lib/utils';
import { type TextareaHTMLAttributes, forwardRef } from 'react';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[88px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-soft transition-all resize-y',
      'placeholder:text-muted-foreground',
      'hover:border-border-strong',
      'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
