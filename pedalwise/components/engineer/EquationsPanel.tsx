"use client";

import type { Config, Metrics } from "@/lib/types";
import { WHEEL_DIAMETER_M } from "@/lib/presets";

import { SectionLabel } from "@/components/SectionLabel";

/**
 * EquationsPanel — the "show the math" surface for the Engineer audience.
 *
 * Renders four canonical formulas with live numeric substitutions pulled
 * from the same metrics object the simulator uses (no recomputation).
 *
 * Typography: HTML/CSS with <sub>/<sup> spans — no KaTeX dependency
 * (project preference: zero new deps for v1.1; see package.json).
 */

export type EquationsPanelProps = {
  config: Config;
  metrics: Metrics;
};

export function EquationsPanel({ config, metrics }: EquationsPanelProps) {
  // ----- Speed–cadence–gear triangle ------------------------------------
  // v[km/h] = (n / 60) · G · π · D · 3.6
  // We display the canonical (n/60)·G·π·D form (m/s) and convert at the end.
  const n = config.cadence;                  // rpm
  const G = metrics.gearRatio;               // ratio
  const D = WHEEL_DIAMETER_M;                // m
  const vMs = (n / 60) * G * Math.PI * D;
  const vKmh = vMs * 3.6;

  // ----- Gross efficiency ----------------------------------------------
  const wMech = metrics.power;               // W
  const wMet  = metrics.metabolicCost;       // W
  const eta   = metrics.grossEfficiency;     // 0..1

  // ----- Knee angle at BDC (form only, value live) ----------------------
  const kneeBDC = metrics.kneeAtBDC;         // deg

  // ----- Joint power share (Σ split) ------------------------------------
  const share = metrics.jointShare;          // hip / knee / ankle fractions
  const IE = metrics.ie;

  return (
    <div className="flex flex-col gap-4" data-testid="equations-panel">
      <SectionLabel>Model · what&apos;s being solved</SectionLabel>

      <Equation
        title="Speed · cadence · gear"
        formula={
          <>
            v = (n / 60) · G · π · D
          </>
        }
        live={
          <>
            v = ({fmt(n)} / 60) · {fmt(G, 2)} · π · {fmt(D, 3)} m = <Mark>{fmt(vMs, 2)} m/s</Mark> = <Mark>{fmt(vKmh, 1)} km/h</Mark>
          </>
        }
      />

      <Equation
        title="Gross efficiency"
        formula={
          <>
            η<sub>gross</sub> = W<sub>mech</sub> / W<sub>metabolic</sub>
          </>
        }
        live={
          <>
            η = {fmt(wMech, 0)} W / {fmt(wMet, 0)} W = <Mark>{(eta * 100).toFixed(2)} %</Mark>
          </>
        }
      />

      <Equation
        title="Joint power (per joint, per stroke)"
        formula={
          <>
            P<sub>joint</sub> = τ · ω<sub>joint</sub> &nbsp;·&nbsp; τ = J<sup>T</sup> · F<sub>pedal</sub>
          </>
        }
        live={
          <>
            hip <Mark>{(share.hip * 100).toFixed(0)} %</Mark> · knee <Mark>{(share.knee * 100).toFixed(0)} %</Mark> · ankle <Mark>{(share.ankle * 100).toFixed(0)} %</Mark>
          </>
        }
      />

      <Equation
        title="Knee flexion at BDC"
        formula={
          <>
            θ<sub>knee, BDC</sub> = π − cos<sup>−1</sup>((S<sup>2</sup> + L<sup>2</sup> − T<sup>2</sup>) / 2SL)
          </>
        }
        live={
          <>
            S = {fmt(config.saddleHeight, 1)} cm · L = {fmt(config.femur, 1)} cm · T = {fmt(config.tibia, 1)} cm · ⇒ θ = <Mark>{kneeBDC.toFixed(1)}°</Mark>
          </>
        }
      />

      <Equation
        title="Index of effectiveness"
        formula={
          <>
            IE = ∫ F<sub>t</sub> dθ / ∫ |F<sub>p</sub>| dθ
          </>
        }
        live={
          <>
            IE = <Mark>{IE.toFixed(3)}</Mark> · L/R bal = <Mark>{(metrics.lrBalance * 100).toFixed(1)} %</Mark>
          </>
        }
      />

      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          lineHeight: 1.5,
          paddingTop: 8,
          borderTop: "1px solid var(--color-border-default)",
        }}
      >
        Sagittal plane only · 3-DOF planar leg · Jacobian-transpose joint torques · closed-form metabolic cost.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Equation row primitive                                            */
/* ------------------------------------------------------------------ */

function Equation({
  title,
  formula,
  live,
}: {
  title: string;
  formula: React.ReactNode;
  live: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="section-label">{title}</div>
      <div
        style={{
          padding: "10px 12px",
          background: "var(--color-bg-alt)",
          border: "1px solid var(--color-border-default)",
          borderRadius: 6,
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 13,
          color: "var(--color-text-primary)",
          lineHeight: 1.6,
        }}
      >
        {formula}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--color-text-secondary)",
          lineHeight: 1.6,
          paddingLeft: 4,
        }}
      >
        {live}
      </div>
    </div>
  );
}

/** Wrap a live number in the accent color so the eye picks it out. */
function Mark({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: "var(--color-accent)", fontWeight: 500 }}>{children}</span>
  );
}

function fmt(v: number, digits = 1): string {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}
