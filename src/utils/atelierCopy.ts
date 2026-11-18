import type { StudioStop } from '@/data/atelierStations';

export const SESSION_VARS_KEY = 'eden_atelier_vars_v2';

export async function copyTextWithFallback(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }
  if (typeof document === 'undefined') return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function resolveStopTemplate(
  stop: StudioStop,
  overrides?: Record<string, string>
): string {
  if (stop.category === 'BOOK') {
    const chLines = (stop.chapters ?? []).map(
      (c) => `[${c.number}] ${c.title} — ${c.summary}\n${c.sampleSnippet}`
    );
    return [stop.title, stop.template, ...chLines].filter(Boolean).join('\n\n');
  }
  return stop.variables.reduce((acc, v) => {
    const val = (overrides?.[v.key] ?? v.defaultValue).trim() || v.placeholder;
    return acc.split(`{{${v.key}}}`).join(val);
  }, stop.template);
}

export function loadSavedVarMap(): Record<string, Record<string, string>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_VARS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveVarMap(map: Record<string, Record<string, string>>): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SESSION_VARS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota / private mode failure
  }
}
