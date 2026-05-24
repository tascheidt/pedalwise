"use client";

/**
 * DiffTable (PW-106) — extracted from RecommendationPanel's inline DiffRow.
 * Renders a param-by-param current/optimum/delta grid with semantic delta
 * coloring (green when changed, muted when unchanged). One unit per number
 * (§Tone & Voice §5.4), signed deltas with U+2212 minus.
 *
 * Keeps the existing four columns: label · current · optimum · Δ.
 * Header row optional (default on).
 */
export type DiffTableRow = {
  label: string;
  current: number;
  optimum: number;
  delta: number;
  unit: string;
  /** Custom value formatter; default toFixed(1). */
  fmt?: (v: number) => string;
  /** Custom delta formatter; falls back to fmt. */
  deltaFmt?: (v: number) => string;
  /** Optional small note appended to the optimum cell (e.g. "nearest stock crank"). */
  note?: string;
};

const DEFAULT_FMT = (v: number) => v.toFixed(1);

function Row({ row }: { row: DiffTableRow }) {
  const fmt = row.fmt ?? DEFAULT_FMT;
  const dFmt = row.deltaFmt ?? fmt;
  const isChange = Math.abs(row.delta) > 0.05;
  // §5: signed deltas. U+2212 for negatives, "+" for positives.
  const sign = row.delta > 0 ? "+" : row.delta < 0 ? "−" : "";
  const deltaText = isChange
    ? `${sign}${dFmt(Math.abs(row.delta))} ${row.unit}`
    : "unchanged";

  return (
    <div
      className="grid items-baseline mono"
      style={{
        gridTemplateColumns: "1.1fr 0.9fr 0.9fr 0.7fr",
        fontSize: 12,
        padding: "6px 0",
      }}
      data-testid={`diff-row-${row.label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div style={{ color: "var(--color-text-secondary)" }}>{row.label}</div>
      <div style={{ color: "var(--color-text-tertiary)" }}>
        {fmt(row.current)} {row.unit}
      </div>
      <div style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
        {fmt(row.optimum)} {row.unit}
        {row.note && (
          <span
            className="italic"
            style={{
              fontSize: 10,
              color: "var(--color-text-tertiary)",
              marginLeft: 6,
              fontStyle: "italic",
            }}
          >
            {row.note}
          </span>
        )}
      </div>
      <div
        style={{
          color: isChange ? "var(--color-success)" : "var(--color-text-tertiary)",
          textAlign: "right",
        }}
      >
        {deltaText}
      </div>
    </div>
  );
}

export function DiffTable({
  rows,
  showHeader = true,
}: {
  rows: DiffTableRow[];
  showHeader?: boolean;
}) {
  return (
    <div data-testid="diff-table">
      {showHeader && (
        <div
          className="grid mono"
          style={{
            gridTemplateColumns: "1.1fr 0.9fr 0.9fr 0.7fr",
            fontSize: 10,
            color: "var(--color-text-tertiary)",
            borderBottom: "1px solid var(--color-border-default)",
            paddingBottom: 4,
          }}
        >
          <div>Parameter</div>
          <div>Current</div>
          <div>Optimum</div>
          <div style={{ textAlign: "right" }}>Δ</div>
        </div>
      )}
      {rows.map((r) => (
        <Row key={r.label} row={r} />
      ))}
    </div>
  );
}
