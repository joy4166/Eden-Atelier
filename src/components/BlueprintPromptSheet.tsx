'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { StudioStop } from '@/data/atelierStations';
import { ApprovedStamp, getSheetThudClass } from '@/components/ApprovedStamp';
import { PortfolioCabinetSheet } from '@/components/PortfolioCabinetSheet';
import {
  copyTextWithFallback,
  loadSavedVarMap,
  resolveStopTemplate,
  saveVarMap,
} from '@/utils/atelierCopy';

interface BlueprintPromptSheetProps {
  stop: StudioStop | null;
  open: boolean;
  selectedProjectIdx: number;
  cabinetZoomed: boolean;
  onSelectProjectIdx: (idx: number) => void;
  onSetCabinetZoomed: (zoomed: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  onCloseToOverview: () => void;
}

function renderResolvedNodes(
  template: string,
  variables: StudioStop['variables'],
  values: Record<string, string>
) {
  const tokenRegex = /\{\{(\w+)\}\}/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = tokenRegex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push(template.slice(lastIndex, match.index));
    }
    const key = match[1];
    const variable = variables.find((v) => v.key === key);
    const val = (values[key] ?? variable?.defaultValue ?? '').trim() || variable?.placeholder || `{{${key}}}`;
    parts.push(
      <mark key={`${key}-${idx++}`} className="rounded bg-[#F2C464]/20 px-1 py-0.5 font-semibold text-[#F6D37B]">
        {val}
      </mark>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < template.length) {
    parts.push(template.slice(lastIndex));
  }
  return parts;
}

export function BlueprintPromptSheet({
  stop,
  open,
  selectedProjectIdx,
  cabinetZoomed,
  onSelectProjectIdx,
  onSetCabinetZoomed,
  onPrev,
  onNext,
  onCloseToOverview,
}: BlueprintPromptSheetProps) {
  const [varMap, setVarMap] = useState<Record<string, Record<string, string>>>({});
  const [stampSeqMap, setStampSeqMap] = useState<Record<string, number>>({});
  const [mobileVarsOpen, setMobileVarsOpen] = useState(false);
  const [mobileCabinetGridOpen, setMobileCabinetGridOpen] = useState(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);

  useEffect(() => {
    setVarMap(loadSavedVarMap());
  }, []);

  useEffect(() => {
    if (!stop) return;
    setActiveChapterIdx(0);
    setMobileVarsOpen(false);
    setMobileCabinetGridOpen(false);
    setVarMap((prev) => {
      const defaults = Object.fromEntries(stop.variables.map((v) => [v.key, v.defaultValue]));
      return {
        ...prev,
        [stop.id]: {
          ...defaults,
          ...(prev[stop.id] ?? {}),
        },
      };
    });
  }, [stop]);

  const currentValues = stop ? varMap[stop.id] ?? {} : {};
  const isBook = stop?.category === 'BOOK';
  const isPortfolio = stop?.category === 'PORTFOLIO';
  const activeChapter = isBook && stop?.chapters ? stop.chapters[activeChapterIdx] ?? stop.chapters[0] : null;
  const stampKey = stop ? (isBook ? `${stop.id}:${activeChapterIdx}` : stop.id) : '';
  const stampSeq = stampKey ? (stampSeqMap[stampKey] ?? 0) : 0;

  const hasModifiedVars = Boolean(
    stop?.variables.some((v) => (currentValues[v.key] ?? v.defaultValue) !== v.defaultValue)
  );

  const resolvedPlainText = useMemo(() => {
    if (!stop) return '';
    if (stop.category === 'BOOK' && activeChapter) {
      return `${stop.title}\n[${activeChapter.number}] ${activeChapter.title}\n- 요약: ${activeChapter.summary}\n- 핵심 주제: ${activeChapter.keyTopics.join(', ')}\n\n${activeChapter.sampleSnippet}`;
    }
    return resolveStopTemplate(stop, currentValues);
  }, [stop, currentValues, activeChapter]);

  async function handleCopy() {
    if (!stop || !stampKey) return;
    const ok = await copyTextWithFallback(resolvedPlainText);
    if (ok) {
      setStampSeqMap((prev) => ({ ...prev, [stampKey]: (prev[stampKey] ?? 0) + 1 }));
    }
  }

  function handleResetVars() {
    if (!stop) return;
    const defaults = Object.fromEntries(stop.variables.map((v) => [v.key, v.defaultValue]));
    setVarMap((prev) => {
      const next = { ...prev, [stop.id]: defaults };
      saveVarMap(next);
      return next;
    });
  }

  const visibleSheet = Boolean(open && stop && stop.id !== 'overview' && stop.id !== 'board');
  const isCompactBlueprint = !isBook && !isPortfolio;

  const mobileMaxHClass = isPortfolio
    ? mobileCabinetGridOpen
      ? 'max-h-[68vh]'
      : 'max-h-[55vh]'
    : isBook
    ? 'max-h-[55vh]'
    : mobileVarsOpen
    ? 'max-h-[64vh]'
    : 'max-h-[48vh]';

  return (
    <aside
      aria-label="선택된 건물 청사진 및 교재 시트"
      aria-hidden={!visibleSheet}
      inert={!visibleSheet || undefined}
      className={`bp-sheet-drawer fixed z-30 flex flex-col
        inset-x-2 bottom-2 ${mobileMaxHClass}
        md:inset-x-auto md:bottom-auto md:right-3.5 md:top-[60px] md:max-h-[calc(100vh-172px)]
        ${isCompactBlueprint ? 'md:w-[min(45vw,560px)]' : 'md:w-[min(46vw,580px)]'}
        ${
          visibleSheet
            ? 'pointer-events-auto translate-y-0 opacity-100 md:translate-x-0'
            : 'pointer-events-none translate-y-[108%] opacity-0 md:translate-x-[108%] md:translate-y-0'
        }`}
    >
      {visibleSheet && stop && (
        <div className="flex min-h-0 flex-1 flex-col rounded-[10px] border-[1.5px] border-ink/60 bg-wood p-1.5 sm:p-2 studio-shadow">
          {isPortfolio ? (
            <PortfolioCabinetSheet
              selectedProjectIdx={selectedProjectIdx}
              cabinetZoomed={cabinetZoomed}
              mobileGridOpen={mobileCabinetGridOpen}
              onSetMobileGridOpen={setMobileCabinetGridOpen}
              onSelectProjectIdx={onSelectProjectIdx}
              onSetCabinetZoomed={onSetCabinetZoomed}
              onPrev={onPrev}
              onNext={onNext}
              onCloseToOverview={onCloseToOverview}
            />
          ) : isBook && stop.chapters ? (
            /* BOOKSTOP VARIANT: Semantic Linen/Night-Walnut Textbook & Lecture Syllabus Sheet */
            <div
              className={`relative flex min-h-0 flex-1 flex-col overflow-hidden border-[1.5px] border-ink/40 bg-paper text-ink ${getSheetThudClass(stampSeq)}`}
            >
              <div
                data-dark-surface="true"
                className="flex items-center justify-between gap-2 border-b border-ink/20 bg-[#2E5A44] px-3 py-1 font-mono text-[11px] text-[#FFFDF8] sm:py-1.5"
              >
                <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap tabular-nums">
                  <span className="font-bold text-[#F2C464]">STOP {stop.indexLabel}</span>
                  <span>/ 09</span>
                  <span className="hidden opacity-90 sm:inline">· TEXTBOOK &amp; LECTURE</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:gap-1.5">
                  <button
                    type="button"
                    onClick={onPrev}
                    className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded border border-white/50 bg-white/15 px-2.5 py-1 hover:border-[#F2C464] hover:bg-white/25 sm:min-h-[28px] sm:min-w-0"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded border border-white/50 bg-white/15 px-2.5 py-1 hover:border-[#F2C464] hover:bg-white/25 sm:min-h-[28px] sm:min-w-0"
                  >
                    다음
                  </button>
                  <button
                    type="button"
                    onClick={onCloseToOverview}
                    className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded border border-white/50 bg-white/15 px-2.5 py-1 hover:border-[#F2C464] hover:bg-white/25 sm:min-h-[28px] sm:min-w-0"
                  >
                    닫기
                  </button>
                </div>
              </div>

              <header className="border-b border-ink/20 bg-paper-sub px-3 py-1.5 sm:px-3.5 sm:py-2">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  <span className="font-bold tabular-nums text-accent">{stop.drawingNo}</span>
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-bold text-accent-ink">
                    SAMPLE 교재
                  </span>
                  <span className="hidden text-ink-sec sm:inline">{stop.authorLine}</span>
                </div>
                <h2 className="mt-1 font-sans text-sm font-extrabold leading-snug text-ink sm:text-lg">
                  {stop.title}
                </h2>
              </header>

              {/* Interactive Chapter Tabs */}
              <div className="border-b border-ink/15 bg-paper-sub/80 px-3 py-1.5 sm:py-2">
                <div className="flex flex-wrap gap-2 sm:gap-1.5">
                  {stop.chapters.map((ch, idx) => (
                    <button
                      key={ch.number}
                      type="button"
                      onClick={() => setActiveChapterIdx(idx)}
                      aria-pressed={activeChapterIdx === idx}
                      className={`inline-flex min-h-[44px] items-center rounded-md border px-3 py-1 font-mono text-[11px] font-bold tabular-nums transition-colors sm:min-h-[30px] sm:px-2.5 ${
                        activeChapterIdx === idx
                          ? 'border-ink bg-accent text-accent-ink'
                          : 'border-ink/45 bg-paper text-ink hover:border-accent'
                      }`}
                    >
                      {ch.number}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Chapter Syllabus Body */}
              {activeChapter && (
                <div
                  data-lenis-prevent
                  className="paper-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-2.5 sm:px-4 sm:py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/15 pb-1.5">
                    <h3 className="font-sans text-sm font-bold text-ink sm:text-base">
                      {activeChapter.number}. {activeChapter.title}
                    </h3>
                    <span className="font-mono text-[11px] font-semibold tabular-nums text-accent">
                      {activeChapter.durationOrPages}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-sec sm:text-sm">{activeChapter.summary}</p>
                  <ul className="space-y-1 rounded-lg border border-ink/20 bg-paper-sub/70 p-2.5 text-xs text-ink">
                    {activeChapter.keyTopics.map((topic) => (
                      <li key={topic} className="flex gap-2">
                        <span className="font-mono font-bold text-accent">•</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                  <div
                    data-dark-surface="true"
                    className="rounded-lg border border-ink/30 bg-[#18212B] p-3"
                  >
                    <div className="mb-1 font-mono text-[11px] text-[#F2C464]">CHAPTER SAMPLE SNIPPET</div>
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#F4F8FF]">
                      {activeChapter.sampleSnippet}
                    </pre>
                  </div>
                </div>
              )}

              <ApprovedStamp
                seq={stampSeq}
                variant="paper"
                className="bottom-[62px] right-4 z-20 sm:bottom-[56px] sm:right-5"
              />

              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-ink/15 bg-paper-sub px-3.5 py-2">
                <span className="hidden font-mono text-[10.5px] tracking-wider tabular-nums text-ink-sec sm:inline">
                  E:DEN // {stop.drawingNo}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded border border-ink/50 bg-accent px-3.5 py-1.5 font-mono text-xs font-bold text-accent-ink transition-transform hover:opacity-90 active:scale-95 sm:min-h-[34px] sm:w-auto"
                >
                  실습 샘플 복사
                </button>
              </div>
            </div>
          ) : (
            /* ARCHITECTURAL PROMPT / MCP PRUSSIAN BLUEPRINT SHEET */
            <div
              className={`bp-paper-grid relative flex min-h-0 flex-1 flex-col overflow-hidden border-[1.5px] border-[#112A46] text-bp-ink ${getSheetThudClass(stampSeq)}`}
            >
              <header className="shrink-0 border-b border-white/25 bg-bp-panel/90 px-4 py-2.5 sm:py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="font-bold tracking-wider tabular-nums text-[#F2C464]">
                      {stop.drawingNo}
                    </span>
                    <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-bp-ink">
                      SAMPLE
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] sm:gap-1.5">
                    <button
                      type="button"
                      onClick={onPrev}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-white/45 bg-bp/80 px-2.5 py-0.5 text-bp-ink hover:border-[#F2C464] hover:text-white sm:min-h-[28px] sm:min-w-0 sm:px-2"
                    >
                      이전
                    </button>
                    <button
                      type="button"
                      onClick={onNext}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-white/45 bg-bp/80 px-2.5 py-0.5 text-bp-ink hover:border-[#F2C464] hover:text-white sm:min-h-[28px] sm:min-w-0 sm:px-2"
                    >
                      다음
                    </button>
                    <button
                      type="button"
                      onClick={onCloseToOverview}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-white/45 bg-bp/80 px-2.5 py-0.5 text-bp-ink hover:border-[#F2C464] hover:text-white sm:min-h-[28px] sm:min-w-0 sm:px-2"
                    >
                      닫기
                    </button>
                  </div>
                </div>
                <h2 className="mt-1.5 font-sans text-base font-bold leading-snug text-white sm:text-[17px]">
                  {stop.title}
                </h2>
                <p className="mt-0.5 text-xs text-bp-sec">{stop.summary}</p>
              </header>

              {stop.variables.length > 0 && (
                <div className="shrink-0 border-b border-white/20 bg-bp-panel/45 px-3.5 py-2">
                  <div className="flex items-center justify-between gap-2 sm:hidden">
                    <span className="font-mono text-[11px] text-bp-sec">
                      조건값 <span className="tabular-nums">{stop.variables.length}</span>개
                    </span>
                    <div className="flex items-center gap-2">
                      {hasModifiedVars && (
                        <button
                          type="button"
                          onClick={handleResetVars}
                          className="inline-flex min-h-[44px] shrink-0 items-center rounded border border-white/45 bg-bp px-2.5 py-0.5 font-mono text-[11px] font-semibold text-bp-sec hover:border-[#F2C464] hover:text-white"
                        >
                          초기화
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setMobileVarsOpen((v) => !v)}
                        aria-expanded={mobileVarsOpen}
                        className="inline-flex min-h-[44px] shrink-0 items-center rounded border border-white/45 bg-bp px-3 py-0.5 font-mono text-[11px] font-bold text-[#F2C464]"
                      >
                        {mobileVarsOpen ? '조건값 닫기 ▴' : '조건값 편집 ▾'}
                      </button>
                    </div>
                  </div>
                  <div
                    className={`${
                      mobileVarsOpen ? 'mt-2 grid' : 'hidden sm:grid'
                    } grid-cols-1 gap-1.5 ${
                      stop.variables.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
                    }`}
                  >
                    {stop.variables.map((v) => (
                      <label
                        key={v.key}
                        className="flex min-h-[44px] items-center gap-2 rounded border border-white/35 bg-bp/80 px-2.5 py-1 focus-within:border-[#F2C464] focus-within:ring-1 focus-within:ring-[#F2C464] sm:block sm:min-h-0 sm:px-2"
                      >
                        <span className="shrink-0 font-mono text-[10px] leading-tight text-bp-sec sm:block">
                          {v.label}
                        </span>
                        <input
                          type="text"
                          value={currentValues[v.key] ?? v.defaultValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVarMap((prev) => {
                              const next = {
                                ...prev,
                                [stop.id]: {
                                  ...(prev[stop.id] ?? {}),
                                  [v.key]: val,
                                },
                              };
                              saveVarMap(next);
                              return next;
                            });
                          }}
                          placeholder={v.placeholder}
                          className="min-w-0 flex-1 rounded-sm bg-transparent font-mono text-xs font-semibold text-white placeholder:text-bp-sec/80 focus:outline-none sm:mt-0.5 sm:w-full"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div data-lenis-prevent className="bp-code-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#F4F8FF] sm:text-[12.5px]">
                  {renderResolvedNodes(stop.template, stop.variables, currentValues)}
                </pre>
              </div>

              <ApprovedStamp
                seq={stampSeq}
                variant="blueprint"
                className="bottom-[62px] right-4 z-20 sm:bottom-[54px] sm:right-5"
              />

              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/25 bg-bp-panel/85 px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10.5px] tracking-wider tabular-nums text-bp-sec">
                    E:DEN // {stop.drawingNo}
                  </span>
                  {hasModifiedVars && (
                    <button
                      type="button"
                      onClick={handleResetVars}
                      className="hidden items-center rounded border border-white/40 bg-bp/75 px-2 py-0.5 font-mono text-[10px] font-semibold text-bp-sec hover:border-[#F2C464] hover:text-white sm:inline-flex"
                    >
                      초기값 복원
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex min-h-[44px] items-center rounded border border-[#221C17] bg-[#E2C296] px-3.5 py-1.5 font-mono text-xs font-extrabold text-[#1E1915] transition-transform hover:bg-[#edd2aa] active:scale-95 sm:min-h-[32px]"
                >
                  {stop.category === 'MCP' ? 'JSON 설정 복사' : '프롬프트 복사'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
