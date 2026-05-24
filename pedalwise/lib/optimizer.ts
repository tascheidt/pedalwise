import type { Config, GearCandidate, Recommendation } from "./types";
import { evaluate } from "./kinematics";
import { CHAINRINGS, COGS, WHEEL_DIAMETER_M } from "./presets";

/**
 * Saddle-height target from LeMond + Holmes heuristics.
 *
 * LeMond's canonical multiplier (0.883 × inseam + 1.5 cm) targets the
 * BB-to-saddle distance *measured along the seat tube* — typical road seat-
 * tube angles run ≈ 73°, so the slope length and the vertical drop differ.
 * Our 2D sagittal model uses `saddleHeight` as a vertical world y-coordinate
 * (see geometry.ts: `sy = cfg.saddleHeight`), so we project LeMond's number
 * onto the vertical: cos(17°) ≈ 0.956, giving 0.883 × 0.956 ≈ 0.844.
 *
 * The +1.5 cm shoe-stack offset is similarly projected. If users want to
 * cross-check against a bike-fit chart that reports seat-tube length, divide
 * the simulator's saddleHeight by 0.956.
 */
function saddleHeightHeuristic(femur: number, tibia: number, foot: number): number {
  const inseam = femur + tibia + foot * 0.4;
  return inseam * 0.844 + 1.44;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function configWith(cfg: Config, patch: Partial<Config>): Config {
  return { ...cfg, ...patch };
}

/** Human-readable label for an elasticity row key. */
function labelFor(key: string): string {
  switch (key) {
    case "saddleHeight":  return "Saddle height";
    case "crankLength":   return "Crank length";
    case "cadence":       return "Cadence";
    case "saddleSetback": return "Setback";
    default:              return key;
  }
}

/** Local hill climber over (saddleHeight, crankLength, cadence, setback). */
function hillClimb(start: Config): { best: Config; converged: boolean } {
  let cur = start;
  let curM = evaluate(cur).grossEfficiency;
  const steps = [
    { key: "saddleHeight", delta: 0.5, lo: 55, hi: 95 },
    { key: "crankLength",  delta: 2.5, lo: 150, hi: 180 },
    { key: "cadence",      delta: 1,   lo: 55, hi: 120 },
    { key: "saddleSetback",delta: 0.5, lo: 0, hi: 12 },
  ] as const;

  let improved = true;
  let iters = 0;
  while (improved && iters < 200) {
    improved = false;
    iters++;
    for (const s of steps) {
      for (const sign of [-1, 1]) {
        const next = configWith(cur, {
          [s.key]: clamp((cur as unknown as Record<string, number>)[s.key] + s.delta * sign, s.lo, s.hi),
        } as Partial<Config>);
        const m = evaluate(next);
        if (m.geometryImpossible) continue;
        if (m.grossEfficiency > curM + 1e-5) {
          cur = next;
          curM = m.grossEfficiency;
          improved = true;
        }
      }
    }
  }
  return { best: cur, converged: iters < 200 };
}

/** Multi-start optimizer: 8 random perturbations, pick the best. */
export function optimize(start: Config): Recommendation {
  const currentMetrics = evaluate(start);
  const seeds: Config[] = [start];
  // Targeted seed using the heuristic saddle height
  seeds.push(configWith(start, {
    saddleHeight: clamp(saddleHeightHeuristic(start.femur, start.tibia, start.foot), 55, 95),
    cadence: 88,
  }));
  for (let i = 0; i < 6; i++) {
    seeds.push(configWith(start, {
      saddleHeight: clamp(start.saddleHeight + (Math.random() - 0.5) * 6, 55, 95),
      crankLength: clamp(start.crankLength + (Math.random() - 0.5) * 10, 150, 180),
      cadence: clamp(80 + Math.random() * 20, 65, 110),
      saddleSetback: clamp(start.saddleSetback + (Math.random() - 0.5) * 4, 0, 12),
    }));
  }

  let best: Config = start;
  let bestE = -Infinity;
  let converged = false;
  for (const seed of seeds) {
    const { best: b, converged: c } = hillClimb(seed);
    const e = evaluate(b).grossEfficiency;
    if (e > bestE) {
      bestE = e;
      best = b;
      converged = c;
    }
  }

  const m = evaluate(best);
  const gain = (m.grossEfficiency - currentMetrics.grossEfficiency) * 100;

  // Gear candidates: search commercial chainring × cog combos that bring
  // cadence closest to optimum at the target speed.
  const speedMs = m.speed / 3.6;
  const wheelCircM = Math.PI * WHEEL_DIAMETER_M;
  const candidates: GearCandidate[] = [];
  for (const cr of CHAINRINGS) {
    for (const cog of COGS) {
      const ratio = cr / cog;
      const cadenceAt = (speedMs * 60) / (ratio * wheelCircM);
      candidates.push({
        chainring: cr,
        cog,
        ratio,
        cadenceAtTarget: cadenceAt,
        label: `${cr} × ${cog}`,
      });
    }
  }
  candidates.sort((a, b) => Math.abs(a.cadenceAtTarget - m.cadence) - Math.abs(b.cadenceAtTarget - m.cadence));
  const topGears = candidates.slice(0, 3);

  // Sensitivity bars — per-unit elasticities (fixed physical delta per
  // parameter, evaluated as centered finite differences). Reports
  // "GE percentage-points per delta-unit", comparable across parameters.
  // Replaces the prior ±5% perturbation, whose units differed across rows.
  const elasticities = [
    { key: "saddleHeight",  delta: 1.0,  unit: "1 cm",   lo: 55,  hi: 95  },
    { key: "crankLength",   delta: 2.5,  unit: "2.5 mm", lo: 150, hi: 180 },
    { key: "cadence",       delta: 2.0,  unit: "2 rpm",  lo: 55,  hi: 120 },
    { key: "saddleSetback", delta: 0.5,  unit: "0.5 cm", lo: 0,   hi: 12  },
  ] as const;

  const sensitivity = elasticities.map(({ key, delta, unit, lo, hi }) => {
    const base = (best as unknown as Record<string, number>)[key];
    const plusVal  = Math.min(hi, base + delta);
    const minusVal = Math.max(lo, base - delta);
    const effDelta = (plusVal - minusVal) / 2; // ≈ delta unless clamped
    const plusE  = evaluate(
      configWith(best, { [key]: plusVal } as Partial<Config>),
    ).grossEfficiency;
    const minusE = evaluate(
      configWith(best, { [key]: minusVal } as Partial<Config>),
    ).grossEfficiency;
    // Per-unit elasticity: |ΔGE| over the actual span, scaled to delta.
    // (When unclamped, this reduces to |plusE − minusE| / 2 × 100.)
    const denom = 2 * Math.max(effDelta, 1e-6);
    const pctImpact = (Math.abs(plusE - minusE) / denom) * delta * 100;
    return {
      label: `${labelFor(key)} (per ${unit})`,
      pctImpact,
    };
  });

  return {
    fit: {
      crankLength: best.crankLength,
      saddleHeight: best.saddleHeight,
      saddleSetback: best.saddleSetback,
    },
    goal: { cadence: best.cadence },
    metrics: m,
    gainPercentPoints: gain,
    diff: {
      saddleHeight: {
        current: start.saddleHeight,
        optimum: best.saddleHeight,
        delta: best.saddleHeight - start.saddleHeight,
      },
      crankLength: {
        current: start.crankLength,
        optimum: best.crankLength,
        delta: best.crankLength - start.crankLength,
      },
      cadence: {
        current: start.cadence,
        optimum: best.cadence,
        delta: best.cadence - start.cadence,
      },
      saddleSetback: {
        current: start.saddleSetback,
        optimum: best.saddleSetback,
        delta: best.saddleSetback - start.saddleSetback,
      },
    },
    gears: topGears,
    sensitivity,
    trained: start.fastTwitchPct >= 45,
    converged,
  };
}
