"use client";

/**
 * Draft persistence for the DIY 5-step guided fit (PW-102).
 *
 * The Config under construction lives in its own LocalStorage key —
 * `pedalwise.diy.draft` — separate from `pedalwise.workspace` (which is
 * cross-persona) so a partial DIY run does not leak into the Fitter or
 * Engineer chrome.
 *
 * Wire format is a `DiyDraft`: the in-progress `Config` plus a
 * `furthest` slug, used by StepRail to disable steps the user has not
 * yet reached. A reload restores both, so a refresh on `/diy/goal`
 * lands back on `/diy/goal` with sliders filled.
 */

import { useCallback, useEffect, useState } from "react";

import type { Config } from "@/lib/types";
import { DEFAULT_CONFIG } from "@/lib/presets";

export const DIY_STEPS = ["welcome", "anatomy", "current-fit", "goal", "simulate"] as const;

export type DiyStep = (typeof DIY_STEPS)[number];

const STORAGE_KEY = "pedalwise.diy.draft";

export type DiyDraft = {
  config: Config;
  /** Furthest step the user has reached — controls StepRail enable/disable. */
  furthest: DiyStep;
};

const DEFAULT_DRAFT: DiyDraft = {
  config: DEFAULT_CONFIG,
  furthest: "welcome",
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function readDiyDraft(): DiyDraft {
  if (!canUseStorage()) return DEFAULT_DRAFT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_DRAFT;
    const parsed = JSON.parse(raw) as Partial<DiyDraft>;
    if (!parsed || typeof parsed !== "object" || !parsed.config) return DEFAULT_DRAFT;
    const furthest: DiyStep = isDiyStep(parsed.furthest) ? parsed.furthest : "welcome";
    return { config: parsed.config, furthest };
  } catch {
    return DEFAULT_DRAFT;
  }
}

export function writeDiyDraft(draft: DiyDraft): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Quota / private mode — ignore.
  }
}

export function clearDiyDraft(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isDiyStep(v: unknown): v is DiyStep {
  return typeof v === "string" && (DIY_STEPS as readonly string[]).includes(v);
}

export function stepIndex(s: DiyStep): number {
  return DIY_STEPS.indexOf(s);
}

/**
 * React hook around the draft. SSR-safe — initial render returns
 * `DEFAULT_DRAFT`, then a post-mount effect rehydrates from LocalStorage.
 */
export function useDiyDraft() {
  const [draft, setDraft] = useState<DiyDraft>(DEFAULT_DRAFT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(readDiyDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeDiyDraft(draft);
  }, [draft, hydrated]);

  const updateConfig = useCallback((patch: Partial<Config>) => {
    setDraft((d) => ({ ...d, config: { ...d.config, ...patch } }));
  }, []);

  const markFurthest = useCallback((step: DiyStep) => {
    setDraft((d) => {
      if (stepIndex(step) <= stepIndex(d.furthest)) return d;
      return { ...d, furthest: step };
    });
  }, []);

  const reset = useCallback(() => {
    setDraft(DEFAULT_DRAFT);
    clearDiyDraft();
  }, []);

  return { draft, hydrated, updateConfig, markFurthest, reset };
}
