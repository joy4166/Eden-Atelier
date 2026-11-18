'use client';

import { useEffect, useRef } from 'react';
import { STUDIO_STOPS, type StopId } from '@/data/atelierStations';

interface DioramaMiniMapProps {
  activeStop: StopId;
  onSelectStop: (id: StopId) => void;
}

const COMPACT_STOP_LABELS: Record<StopId, string> = {
  overview: '단지전경',
  'law-office': '법규검토',
  'mcp-tower': '대장MCP',
  'mass-study': '매스조망',
  'comp-audit': '설계공모',
  'drawing-qa': '도면검수',
  'supervision-post': '공사감리',
  bookstand: 'AI교재',
  cabinet: '수상작9선',
  board: '핀보드',
};

const MOBILE_SHORT_LABELS: Record<StopId, string> = {
  overview: '전경',
  'law-office': '법규',
  'mcp-tower': '대장',
  'mass-study': '매스',
  'comp-audit': '공모',
  'drawing-qa': '도면',
  'supervision-post': '감리',
  bookstand: '교재',
  cabinet: '대표작',
  board: '보드',
};

export function DioramaMiniMap({ activeStop, onSelectStop }: DioramaMiniMapProps) {
  const activeMobilePillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeMobilePillRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeStop]);

  if (activeStop === 'board') return null;

  const isOverview = activeStop === 'overview';

  return (
    <nav aria-label="아틀리에 스테이션 네비게이션">
      {/* Desktop Unified 00–09 Navigation Bar (shown on overview on short landscape; hidden during stops on short landscape so 3D stays clear) */}
      <div
        className={`pointer-events-auto fixed bottom-2.5 right-3.5 z-30 hidden w-[min(46vw,580px)] rounded-xl border border-ink/35 bg-card/95 px-2 py-1.5 backdrop-blur-md studio-shadow md:block lg:px-2.5 ${
          isOverview
            ? '[@media(max-height:500px)]:left-2.5 [@media(max-height:500px)]:right-auto [@media(max-height:500px)]:w-[min(48vw,450px)]'
            : '[@media(max-height:500px)]:hidden'
        }`}
      >
        <div className="mb-1 flex items-center justify-between font-mono text-[10px] font-bold text-ink-sec">
          <span>ATELIER NAVIGATION</span>
          <span className="tabular-nums text-ink-muted">00 - 09</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {STUDIO_STOPS.map((st) => {
            const active = activeStop === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onSelectStop(st.id)}
                aria-pressed={active}
                title={`${st.indexLabel} ${st.title}`}
                className={`overflow-hidden truncate whitespace-nowrap rounded px-1 py-1 text-left font-sans text-[10px] font-bold transition-colors lg:px-1.5 lg:text-[10.5px] ${
                  active
                    ? 'bg-accent text-accent-ink'
                    : 'border border-ink/40 bg-panel text-ink hover:border-accent'
                }`}
              >
                <span className="font-mono text-[10px] tabular-nums opacity-90">{st.indexLabel}</span>{' '}
                {COMPACT_STOP_LABELS[st.id]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Overview: Clean Bottom 2×5 Dock showing all 00–09 stops at once */}
      {isOverview ? (
        <div className="pointer-events-auto fixed inset-x-2.5 bottom-[max(0.6rem,env(safe-area-inset-bottom))] z-30 rounded-xl border border-ink/35 bg-card/95 px-2 py-1.5 backdrop-blur-md studio-shadow md:hidden">
          <div className="mb-1 flex items-center justify-between px-0.5 font-mono text-[10px] font-bold text-ink-sec">
            <span>ATELIER NAVIGATION</span>
            <span className="tabular-nums text-ink-muted">00 - 09</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {STUDIO_STOPS.map((st) => {
              const active = activeStop === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSelectStop(st.id)}
                  aria-pressed={active}
                  title={`${st.indexLabel} ${st.title}`}
                  className={`flex min-h-[40px] flex-col items-center justify-center rounded-lg px-1 py-1 text-center font-sans leading-tight transition-colors ${
                    active
                      ? 'bg-accent text-accent-ink'
                      : 'border border-ink/35 bg-panel text-ink active:scale-95'
                  }`}
                >
                  <span className="font-mono text-[9.5px] font-bold tabular-nums opacity-85">
                    {st.indexLabel}
                  </span>
                  <span className="mt-0.5 whitespace-nowrap text-[11px] font-extrabold">
                    {MOBILE_SHORT_LABELS[st.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Mobile Detail Stop: Compact Top Horizontal Switcher Pill */
        <div className="pointer-events-auto fixed inset-x-2.5 top-[calc(max(0.55rem,env(safe-area-inset-top))+46px)] z-30 flex items-center overflow-hidden rounded-full border border-ink/40 bg-card/95 backdrop-blur-md studio-shadow md:hidden">
          <div className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto px-1.5 py-0.5 pr-6">
            {STUDIO_STOPS.map((st) => {
              const active = activeStop === st.id;
              return (
                <button
                  key={st.id}
                  ref={active ? activeMobilePillRef : null}
                  type="button"
                  onClick={() => onSelectStop(st.id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-[40px] shrink-0 items-center whitespace-nowrap rounded-full px-2.5 font-mono text-[11px] font-bold tabular-nums transition-colors ${
                    active ? 'bg-accent text-accent-ink' : 'text-ink-sec hover:text-ink'
                  }`}
                >
                  {st.indexLabel} {COMPACT_STOP_LABELS[st.id]}
                </button>
              );
            })}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 flex w-6 items-center justify-end bg-gradient-to-l from-card via-card/80 to-transparent pr-1.5 font-mono text-xs font-bold text-ink-muted"
          >
            ›
          </div>
        </div>
      )}
    </nav>
  );
}
