'use client';

import { STUDIO_STOPS, type LightingMode, type StopId } from '@/data/atelierStations';

interface TopStudioBarProps {
  activeStop: StopId;
  lighting: LightingMode;
  onToggleLighting: () => void;
  onViewOverview: () => void;
  onSelectStop: (id: StopId) => void;
}

export function TopStudioBar({
  activeStop,
  lighting,
  onToggleLighting,
  onViewOverview,
  onSelectStop,
}: TopStudioBarProps) {
  const current = STUDIO_STOPS.find((s) => s.id === activeStop) ?? STUDIO_STOPS[0];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3.5">
      {/* Left Brand Badge Pill */}
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-ink/35 bg-card/95 px-3 py-0.5 backdrop-blur-md studio-shadow sm:px-3.5 sm:py-1">
        <h1 className="m-0 font-sans text-sm font-extrabold tracking-tight sm:text-base">
          <button
            id="eden-home-btn"
            type="button"
            onClick={() => onSelectStop('overview')}
            className="inline-flex min-h-[44px] items-center text-left text-ink hover:text-accent sm:min-h-[30px]"
          >
            E:DEN Digital Atelier
          </button>
        </h1>
        <span className="hidden h-3.5 w-px bg-ink/25 sm:inline-block" />
        <span className="hidden font-mono text-[11px] font-semibold text-ink-sec sm:inline">
          V2 · <span className="tabular-nums">{current.indexLabel}</span> {current.shortTitle}
        </span>
      </div>

      {/* Right Overview & Lighting Controls */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onViewOverview}
          aria-pressed={activeStop === 'overview'}
          className={`inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-bold backdrop-blur-md transition-colors sm:min-h-[36px] sm:text-xs ${activeStop === 'overview'
              ? 'border-ink/55 bg-panel/95 text-ink'
              : 'border-ink/50 bg-card/95 text-ink-sec hover:border-accent hover:text-ink'
            }`}
        >
          전경 보기
        </button>

        <button
          type="button"
          onClick={onToggleLighting}
          aria-pressed={lighting === 'night'}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-ink/50 bg-card/95 px-3 py-1.5 font-mono text-[11px] font-bold text-ink backdrop-blur-md studio-shadow transition-colors hover:border-accent sm:min-h-[36px] sm:text-xs"
        >
          <span
            aria-hidden="true"
            className={`inline-block h-2.5 w-2.5 rounded-full border border-ink/40 ${lighting === 'night' ? 'bg-[#F2C464]' : 'bg-[#2E5A44]'
              }`}
          />
          <span>{lighting === 'day' ? '다크모드' : '라이트모드'}</span>
        </button>
      </div>
    </header>
  );
}
