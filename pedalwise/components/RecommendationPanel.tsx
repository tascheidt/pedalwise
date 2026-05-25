"use client";

import { useRef } from "react";

import type { Recommendation } from "@/lib/types";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { SectionLabel } from "./SectionLabel";
import { DeltaHeadline } from "./DeltaHeadline";
import { DiffTable, type DiffTableRow } from "./DiffTable";

/**
 * Crank lengths commercially available, in mm. The optimizer's continuous
 * search lands on any half-mm; the rec panel shows the nearest stock value
 * (CP-053) when the optimum differs from the start by a non-stock amount.
 * Threshold of 0.1 mm tolerates floating-point noise.
 */
const STOCK_CRANKS_MM = [160, 165, 170, 172.5, 175, 177.5];
function isStockCrank(mm: number): boolean {
  return STOCK_CRANKS_MM.some((s) => Math.abs(s - mm) < 0.1);
}

export function RecommendationPanel({
  rec,
  selectedGearIndex,
  onSelectGear,
  onApply,
  onDismiss,
  onExport,
}: {
  rec: Recommendation;
  selectedGearIndex: number;
  onSelectGear: (i: number) => void;
  onApply: () => void;
  onDismiss: () => void;
  onExport: () => void;
}) {
  // PW-106: delta-first headline. `gainPercentPoints` is already in
  // percentage points (e.g. 3.2 for +3.2% gross efficiency). Tone & Voice §5
  // requires "pp" for percentage-point deltas and "gross η" for the quantity.
  const gain = rec.gainPercentPoints;

  // CP-053: crank-length row gets a "nearest stock crank" note when the
  // optimum is a commercial size. (No raw/snapped data exposed by the
  // optimizer, so the note is conditional on the optimum being a stock
  // length AND the delta being non-zero — i.e. the optimizer moved to it.)
  const crankIsStock = isStockCrank(rec.diff.crankLength.optimum);
  const crankNote =
    crankIsStock && Math.abs(rec.diff.crankLength.delta) > 0.05
      ? "nearest stock crank"
      : undefined;

  // Selected gear's cadence overrides the optimizer's continuous cadence in
  // the diff row: when the user picks a non-best gear, the cadence they will
  // *actually* pedal at is dictated by that gear ratio × target speed, not
  // the unconstrained metabolic optimum. Keeping the diff consistent with
  // what Apply commits is what makes the dialogue honest.
  const selectedGear = rec.gears[selectedGearIndex] ?? rec.gears[0];
  const selectedCadence = Math.round(selectedGear.cadenceAtTarget);
  const cadenceRow = {
    label: "Cadence",
    current: rec.diff.cadence.current,
    optimum: selectedCadence,
    delta: selectedCadence - rec.diff.cadence.current,
    unit: "rpm",
    fmt: (v: number) => v.toFixed(0),
    note: selectedGearIndex === 0 ? undefined : `from ${selectedGear.label}`,
  };

  const diffRows: DiffTableRow[] = [
    { label: "Saddle height", ...rec.diff.saddleHeight, unit: "cm" },
    {
      label: "Crank length",
      ...rec.diff.crankLength,
      unit: "mm",
      fmt: (v) => v.toFixed(1),
      note: crankNote,
    },
    cadenceRow,
    { label: "Setback", ...rec.diff.saddleSetback, unit: "cm" },
  ];

  const gearListRef = useRef<HTMLDivElement>(null);
  const handleGearKey = (i: number) => (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = (i + 1) % rec.gears.length;
      onSelectGear(next);
      gearListRef.current
        ?.querySelector<HTMLButtonElement>(`[data-gear-index="${next}"]`)
        ?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (i - 1 + rec.gears.length) % rec.gears.length;
      onSelectGear(prev);
      gearListRef.current
        ?.querySelector<HTMLButtonElement>(`[data-gear-index="${prev}"]`)
        ?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-4" data-testid="recommendation-panel">
      <div className="flex items-baseline justify-between">
        {/* CP-050: "Optimizer found" → "Optimizer converged" */}
        <SectionLabel>Optimizer converged</SectionLabel>
        {/* CP-051: non-converged label → "Did not fully converge" */}
        <Badge tone={rec.converged ? "success" : "warn"}>
          {rec.converged ? "Converged" : "Did not fully converge"}
        </Badge>
      </div>

      {/* PW-106: delta-first headline; large display number, success color
          for improvement, neutral for zero/negative. Suffix names the
          quantity and the comparison baseline in one breath. */}
      <DeltaHeadline value={gain} suffix="pp · gross η vs current setup" />

      <div>
        <SectionLabel className="mb-2">Parameter diff</SectionLabel>
        <DiffTable rows={diffRows} />
      </div>

      <div>
        <SectionLabel className="mb-2">Gear candidates</SectionLabel>
        <div
          ref={gearListRef}
          role="radiogroup"
          aria-label="Gear candidates"
          className="flex flex-col gap-2"
        >
          {rec.gears.map((g, i) => {
            const selected = i === selectedGearIndex;
            const best = i === 0;
            return (
              <button
                type="button"
                key={g.label}
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => onSelectGear(i)}
                onKeyDown={handleGearKey(i)}
                data-testid={`gear-candidate-${i}`}
                data-selected={selected}
                className="rounded-md flex items-center justify-between px-3 py-2 text-left cursor-pointer transition-colors"
                style={{
                  background: selected
                    ? "var(--color-accent-light)"
                    : "var(--color-bg-surface)",
                  border: `1px solid ${selected ? "var(--color-accent)" : "var(--color-border-default)"}`,
                  borderLeftWidth: selected ? 4 : 1,
                  outline: "none",
                }}
              >
                <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{g.label}</div>
                <div className="flex items-center gap-3">
                  <div className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                    {g.cadenceAtTarget.toFixed(0)} rpm @ {rec.metrics.speed.toFixed(0)} km/h
                  </div>
                  <div className="mono" style={{ fontSize: 13 }}>= {g.ratio.toFixed(2)}</div>
                  {best && <Badge tone="info">best</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel className="mb-2">Sensitivity</SectionLabel>
        <div className="flex flex-col gap-1">
          {rec.sensitivity.map((s) => {
            const max = Math.max(0.5, ...rec.sensitivity.map((x) => x.pctImpact));
            const pct = (s.pctImpact / max) * 100;
            return (
              <div key={s.label} className="grid items-center" style={{ gridTemplateColumns: "1fr 2fr 0.7fr", gap: 8 }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{s.label}</div>
                <div className="rounded-sm" style={{ height: 6, background: "var(--color-bg-alt)" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-accent)", borderRadius: 2 }} />
                </div>
                <div className="mono" style={{ fontSize: 10, textAlign: "right", color: "var(--color-text-tertiary)" }}>
                  ±{s.pctImpact.toFixed(2)} pp
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 flex-col">
        <Button
          variant="primary"
          size="lg"
          onClick={onApply}
          data-testid="apply-recommendation"
        >
          Apply to simulation
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onDismiss}
            className="flex-1"
            data-testid="dismiss-recommendation"
          >
            Dismiss
          </Button>
          <Button
            variant="ghost"
            onClick={onExport}
            className="flex-1"
            data-testid="export-recommendation"
          >
            Export report →
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * CP-052: skeleton shows "Solving… {iter}/{maxIter}" while the optimizer is
 * running. `useOptimizer` does not currently expose iteration progress, so
 * iter/maxIter are accepted as optional props with safe fallbacks; the page
 * passes whatever it has. When neither is provided, we render the plain
 * "Solving…" placeholder.
 */
export function RecommendationSkeleton({
  iter,
  maxIter,
}: {
  iter?: number;
  maxIter?: number;
} = {}) {
  const hasProgress = typeof iter === "number" && typeof maxIter === "number";
  const label = hasProgress ? `Solving… ${iter}/${maxIter}` : "Solving…";
  return (
    <div className="flex flex-col gap-4" data-testid="recommendation-skeleton">
      <SectionLabel>Optimizer</SectionLabel>
      <div className="mono pw-pulse" style={{ fontSize: 36, color: "var(--color-text-tertiary)" }}>
        {label}
      </div>
      <div className="flex flex-col gap-2">
        <div className="rounded-md pw-pulse" style={{ height: 12, background: "var(--color-bg-alt)" }} />
        <div className="rounded-md pw-pulse" style={{ height: 12, background: "var(--color-bg-alt)", width: "85%" }} />
        <div className="rounded-md pw-pulse" style={{ height: 12, background: "var(--color-bg-alt)", width: "65%" }} />
      </div>
    </div>
  );
}

/**
 * RecommendationCard — bundles the idle/running/done/error state switch and
 * the surface card chrome that every workspace (SimulatorWorkspace + fitter
 * studio) wraps around the rec panel. Eliminates parallel maintenance when
 * the chrome or state-handling rules evolve. The error branch was previously
 * silently dropped at both call sites; routing it through one component
 * forces a single, visible failure mode.
 */
export type OptimizerState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; rec: Recommendation }
  | { kind: "error"; message: string };

export function RecommendationCard({
  optState,
  selectedGearIndex,
  onSelectGear,
  onApply,
  onDismiss,
  onExport,
}: {
  optState: OptimizerState;
  selectedGearIndex: number;
  onSelectGear: (i: number) => void;
  onApply: () => void;
  onDismiss: () => void;
  onExport: () => void;
}) {
  return (
    <div
      className="rounded-[10px] p-4"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-default)",
      }}
      data-testid="recommendation-card"
    >
      {optState.kind === "idle" && <RecommendationIdle />}
      {optState.kind === "running" && <RecommendationSkeleton />}
      {optState.kind === "done" && (
        <RecommendationPanel
          rec={optState.rec}
          selectedGearIndex={selectedGearIndex}
          onSelectGear={onSelectGear}
          onApply={onApply}
          onDismiss={onDismiss}
          onExport={onExport}
        />
      )}
      {optState.kind === "error" && (
        <div className="flex flex-col gap-3" data-testid="recommendation-error">
          <SectionLabel>Optimizer error</SectionLabel>
          <div
            className="rounded-md p-3"
            style={{
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-danger)",
              color: "var(--color-danger)",
              fontSize: 13,
            }}
          >
            {optState.message}
          </div>
          <Button variant="secondary" onClick={onDismiss} data-testid="dismiss-recommendation-error">
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

export function RecommendationIdle() {
  return (
    <div className="flex flex-col gap-3" data-testid="recommendation-idle">
      <SectionLabel>Recommendation</SectionLabel>
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
        Adjust your rider profile, bike fit, and goal on the left.<br />
        When you’re ready, press <strong>Find optimal fit</strong> to compute the highest-efficiency setup.
      </div>
      <div className="rounded-md p-3" style={{ background: "var(--color-bg-alt)", fontSize: 12, color: "var(--color-text-tertiary)" }}>
        The optimizer searches saddle height, crank length, cadence, and setback simultaneously, then picks the closest commercial gear.
      </div>
    </div>
  );
}
