'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { STUDIO_STOPS, type LightingMode, type StopId } from '@/data/atelierStations';
import { DioramaEngine } from '@/engine/DioramaEngine';
import { TopStudioBar } from '@/components/TopStudioBar';
import { BlueprintPromptSheet } from '@/components/BlueprintPromptSheet';
import { DioramaMiniMap } from '@/components/DioramaMiniMap';
import { AtelierBoardOverlay } from '@/components/AtelierBoardOverlay';

const STOP_ORDER: StopId[] = [
  'overview',
  'law-office',
  'mcp-tower',
  'mass-study',
  'comp-audit',
  'drawing-qa',
  'supervision-post',
  'bookstand',
  'cabinet',
  'board',
];

const STOP_SCROLL_TARGET: Record<StopId, number> = {
  overview: 0.0,
  'law-office': 0.12,
  'mcp-tower': 0.22,
  'mass-study': 0.32,
  'comp-audit': 0.42,
  'drawing-qa': 0.52,
  'supervision-post': 0.62,
  bookstand: 0.72,
  cabinet: 0.84,
  board: 0.96,
};

function resolveStopFromScroll(progress: number): StopId {
  if (progress < 0.06) return 'overview';
  if (progress < 0.17) return 'law-office';
  if (progress < 0.27) return 'mcp-tower';
  if (progress < 0.37) return 'mass-study';
  if (progress < 0.47) return 'comp-audit';
  if (progress < 0.57) return 'drawing-qa';
  if (progress < 0.67) return 'supervision-post';
  if (progress < 0.78) return 'bookstand';
  if (progress < 0.9) return 'cabinet';
  return 'board';
}

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DioramaEngine | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const programmaticStopRef = useRef<StopId | null>(null);
  const activeStopRef = useRef<StopId>('overview');

  const [activeStop, setActiveStop] = useState<StopId>('overview');
  const [selectedProjectIdx, setSelectedProjectIdx] = useState(0);
  const [cabinetZoomed, setCabinetZoomed] = useState(false);
  const [mobileSheetCollapsed, setMobileSheetCollapsed] = useState(false);
  const [hoveredStop, setHoveredStop] = useState<StopId | null>(null);
  const [hoveredLamp, setHoveredLamp] = useState(false);
  const [lighting, setLighting] = useState<LightingMode>('day');
  const [introState, setIntroState] = useState({ pct: 0, label: '아틀리에 작업실 전경 준비 중', done: false });
  const [webglFallback, setWebglFallback] = useState(false);

  const jumpToStop = useCallback((id: StopId) => {
    programmaticStopRef.current = id;
    activeStopRef.current = id;
    if (id !== 'overview') {
      engineRef.current?.ensureIntroCompleteForNavigation();
    }
    setActiveStop(id);
    engineRef.current?.setStop(id);
    if (window.innerWidth < 768) {
      window.setTimeout(() => {
        if (programmaticStopRef.current === id) programmaticStopRef.current = null;
      }, 150);
      return;
    }
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const destY = Math.round(STOP_SCROLL_TARGET[id] * maxScroll);
    if (lenisRef.current) {
      lenisRef.current.scrollTo(destY, {
        duration: 0.75,
        onComplete: () => {
          programmaticStopRef.current = null;
        },
      });
    } else {
      window.scrollTo({ top: destY, behavior: 'smooth' });
      window.setTimeout(() => {
        programmaticStopRef.current = null;
      }, 650);
    }
  }, []);

  const closeToOverviewAndRestoreFocus = useCallback(() => {
    jumpToStop('overview');
    requestAnimationFrame(() => {
      document.getElementById('eden-home-btn')?.focus({ preventScroll: true });
    });
  }, [jumpToStop]);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => {
            regs.forEach((r) => void r.unregister());
          })
          .catch(() => {});
      }
      if ('caches' in window) {
        caches
          .keys()
          .then((names) => {
            names.forEach((n) => void caches.delete(n));
          })
          .catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-lighting', lighting);
    engineRef.current?.setLighting(lighting);
  }, [lighting]);

  useEffect(() => {
    engineRef.current?.setCabinetFocus(selectedProjectIdx, cabinetZoomed);
  }, [selectedProjectIdx, cabinetZoomed]);

  useEffect(() => {
    if (activeStop !== 'cabinet') {
      setCabinetZoomed(false);
    }
  }, [activeStop]);

  useEffect(() => {
    setMobileSheetCollapsed(false);
  }, [activeStop, selectedProjectIdx]);

  useEffect(() => {
    engineRef.current?.setMobileSheetCollapsed(mobileSheetCollapsed);
  }, [mobileSheetCollapsed]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const skipIntro = params.get('intro') === 'skip';
    const holdRatioRaw = params.get('introHold');
    const holdRatio = holdRatioRaw !== null ? Number(holdRatioRaw) : null;
    const stopParam = params.get('stop') as StopId | null;
    const validStop: StopId = stopParam && STOP_ORDER.includes(stopParam) ? stopParam : 'overview';
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveSkipIntro =
      (skipIntro || prefersReduced || validStop !== 'overview') && holdRatio === null;
    const snapInitialStop: StopId = effectiveSkipIntro ? validStop : 'overview';
    const cubbyRaw = params.get('cubby');
    const parsedCubby = cubbyRaw !== null ? Number(cubbyRaw) : NaN;
    const hasValidCubby = Number.isInteger(parsedCubby) && parsedCubby >= 0 && parsedCubby <= 8;
    const initialCubbyIdx = hasValidCubby ? parsedCubby : 0;
    const initialCubbyZoom = hasValidCubby && validStop === 'cabinet';

    if (hasValidCubby) {
      setSelectedProjectIdx(initialCubbyIdx);
      if (initialCubbyZoom) setCabinetZoomed(true);
    }

    if (effectiveSkipIntro) {
      setIntroState({ pct: 100, label: '단지 준공 완료', done: true });
    }

    const engine = new DioramaEngine(
      container,
      effectiveSkipIntro,
      {
        onIntroProgress: (pct, label, done) => {
          setIntroState({ pct, label, done });
        },
        onSelectStop: (id) => {
          jumpToStop(id);
        },
        onSelectProject: (idx) => {
          setSelectedProjectIdx(idx);
          setCabinetZoomed(true);
        },
        onHoverStop: (id) => {
          setHoveredStop(id);
        },
        onHoverLamp: (hovered) => {
          setHoveredLamp(hovered);
        },
        onToggleLighting: () => {
          setLighting((l) => (l === 'day' ? 'night' : 'day'));
        },
        onWebglFallback: () => {
          setWebglFallback(true);
          setIntroState({ pct: 100, label: '준비 완료', done: true });
        },
      },
      snapInitialStop,
      initialCubbyIdx,
      initialCubbyZoom
    );

    if (holdRatio !== null && !Number.isNaN(holdRatio)) {
      engine.freezeIntroAt(holdRatio);
    }

    if (effectiveSkipIntro && validStop !== 'overview') {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const destY = Math.round(STOP_SCROLL_TARGET[validStop] * maxScroll);
      programmaticStopRef.current = validStop;
      activeStopRef.current = validStop;
      setActiveStop(validStop);
      window.scrollTo(0, destY);
      window.setTimeout(() => {
        if (programmaticStopRef.current === validStop) programmaticStopRef.current = null;
      }, 250);
    } else if (validStop !== 'overview' && holdRatio === null) {
      jumpToStop(validStop);
    }

    engineRef.current = engine;
    (window as unknown as { __edenEngine?: DioramaEngine }).__edenEngine = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [jumpToStop]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const updateFromScroll = (scrollY: number) => {
      if (window.innerWidth < 768) return;
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
      const next = resolveStopFromScroll(progress);
      if (programmaticStopRef.current && next !== programmaticStopRef.current) {
        return;
      }
      if (programmaticStopRef.current === next) {
        programmaticStopRef.current = null;
      }
      if (activeStopRef.current !== next) {
        activeStopRef.current = next;
        if (next !== 'overview') {
          engineRef.current?.ensureIntroCompleteForNavigation();
        }
        engineRef.current?.setStop(next);
        setActiveStop(next);
      }
    };

    if (!prefersReduced) {
      const lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 0.95,
      });
      lenisRef.current = lenis;
      lenis.on('scroll', ({ scroll }: { scroll: number }) => updateFromScroll(scroll));

      let raf = 0;
      const onFrame = (t: number) => {
        lenis.raf(t);
        raf = requestAnimationFrame(onFrame);
      };
      raf = requestAnimationFrame(onFrame);

      return () => {
        cancelAnimationFrame(raf);
        lenis.destroy();
        lenisRef.current = null;
      };
    }

    const onNativeScroll = () => updateFromScroll(window.scrollY);
    window.addEventListener('scroll', onNativeScroll, { passive: true });
    return () => window.removeEventListener('scroll', onNativeScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }
      if (e.key === 'Escape') {
        if (!introState.done) {
          engineRef.current?.skipIntro();
        } else if (activeStop === 'cabinet' && cabinetZoomed) {
          setCabinetZoomed(false);
        } else if (activeStop !== 'overview') {
          closeToOverviewAndRestoreFocus();
        }
      } else if (e.key === 'ArrowRight') {
        if (activeStop === 'board') return;
        const idx = STOP_ORDER.indexOf(activeStop);
        const next = STOP_ORDER[Math.min(STOP_ORDER.length - 1, idx + 1)];
        jumpToStop(next);
      } else if (e.key === 'ArrowLeft') {
        if (activeStop === 'board') return;
        const idx = STOP_ORDER.indexOf(activeStop);
        const prev = STOP_ORDER[Math.max(0, idx - 1)];
        jumpToStop(prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeStop, cabinetZoomed, introState.done, jumpToStop, closeToOverviewAndRestoreFocus]);

  const currentStopObj = STUDIO_STOPS.find((s) => s.id === activeStop) ?? STUDIO_STOPS[0];
  const hoveredObj = hoveredStop ? STUDIO_STOPS.find((s) => s.id === hoveredStop) : null;

  const handleStep = (dir: -1 | 1) => {
    const idx = STOP_ORDER.indexOf(activeStop);
    const nextIdx = (idx + dir + STOP_ORDER.length) % STOP_ORDER.length;
    jumpToStop(STOP_ORDER[nextIdx]);
  };

  return (
    <div className="relative bg-canvas text-ink">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {introState.done
          ? `현재 구역: ${currentStopObj.indexLabel} ${currentStopObj.title}`
          : introState.label}
      </div>

      {/* Mobile: 100dvh fixed interactive viewport · Desktop (md+): 940vh Scroll-Tour Track */}
      <div className="relative h-[100dvh] w-full overflow-hidden md:h-[940vh] md:overflow-visible">
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
          <TopStudioBar
            activeStop={activeStop}
            lighting={lighting}
            onToggleLighting={() => setLighting((l) => (l === 'day' ? 'night' : 'day'))}
            onViewOverview={() => {
              jumpToStop('overview');
              engineRef.current?.resetOverviewCamera();
            }}
            onSelectStop={jumpToStop}
          />

          {/* 3D Canvas Viewport */}
          <div className="relative h-full w-full">
            {webglFallback ? (
              <div className="flex h-full w-full items-center justify-center bg-canvas p-8">
                <div className="max-w-md rounded-xl border border-ink/35 bg-card p-6 text-center studio-shadow">
                  <h2 className="text-lg font-bold text-ink">WebGL 2 미지원 환경</h2>
                  <p className="mt-2 text-sm text-ink-sec">
                    3D 미니어처 아틀리에 렌더링을 위해 WebGL을 지원하는 브라우저로 접속해 주세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => jumpToStop('board')}
                    className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-accent px-4 py-2 font-mono text-xs font-bold text-accent-ink hover:opacity-90"
                  >
                    09 전체 아카이브 게시판(2D) 열기
                  </button>
                </div>
              </div>
            ) : (
              <div
                ref={mountRef}
                aria-label="이든 디지털 아틀리에 3D 미니어처 단지"
                className={`h-full w-full touch-none select-none md:touch-pan-y ${
                  hoveredStop || hoveredLamp ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                }`}
              />
            )}

            {introState.done && activeStop !== 'board' && hoveredLamp && (
              <div className="pointer-events-none fixed left-1/2 top-20 z-30 hidden -translate-x-1/2 rounded-full border border-ink/35 bg-card/95 px-4 py-1.5 font-mono text-xs font-bold text-ink studio-shadow md:block">
                클릭하여 {lighting === 'day' ? '다크모드' : '라이트모드'} 전환
              </div>
            )}

            {introState.done &&
              activeStop !== 'board' &&
              !hoveredLamp &&
              hoveredObj &&
              hoveredObj.id !== 'overview' && (
                <div className="pointer-events-none fixed left-1/2 top-20 z-30 hidden -translate-x-1/2 rounded-full border border-ink/35 bg-card/95 px-4 py-1.5 font-mono text-xs font-bold text-ink studio-shadow md:block">
                  클릭하여 {hoveredObj.shortTitle}{' '}
                  {hoveredObj.category === 'BOOK' || hoveredObj.category === 'PORTFOLIO'
                    ? '열람'
                    : hoveredObj.category === 'BOARD'
                    ? '열기'
                    : '청사진 펼치기'}{' '}
                  ({hoveredObj.drawingNo})
                </div>
              )}
          </div>

          {/* Transparent Non-Blocking High-Angle Intro Progress */}
          {!introState.done && (
            <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 mx-auto flex max-w-md flex-col items-center px-4">
              <div className="pointer-events-auto w-full rounded-xl border border-ink/35 bg-card/95 px-4 py-3 backdrop-blur-md studio-shadow">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-ink">{introState.label}</span>
                  <span className="font-bold tabular-nums text-accent">{introState.pct}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-panel">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-150"
                    style={{ width: `${introState.pct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ink-sec">
                  <span className="font-mono">BLUEPRINT → MINIATURE COMPLEX</span>
                  <button
                    type="button"
                    onClick={() => engineRef.current?.skipIntro()}
                    className="inline-flex min-h-[44px] items-center rounded border border-ink/50 bg-panel px-3 py-1 font-mono text-[11px] font-bold text-ink hover:border-accent sm:min-h-[28px] sm:py-0.5"
                  >
                    건너뛰기 (ESC)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Auto-Unrolling Blueprint, Bookstand & 3x3 Cabinet Drawer */}
          <BlueprintPromptSheet
            stop={currentStopObj}
            open={introState.done && activeStop !== 'overview' && activeStop !== 'board'}
            selectedProjectIdx={selectedProjectIdx}
            cabinetZoomed={cabinetZoomed}
            mobileCollapsed={mobileSheetCollapsed}
            onToggleMobileCollapsed={() => setMobileSheetCollapsed((c) => !c)}
            onSelectProjectIdx={setSelectedProjectIdx}
            onSetCabinetZoomed={setCabinetZoomed}
            onPrev={() => handleStep(-1)}
            onNext={() => handleStep(1)}
            onCloseToOverview={closeToOverviewAndRestoreFocus}
          />

          {/* Stage 5: Full Wall Pinboard & Official Office Profile */}
          <AtelierBoardOverlay
            open={introState.done && activeStop === 'board'}
            onJumpToStop={(id, projectIdx) => {
              if (typeof projectIdx === 'number') {
                setSelectedProjectIdx(projectIdx);
                setCabinetZoomed(true);
              }
              jumpToStop(id);
            }}
            onCloseToOverview={closeToOverviewAndRestoreFocus}
          />

          {/* Interactive Complex Mini-Map */}
          {introState.done && (
            <DioramaMiniMap activeStop={activeStop} onSelectStop={jumpToStop} />
          )}
        </div>
      </div>
    </div>
  );
}
