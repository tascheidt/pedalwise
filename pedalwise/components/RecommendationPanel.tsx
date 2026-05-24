"use client";

import type { Recommendation } from "@/lib/types";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { SectionLabel } from "./SectionLabel";

function DiffRow({
  label, current, optimum, delta, unit, fmt = (v) => v.toFixed(1), deltaFmt,
}: {
  label: string;
  current: number;
  optimum: number;
  delta: number;
  unit: string;
  fmt?: (v: number) => string;
  deltaFmt?: (v: number) => string;
}) {
  const sign = delta > 0 ? "+" : "";
  const isChange = Math.abs(delta) > 0.05;
  return (
    <div
      className="grid items-baseline mono"
      style={{ gridTemplateColumns: "1.1fr 0.9fr 0.9fr 0.6fr", fontSize: 12, padding: "6px 0" }}
    >
      <div style={{ color: "var(--color-text-secondary)" }}>{label}</div>
      <div style={{ color: "var(--color-text-tertiary)" }}>{fmt(current)} {unit}</div>
      <div style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{fmt(optimum)} {unit}</div>
      <div style={{ color: isChange ? "var(--color-success)" : "var(--color-text-tertiary)", textAlign: "right" }}>
        {isChange ? `${sign}${(deltaFmt ?? fmt)(delta)} ${unit}` : "same"}
      </div>
    </div>
  );
}

export function RecommendationPanel({
  rec,
  onApply,
  onDismiss,
  onExport,
}: {
  rec: Recommendation;
  onApply: () => void;
  onDismiss: () => void;
  onExport: () => void;
}) {
  const gain = rec.gainPercentPoints;
  const gainPositive = gain > 0.05;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <SectionLabel>Optimizer found</SectionLabel>
        <Badge tone={rec.converged ? "success" : "warn"}>
          {rec.converged ? "Converged" : "Best of 8 starts"}
        </Badge>
      </div>

      <div>
        <div
          className="mono"
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: gainPositive ? "var(--color-success)" : "var(--color-text-primary)",
            lineHeight: 1,
          }}
        >
          {gainPositive ? "+" : ""}{gain.toFixed(1)}%
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>
          gross efficiency vs current configuration
        </div>
      </div>

      <div>
        <SectionLabel className="mb-2">Parameter diff</SectionLabel>
        <div className="grid mono" style={{ gridTemplateColumns: "1.1fr 0.9fr 0.9fr 0.6fr", fontSize: 10, color: "var(--color-text-tertiary)", borderBottom: "1px solid var(--color-border-default)", paddingBottom: 4 }}>
          <div>Parameter</div><div>Current</div><div>Optimum</div><div style={{ textAlign: "right" }}>Δ</div>
        </div>
        <DiffRow label="Saddle height" {...rec.diff.saddleHeight} unit="cm" />
        <DiffRow label="Crank length" {...rec.diff.crankLength} unit="mm" fmt={(v) => v.toFixed(1)} />
        <DiffRow label="Cadence"       {...rec.diff.cadence} unit="rpm" fmt={(v) => v.toFixed(0)} />
        <DiffRow label="Setback"       {...rec.diff.saddleSetback} unit="cm" />
      </div>

      <div>
        <SectionLabel className="mb-2">Gear candidates</SectionLabel>
        <div className="flex flex-col gap-2">
          {rec.gears.map((g, i) => {
            const best = i === 0;
            return (
              <div
                key={g.label}
                className="rounded-md flex items-center justify-between px-3 py-2"
                style={{
                  background: best ? "var(--color-accent-light)" : "var(--color-bg-surface)",
                  border: `1px solid ${best ? "var(--color-accent)" : "var(--color-border-default)"}`,
                  borderLeftWidth: best ? 4 : 1,
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
              </div>
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
        <Button variant="primary" size="lg" onClick={onApply}>Apply to simulation</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onDismiss} className="flex-1">Dismiss</Button>
          <Button variant="ghost" onClick={onExport} className="flex-1">Export report →</Button>
        </div>
      </div>
    </div>
  );
}

export function RecommendationSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <SectionLabel>Optimizer</SectionLabel>
      <div className="mono pw-pulse" style={{ fontSize: 36, color: "var(--color-text-tertiary)" }}>
        Solving…
      </div>
      <div className="flex flex-col gap-2">
        <div className="rounded-md pw-pulse" style={{ height: 12, background: "var(--color-bg-alt)" }} />
        <div className="rounded-md pw-pulse" style={{ height: 12, background: "var(--color-bg-alt)", width: "85%" }} />
        <div className="rounded-md pw-pulse" style={{ height: 12, background: "var(--color-bg-alt)", width: "65%" }} />
      </div>
    </div>
  );
}

export function RecommendationIdle() {
  return (
    <div className="flex flex-col gap-3">
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
