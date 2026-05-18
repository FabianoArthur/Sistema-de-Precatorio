import { cn } from '@/lib/utils';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 32, className }: BrandMarkProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-strong text-primary-foreground shadow-soft ring-1 ring-primary/30',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size * 0.625, height: size * 0.625 }}
      >
        <title>Preca</title>
        <path
          d="M8 24V8h7.5a5 5 0 0 1 0 10H12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="22" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <BrandMark size={28} />
      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight font-display">Preca</div>
        <div className="text-2xs text-muted-foreground -mt-0.5">Controle de Precatórios</div>
      </div>
    </div>
  );
}
