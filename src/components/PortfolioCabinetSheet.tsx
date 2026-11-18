'use client';

import { useState } from 'react';
import { ApprovedStamp, getSheetThudClass } from '@/components/ApprovedStamp';
import { EDEN_FEATURED_PROJECTS } from '@/data/edenPortfolioData';
import { copyTextWithFallback } from '@/utils/atelierCopy';

interface PortfolioCabinetSheetProps {
  selectedProjectIdx: number;
  cabinetZoomed: boolean;
  mobileGridOpen?: boolean;
  onSetMobileGridOpen?: (open: boolean) => void;
  onSelectProjectIdx: (idx: number) => void;
  onSetCabinetZoomed: (zoomed: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  onCloseToOverview: () => void;
}

export function PortfolioCabinetSheet({
  selectedProjectIdx,
  cabinetZoomed,
  mobileGridOpen: controlledGridOpen,
  onSetMobileGridOpen,
  onSelectProjectIdx,
  onSetCabinetZoomed,
  onPrev,
  onNext,
  onCloseToOverview,
}: PortfolioCabinetSheetProps) {
  const [internalGridOpen, setInternalGridOpen] = useState(false);
  const mobileGridOpen = controlledGridOpen ?? internalGridOpen;
  const setMobileGridOpen = onSetMobileGridOpen ?? setInternalGridOpen;

  const [stampSeqMap, setStampSeqMap] = useState<Record<string, number>>({});

  const project = EDEN_FEATURED_PROJECTS[selectedProjectIdx] ?? EDEN_FEATURED_PROJECTS[0];
  const stampSeq = stampSeqMap[project.id] ?? 0;

  async function handleCopySpec() {
    const specText = [
      `[${project.code}] ${project.name} (${project.year})`,
      `위치: ${project.location}`,
      `용도: ${project.usage} | 규모: ${project.scale} | 구조: ${project.structure}`,
      `대지: ${project.siteArea} | 건축: ${project.buildingArea} | 연면적: ${project.grossFloorArea}`,
      project.award ? `수상: ${project.award}` : null,
      `개요: ${project.summary}`,
      project.url ? `상세: ${project.url}` : null,
      `문의: (주)이든건축사사무소 (054-283-9141 / http://www.e-den.kr)`,
    ]
      .filter(Boolean)
      .join('\n');

    const ok = await copyTextWithFallback(specText);
    if (ok) {
      setStampSeqMap((prev) => ({ ...prev, [project.id]: (prev[project.id] ?? 0) + 1 }));
    }
  }

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden border-[1.5px] border-ink/40 bg-paper text-ink ${getSheetThudClass(stampSeq)}`}
    >
      {/* Top Walnut & Brass Gallery Header */}
      <div
        data-dark-surface="true"
        className="flex items-center justify-between gap-2 border-b border-ink/20 bg-[#3B2E24] px-3 py-1 font-mono text-[11px] text-[#FFFDF8] sm:py-1.5"
      >
        <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap tabular-nums">
          <span className="font-bold text-[#F2C464]">STOP 08</span>
          <span>/ 09</span>
          <span className="hidden opacity-90 sm:inline">· 3×3 PORTFOLIO CABINET</span>
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

      {/* Archival Exhibition Plate Header */}
      <header className="border-b border-ink/20 bg-paper-sub px-3 py-1.5 sm:px-3.5 sm:py-2">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <span className="rounded bg-brass px-1.5 py-0.5 font-bold tabular-nums text-accent-ink">
            {project.code}
          </span>
          <span className="font-semibold tabular-nums text-ink-sec">{project.year}</span>
          {project.award && (
            <span className="rounded border border-brass/50 bg-card px-1.5 py-0.5 font-semibold text-brass">
              {project.award}
            </span>
          )}
        </div>
        <h2 className="mt-1 font-sans text-base font-extrabold leading-snug text-ink sm:text-lg">
          {project.name}
        </h2>
      </header>

      {/* Interactive 3x3 Showcase Cubby Selector Synced with 3D Cabinet */}
      <div className="border-b border-ink/15 bg-paper-sub/85 px-3 py-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] font-bold text-ink-sec">
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline">3×3 장식장 진열 칸 선택 (클릭 시 3D 클로즈업)</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-brass">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brass" />
              수상작
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileGridOpen(!mobileGridOpen)}
              aria-expanded={mobileGridOpen}
              className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-ink/50 bg-card px-3 py-0.5 font-mono text-[11px] font-bold text-ink sm:hidden"
            >
              {mobileGridOpen ? '목록 닫기 ▴' : '다른 작품 9선 ▾'}
            </button>
            <button
              type="button"
              onClick={() => onSetCabinetZoomed(!cabinetZoomed)}
              className={`inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-0.5 font-mono text-[11px] font-bold transition-colors sm:min-h-[26px] sm:px-2.5 sm:text-[10px] ${
                cabinetZoomed
                  ? 'border-ink bg-[#F2C464] text-[#221C17] hover:bg-[#f6d37b]'
                  : 'border-brass/60 bg-card text-brass hover:border-ink hover:text-ink'
              }`}
            >
              {cabinetZoomed ? '전체 보기 ↩' : '3D 클로즈업 →'}
            </button>
          </div>
        </div>

        <div
          className={`${
            mobileGridOpen ? 'mt-1.5 grid' : 'hidden sm:mt-1.5 sm:grid'
          } grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-1`}
        >
          {EDEN_FEATURED_PROJECTS.map((item, idx) => {
            const active = idx === selectedProjectIdx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (idx === selectedProjectIdx && cabinetZoomed) {
                    onSetCabinetZoomed(false);
                  } else {
                    onSelectProjectIdx(idx);
                    onSetCabinetZoomed(true);
                  }
                  setMobileGridOpen(false);
                }}
                aria-pressed={active}
                className={`flex min-h-[44px] items-center justify-between gap-1 rounded border px-2 py-1 text-left transition-colors sm:min-h-[28px] ${
                  active
                    ? 'border-ink bg-accent text-accent-ink'
                    : 'border-ink/40 bg-paper text-ink hover:border-brass'
                }`}
              >
                <span className="truncate font-sans text-[11px] font-bold">
                  <span
                    className={`mr-1 font-mono text-[10px] tabular-nums ${
                      active ? 'text-accent-ink opacity-85' : 'text-brass'
                    }`}
                  >
                    {item.code.replace('ARC-', '')}
                  </span>
                  {item.name}
                  {item.award && <span className="sr-only"> (수상작)</span>}
                </span>
                {item.award && (
                  <span
                    title="수상작"
                    aria-hidden="true"
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      active ? 'bg-accent-ink' : 'bg-brass'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Work Archival Summary & Verified Spec Grid */}
      <div
        data-lenis-prevent
        className="paper-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 py-2 sm:px-4"
      >
        <div className="rounded-lg border border-ink/20 bg-paper-sub/70 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-sec">
            <span className="font-mono font-semibold text-ink">{project.location}</span>
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center whitespace-nowrap font-mono text-[11px] font-bold text-accent underline underline-offset-2 hover:opacity-80 sm:min-h-0"
              >
                공식 상세 사진·도면 보기 (e-den.kr)&nbsp;↗
              </a>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink sm:text-[13px]">{project.summary}</p>
        </div>

        {/* 6-Cell Verified Specification Table */}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {[
            { label: '주용도', value: project.usage },
            { label: '규모', value: project.scale },
            { label: '구조', value: project.structure },
            { label: '대지면적', value: project.siteArea },
            { label: '건축면적', value: project.buildingArea },
            { label: '연면적', value: project.grossFloorArea },
          ].map((spec) => (
            <div key={spec.label} className="rounded border border-ink/20 bg-card/90 px-2.5 py-1.5">
              <div className="font-mono text-[10px] font-bold text-ink-muted">{spec.label}</div>
              <div className="mt-0.5 font-sans text-xs font-bold tabular-nums text-ink">{spec.value}</div>
            </div>
          ))}
        </div>
      </div>

      <ApprovedStamp
        seq={stampSeq}
        variant="paper"
        className="bottom-[62px] right-4 z-20 sm:bottom-[54px] sm:right-5"
      />

      {/* Archival Action Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-ink/15 bg-paper-sub px-3.5 py-2">
        <span className="font-mono text-[10.5px] tracking-wider tabular-nums text-ink-sec">
          E:DEN // {project.code}
        </span>
        <button
          type="button"
          onClick={handleCopySpec}
          className="inline-flex min-h-[44px] items-center rounded border border-ink/50 bg-accent px-3.5 py-1.5 font-mono text-xs font-bold text-accent-ink transition-transform hover:opacity-90 active:scale-95 sm:min-h-[32px]"
        >
          작품 제원 복사
        </button>
      </div>
    </div>
  );
}
