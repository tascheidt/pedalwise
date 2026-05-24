"use client";

import type { Metrics } from "@/lib/types";

/**
 * IE accent threshold — biomech expert reference bands consider IE ≥ 0.55
 * "trained" (in-range green). Below that, IE renders in default text color.
 * NOTE: Stream J is fixing a per-leg IE regression where values currently
 * report ~0.045; once that lands, IE will be in 0.4-0.7 range and the
 * threshold above will start lighting up green for trained riders.
 */
const IE_TRAINED_THRESHOLD = 0.55;

/**
 * Holmes range for knee flexion at BDC. Canonical band 25–45° per
 * CLAUDE.md §2; semantic coloring on the HUD chiclet mirrors the
 * Diagnostic-panel issue colors.
 */
const HOLMES_MIN = 25;
const HOLMES_MAX = 45;
const HOLMES_AMBER_PAD = 5; // ±5° band outside the range renders amber.

function kneeAtBdcColor(deg: number): string {
  if (deg >= HOLMES_MIN && deg <= HOLMES_MAX) return "var(--color-success)";
  const dist = deg < HOLMES_MIN ? HOLMES_MIN - deg : deg - HOLMES_MAX;
  if (dist <= HOLMES_AMBER_PAD) return "var(--color-warn)";
  return "var(--color-danger)";
}

type Item = {
  value: string;
  unit?: string;
  label: string;
  /** When set, value renders in this color token. */
  color?: string;
  /** When true, render a thin vertical divider BEFORE this item (PW-105). */
  divider?: boolean;
};

export function HudStrip({
  metrics,
  /**
   * `large` controls per-item value size for the legacy in-card placement;
   * the promoted-band placement (PW-105) ships at 28 px by default.
   */
  large = true,
}: {
  metrics: Metrics;
  large?: boolean;
}) {
  const ieIsTrained = metrics.ie >= IE_TRAINED_THRESHOLD;

  const items: Item[] = [
    { value: metrics.speed.toFixed(0), unit: " km/h", label: "speed" },
    { value: metrics.cadence.toFixed(0), unit: " rpm", label: "cadence" },
    { value: metrics.power.toFixed(0), unit: " W", label: "power" },
    {
      // CP-020: "gross effic." → "gross η"
      value: (metrics.grossEfficiency * 100).toFixed(1) + "%",
      label: "gross η",
      color: "var(--color-success)",
    },
    // PW-105: divider between drivetrain (above) and biomechanics (below).
    {
      value: metrics.kneeAtBDC.toFixed(0) + "°",
      label: "knee@BDC",
      color: kneeAtBdcColor(metrics.kneeAtBDC),
      divider: true,
    },
    {
      value: metrics.ie.toFixed(2),
      label: "IE",
      // Green when in trained range (≥ 0.55); default text color otherwise.
      color: ieIsTrained ? "var(--color-success)" : "var(--color-text-primary)",
    },
  ];
  const valueSize = large ? 28 : 22;

  return (
    <div
      className="flex items-baseline flex-wrap gap-x-6 gap-y-2"
      data-testid="hud-strip"
    >
      {items.map((it, i) => (
        <div key={i} className="flex items-baseline gap-1">
          {it.divider && (
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: 1,
                height: Math.round(valueSize * 0.8),
                background: "var(--color-border-default)",
                marginRight: 18,
                alignSelf: "center",
              }}
            />
          )}
          <span
            className="mono"
            style={{
              fontSize: valueSize,
              fontWeight: 500,
              color: it.color ?? "var(--color-text-primary)",
            }}
          >
            {it.value}{it.unit ?? ""}
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}
