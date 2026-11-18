'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ApprovedStamp, getSheetThudClass } from '@/components/ApprovedStamp';
import { STUDIO_STOPS, type StopId } from '@/data/atelierStations';
import {
  EDEN_FEATURED_PROJECTS,
  EDEN_MEDIA_RECORDS,
  EDEN_OFFICE_INFO,
  PRINCIPAL_ARCHITECT_INFO,
} from '@/data/edenPortfolioData';
import {
  copyTextWithFallback,
  loadSavedVarMap,
  resolveStopTemplate,
} from '@/utils/atelierCopy';

type PinFilter = 'ALL' | 'PROMPT' | 'MCP' | 'BOOK' | 'PORTFOLIO' | 'OFFICE';

interface AtelierBoardOverlayProps {
  open: boolean;
  onJumpToStop: (id: StopId, projectIdx?: number) => void;
  onCloseToOverview: () => void;
}

const FILTER_TABS: { key: PinFilter; label: string }[] = [
  { key: 'ALL', label: '전체 아카이브' },
  { key: 'PROMPT', label: 'AI 프롬프트' },
  { key: 'MCP', label: 'MCP 서버' },
  { key: 'BOOK', label: '교재·강의' },
  { key: 'PORTFOLIO', label: '건축 대표작 9선' },
  { key: 'OFFICE', label: '사무소·대표건축사' },
];

export function AtelierBoardOverlay({
  open,
  onJumpToStop,
  onCloseToOverview,
}: AtelierBoardOverlayProps) {
  const [filter, setFilter] = useState<PinFilter>('ALL');
  const [query, setQuery] = useState('');
  const [stampSeqMap, setStampSeqMap] = useState<Record<string, number>>({});
  const [savedVarMap, setSavedVarMap] = useState<Record<string, Record<string, string>>>({});

  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setSavedVarMap(loadSavedVarMap());
    const id = requestAnimationFrame(() => {
      if (window.innerWidth >= 640) {
        searchInputRef.current?.focus({ preventScroll: true });
      } else {
        closeBtnRef.current?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const q = query.trim().toLowerCase();

  const stationItems = useMemo(() => {
    return STUDIO_STOPS.filter(
      (s) => s.category === 'PROMPT' || s.category === 'MCP' || s.category === 'BOOK'
    ).filter((s) => {
      if (filter !== 'ALL' && filter !== s.category) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.shortTitle.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.drawingNo.toLowerCase().includes(q)
      );
    });
  }, [filter, q]);

  const projectItems = useMemo(() => {
    if (filter !== 'ALL' && filter !== 'PORTFOLIO') return [];
    return EDEN_FEATURED_PROJECTS.map((p, idx) => ({ project: p, idx })).filter(({ project: p }) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.usage.toLowerCase().includes(q) ||
        (p.award ?? '').toLowerCase().includes(q)
      );
    });
  }, [filter, q]);

  const officeMatchesQuery =
    !q ||
    EDEN_OFFICE_INFO.nameKo.toLowerCase().includes(q) ||
    PRINCIPAL_ARCHITECT_INFO.nameKo.toLowerCase().includes(q) ||
    EDEN_OFFICE_INFO.addressRoad.toLowerCase().includes(q);

  const showFullOfficeSection = filter === 'OFFICE' || (filter === 'ALL' && Boolean(q) && officeMatchesQuery);
  const showCompactOfficeBanner = filter === 'ALL' && !q;

  async function handleCopyText(key: string, text: string) {
    const ok = await copyTextWithFallback(text);
    if (ok) {
      setStampSeqMap((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
    }
  }

  function handleDialogKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusables = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="atelier-board-title"
      onKeyDown={handleDialogKeyDown}
      className="pointer-events-auto fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] top-[calc(max(0.55rem,env(safe-area-inset-top))+48px)] z-40 mx-auto flex max-w-[1320px] flex-col rounded-xl border-[3px] border-wood-dark bg-paper-sub p-2 shadow-2xl md:inset-x-8 md:bottom-5 md:top-16 md:p-3 lg:inset-x-14"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-ink/25 bg-cork text-ink">
        {/* Pinboard Top Bar: Title, Search & Actions */}
        <div
          data-dark-surface="true"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/20 bg-[#3B2E24] px-3.5 py-2 text-[#FFFDF8] sm:py-2.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-[#F2C464] px-2 py-0.5 font-mono text-[11px] font-extrabold tabular-nums text-[#221C17]">
              STOP 09 / BOARD
            </span>
            <h2 id="atelier-board-title" className="font-sans text-sm font-extrabold sm:text-base">
              E:DEN 아틀리에 전체 핀보드 · (주)이든건축사사무소 아카이브
            </h2>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  if (query.trim().length > 0) {
                    setQuery('');
                  } else {
                    onCloseToOverview();
                  }
                }
              }}
              placeholder="검색 (법규, MCP, 포항, POETIES...)"
              aria-label="게시판 카드 검색"
              className="min-h-[44px] min-w-0 flex-1 rounded border border-white/45 bg-white/15 px-3 py-1 font-sans text-base text-white placeholder:text-white/75 focus:border-[#F2C464] focus:outline-none sm:min-h-[32px] sm:w-64 sm:flex-none sm:text-xs"
            />
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onCloseToOverview}
              className="inline-flex min-h-[44px] shrink-0 items-center rounded border border-white/45 bg-white/15 px-2.5 py-1 font-mono text-xs font-bold text-[#FFFDF8] hover:border-[#F2C464] hover:bg-white/25 sm:min-h-[32px] sm:px-3"
            >
              닫기
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="no-scrollbar flex flex-nowrap gap-2 overflow-x-auto border-b border-ink/15 bg-paper-sub px-3.5 py-2 sm:flex-wrap">
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                aria-pressed={active}
                className={`inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 py-1 font-mono text-xs font-bold tabular-nums transition-colors sm:min-h-[32px] sm:px-3 ${
                  active
                    ? 'border-ink bg-accent text-accent-ink'
                    : 'border-ink/45 bg-paper text-ink hover:border-accent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Corkboard Canvas */}
        <div data-lenis-prevent className="paper-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-3.5 sm:p-5">
          {/* Compact Banner in ALL view so Station & Portfolio cards lead above the fold */}
          {showCompactOfficeBanner && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/25 bg-card px-4 py-2.5 studio-shadow">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-sans text-sm font-extrabold text-ink">
                    {EDEN_OFFICE_INFO.nameKo} · {PRINCIPAL_ARCHITECT_INFO.nameKo} 대표건축사
                  </span>
                  <span className="rounded bg-paper-sub px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-ink-sec">
                    등록 작품 {EDEN_OFFICE_INFO.totalWorksCount}선
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[11px] tabular-nums text-ink-sec">
                  {EDEN_OFFICE_INFO.addressRoad} · TEL {EDEN_OFFICE_INFO.phones[0]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFilter('OFFICE')}
                className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-ink/45 bg-paper px-3.5 py-1 font-mono text-xs font-bold text-ink hover:border-accent sm:min-h-[32px]"
              >
                사무소 약력·수상·언론 보기 →
              </button>
            </div>
          )}

          {/* Full Principal Architect & Official Office Profile */}
          {showFullOfficeSection && (
            <div className="relative rounded-xl border border-ink/30 bg-card p-4 studio-shadow sm:p-5">
              <span
                aria-hidden="true"
                className="mx-auto mb-2 block h-3 w-3 rounded-full border border-ink/70 bg-[#C24936] sm:absolute sm:left-1/2 sm:top-2.5 sm:-translate-x-1/2"
              />
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold text-accent">
                      <span>OFFICIAL STUDIO PROFILE</span>
                      <span className="rounded bg-paper-sub px-1.5 py-0.5 tabular-nums text-ink-sec">
                        등록 작품 {EDEN_OFFICE_INFO.totalWorksCount}선
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-sans text-lg font-extrabold text-ink">
                      {EDEN_OFFICE_INFO.nameKo} · {PRINCIPAL_ARCHITECT_INFO.nameKo} 대표건축사
                    </h3>
                    <p className="mt-1 font-mono text-xs text-brass">
                      “{EDEN_OFFICE_INFO.slogan}” · {PRINCIPAL_ARCHITECT_INFO.role}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-ink-sec">
                      {PRINCIPAL_ARCHITECT_INFO.corePhilosophy}.
                    </p>
                  </div>

                  <blockquote className="border-l-2 border-accent pl-3 text-xs italic leading-relaxed text-ink">
                    “{PRINCIPAL_ARCHITECT_INFO.quote}”
                    <footer className="mt-1 not-italic font-mono text-[11px] text-ink-sec">
                      — {PRINCIPAL_ARCHITECT_INFO.quoteSource}
                    </footer>
                  </blockquote>

                  {/* Official Contact Box (Office Phones / Address / Website — No Personal Cell) */}
                  <div className="rounded-lg border border-ink/20 bg-paper p-3 text-xs">
                    <div className="font-semibold text-ink">{EDEN_OFFICE_INFO.addressRoad}</div>
                    <div className="mt-1 font-mono text-[11px] tabular-nums text-ink-sec">
                      TEL {EDEN_OFFICE_INFO.phones.join(' · ')} / FAX {EDEN_OFFICE_INFO.fax}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-sec">
                      E-MAIL {EDEN_OFFICE_INFO.emails.official} · {EDEN_OFFICE_INFO.emails.principal}
                    </div>
                    <div className="mt-1.5">
                      <a
                        href={EDEN_OFFICE_INFO.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center whitespace-nowrap font-mono text-[11px] font-bold text-accent underline underline-offset-2 sm:min-h-0"
                      >
                        공식 웹사이트 ({EDEN_OFFICE_INFO.website})&nbsp;↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* Career, 7 Verified Awards & Media Records */}
                <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
                  <div className="rounded-lg border border-ink/20 bg-paper p-3">
                    <h4 className="font-mono text-[11px] font-bold text-brass">
                      약력 · 학력 및 주요 수상 (7회)
                    </h4>
                    <ul className="mt-1.5 space-y-1 text-[11px] text-ink-sec">
                      {PRINCIPAL_ARCHITECT_INFO.career.map((c) => (
                        <li key={c}>• {c}</li>
                      ))}
                    </ul>
                    <ul className="mt-2 space-y-1 border-t border-ink/15 pt-2 text-[11px] text-ink">
                      {PRINCIPAL_ARCHITECT_INFO.awards.map((aw) => (
                        <li key={`${aw.year}-${aw.title}`} className="flex gap-1.5">
                          <span className="font-mono font-bold tabular-nums text-accent">{aw.year}</span>
                          <span>
                            {aw.title}
                            {aw.project ? ` (${aw.project})` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-ink/20 bg-paper p-3">
                    <h4 className="font-mono text-[11px] font-bold text-ink">
                      언론 인터뷰 · 칼럼 · 공공 심사 기록
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {EDEN_MEDIA_RECORDS.map((m) => (
                        <li key={m.url} className="rounded border border-ink/15 bg-card p-2 text-[11px]">
                          <div className="flex items-center justify-between font-mono text-[10px] text-ink-sec">
                            <span className="font-bold text-accent">
                              {m.typeLabel} · {m.outlet}
                            </span>
                            <span className="tabular-nums">{m.dateNote}</span>
                          </div>
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex min-h-[44px] items-center font-semibold text-ink hover:text-accent hover:underline sm:min-h-0"
                          >
                            {m.title}&nbsp;↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pinned AI Prompts, MCP Servers & Book Cards */}
          {stationItems.length > 0 && (
            <div>
              <h3 className="mb-2.5 font-mono text-xs font-extrabold tracking-wider tabular-nums text-ink">
                PINNED ATELIER STATIONS // AI 프롬프트 · MCP · 실무 교재 ({stationItems.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stationItems.map((st) => {
                  const resolvedSnippet = resolveStopTemplate(st, savedVarMap[st.id]);
                  const cardSeq = stampSeqMap[st.id] ?? 0;
                  return (
                    <article
                      key={st.id}
                      className={`relative flex flex-col justify-between overflow-hidden rounded-lg border border-ink/30 bg-paper p-3.5 studio-shadow ${getSheetThudClass(cardSeq)}`}
                    >
                      <ApprovedStamp
                        seq={cardSeq}
                        variant="paper"
                        size="sm"
                        className="bottom-[52px] right-3 z-10"
                      />
                      <div>
                        <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                          <span className="font-bold tabular-nums text-brass">
                            {st.indexLabel} · {st.drawingNo}
                          </span>
                          <span className="rounded bg-paper-sub px-1.5 py-0.5 text-[10px] font-bold text-ink-sec">
                            {st.category === 'BOOK' ? 'SAMPLE 교재' : 'SAMPLE'}
                          </span>
                        </div>
                        <h4 className="mt-1.5 font-sans text-sm font-extrabold text-ink">{st.title}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-ink-sec">{st.summary}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/15 pt-2.5">
                        <button
                          type="button"
                          onClick={() => handleCopyText(st.id, resolvedSnippet)}
                          className="inline-flex min-h-[44px] items-center rounded border border-ink/45 bg-card px-3 py-1 font-mono text-[11px] font-bold text-ink transition-transform hover:border-accent active:scale-95 sm:min-h-[30px] sm:px-2.5"
                        >
                          스니펫 복사
                        </button>
                        <button
                          type="button"
                          onClick={() => onJumpToStop(st.id)}
                          className="inline-flex min-h-[44px] items-center rounded bg-accent px-3 py-1 font-mono text-[11px] font-bold text-accent-ink hover:opacity-90 sm:min-h-[30px] sm:px-2.5"
                        >
                          3D 모형 이동 →
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pinned 9 Featured Architecture Portfolio Cards */}
          {projectItems.length > 0 && (
            <div>
              <h3 className="mb-2.5 font-mono text-xs font-extrabold tracking-wider tabular-nums text-ink">
                PINNED PORTFOLIO // (주)이든건축사사무소 대표작 ({projectItems.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projectItems.map(({ project: p, idx }) => (
                  <article
                    key={p.id}
                    className="flex flex-col justify-between rounded-lg border border-ink/30 bg-card p-3.5 studio-shadow"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 font-mono text-[11px]">
                        <span className="font-bold tabular-nums text-brass">{p.code}</span>
                        <span className="tabular-nums text-ink-sec">{p.year}</span>
                      </div>
                      <h4 className="mt-1 font-sans text-sm font-extrabold text-ink">{p.name}</h4>
                      {p.award && (
                        <div className="mt-1 inline-block rounded border border-brass/50 bg-paper px-1.5 py-0.5 font-mono text-[10px] font-bold text-brass">
                          {p.award}
                        </div>
                      )}
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-sec">{p.summary}</p>
                      <div className="mt-2 font-mono text-[11px] tabular-nums text-ink-sec">
                        {p.location} · {p.scale} · 연면적 {p.grossFloorArea}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/15 pt-2.5">
                      {p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center whitespace-nowrap font-mono text-[11px] font-bold text-accent underline underline-offset-2 sm:min-h-0"
                        >
                          e-den.kr&nbsp;↗
                        </a>
                      ) : (
                        <span className="font-mono text-[10.5px] text-ink-muted">내부 아카이브 제원</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onJumpToStop('cabinet', idx)}
                        className="inline-flex min-h-[44px] items-center rounded border border-ink/45 bg-paper-sub px-3 py-1 font-mono text-[11px] font-bold text-ink hover:border-accent sm:min-h-[30px] sm:px-2.5"
                      >
                        장식장 모형 보기 →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {!showFullOfficeSection && !showCompactOfficeBanner && stationItems.length === 0 && projectItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-ink/35 bg-paper p-8 text-center font-mono text-xs text-ink-sec">
              <p>검색 조건과 일치하는 핀보드 카드가 없습니다.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setFilter('ALL');
                }}
                className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-ink/45 bg-card px-4 py-1.5 font-mono text-xs font-bold text-ink hover:border-accent sm:min-h-[32px]"
              >
                검색 및 필터 초기화
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
