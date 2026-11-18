'use client';

interface ApprovedStampProps {
  seq: number;
  variant?: 'blueprint' | 'paper';
  size?: 'md' | 'sm';
  className?: string;
}

export function getSheetThudClass(seq: number): string {
  if (seq <= 0) return '';
  return seq % 2 === 1 ? 'eden-sheet-thud-a' : 'eden-sheet-thud-b';
}

export function ApprovedStamp({
  seq,
  variant = 'paper',
  size = 'md',
  className = '',
}: ApprovedStampProps) {
  if (seq <= 0) return null;

  const surfaceStyles =
    variant === 'blueprint'
      ? 'border-[#FF6454] bg-[#132944]/90 text-[#FF6454] shadow-[0_8px_22px_rgba(8,18,32,0.48)]'
      : 'border-stamp bg-paper/[0.92] text-stamp shadow-[0_8px_20px_rgba(28,20,14,0.18)]';

  const frameStyles =
    size === 'md'
      ? 'rounded-[4px] border-[3px] px-4 py-1.5 backdrop-blur-[1.5px] sm:px-5 sm:py-2'
      : 'rounded-[3px] border-[2.5px] px-2.5 py-1 backdrop-blur-[1.5px]';

  const innerBorderStyles =
    size === 'md'
      ? 'inset-[3px] rounded-[2px] border-[1.5px]'
      : 'inset-[2px] rounded-[1px] border';

  const labelStyles =
    size === 'md'
      ? 'font-mono text-lg font-black tracking-[0.22em] sm:text-xl'
      : 'font-mono text-xs font-black tracking-[0.18em]';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none absolute select-none ${className}`}
    >
      <div
        key={seq}
        className={`eden-stamp-slam relative inline-flex items-center justify-center overflow-visible ${frameStyles} ${surfaceStyles}`}
      >
        <span
          aria-hidden="true"
          className="eden-stamp-ring pointer-events-none absolute -inset-1 rounded-[6px] border-[2.5px] border-current"
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute ${innerBorderStyles} border-current opacity-75`}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,255,255,0.14),transparent_58%)]"
        />
        <span className={`relative z-10 leading-none ${labelStyles}`}>APPROVED</span>
        <span className="sr-only">복사 완료</span>
      </div>
    </div>
  );
}
