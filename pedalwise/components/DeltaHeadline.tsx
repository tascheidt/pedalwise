"use client";

/**
 * DeltaHeadline (PW-106) — large signed numeric headline for the
 * recommendation panel. Lead with the delta, name the quantity in a caption.
 * Color is semantic: green for improvement, neutral for zero or negative.
 *
 * Per Tone & Voice §5: deltas are always signed (+1.5, −2.5), "unchanged"
 * when zero. Per principle #4, numbers are the second visual layer — render
 * in display weight, monospaced for tabular alignment.
 *
 * Reduced motion is respected at the source: this component does not animate
 * (it re-renders on prop change; CSS transitions on numbers are intentionally
 * absent so prefers-reduced-motion is a no-op).
 */
export function DeltaHeadline({
  value,
  suffix,
  precision = 1,
}: {
  /** Signed value in display units (e.g. percentage points for Δη). */
  value: number;
  /** Caption rendered next to / below the value, e.g. "pp · gross η vs current setup". */
  suffix: string;
  /** Decimals to render. Default 1 — matches §5 efficiency precision. */
  precision?: number;
}) {
  const threshold = Math.pow(10, -precision) / 2; // round-aware "no change" cutoff
  const isImprovement = value > threshold;
  const isNeutral = Math.abs(value) <= threshold;

  // §5: signed. "−" (U+2212) for negative, "+" for positive, "unchanged" for ~0.
  const sign = isNeutral ? "" : value > 0 ? "+" : "−";
  const magnitude = Math.abs(value).toFixed(precision);
  const display = isNeutral ? "unchanged" : `${sign}${magnitude}`;

  const color = isImprovement
    ? "var(--color-success)"
    : "var(--color-text-primary)";

  // PW-106 ticket test: "When delta is 0 or negative, headline switches to
  // neutral color and prepends 'No improvement found.'"
  const prefix = !isImprovement && !isNeutral ? "No improvement found · " : "";

  return (
    <div className="flex flex-col gap-1" data-testid="delta-headline">
      {prefix && (
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-secondary)",
            letterSpacing: "0.02em",
          }}
        >
          No improvement found
        </div>
      )}
      <div
        className="mono"
        style={{
          fontSize: 44,
          fontWeight: 600,
          lineHeight: 1,
          color,
          letterSpacing: "-0.02em",
        }}
      >
        {display}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--color-text-secondary)",
          lineHeight: 1.4,
        }}
      >
        {suffix}
      </div>
    </div>
  );
}
