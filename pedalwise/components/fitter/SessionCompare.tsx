"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Session } from "@/lib/types";
import { evaluate } from "@/lib/kinematics";

import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";
import { DeltaHeadline } from "@/components/DeltaHeadline";
import { DiffTable, type DiffTableRow } from "@/components/DiffTable";

/**
 * SessionCompare (PW-103) — modal that diffs two sessions side-by-side.
 *
 * User picks a baseline (left) and a comparison (right) from the same client's
 * session list. Each column shows the session's current fit + key metrics; a
 * bottom DiffTable summarises Δsaddle, Δsetback, Δcrank, Δη, Δknee@BDC.
 *
 * Single kinematic model: metrics come from `evaluate(config)` — no per-mode
 * recomputation, no duplicated physics.
 *
 * Modal a11y: focus trapped to the dialog container, Escape closes.
 */
export function SessionCompare({
  sessions,
  initialBaselineId,
  initialCompareId,
  onClose,
}: {
  sessions: Session[];
  initialBaselineId: string | null;
  initialCompareId: string | null;
  onClose: () => void;
}) {
  const sorted = sessions; // already sorted newest-first by storage helper
  const defaultBaseline = initialBaselineId ?? sorted[1]?.id ?? sorted[0]?.id ?? "";
  const defaultCompare = initialCompareId ?? sorted[0]?.id ?? sorted[1]?.id ?? "";

  const [baselineId, setBaselineId] = useState<string>(defaultBaseline);
  const [compareId, setCompareId] = useState<string>(defaultCompare);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Focus trap: focus close button on mount, Escape closes, click outside closes.
  useEffect(() => {
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, select, input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const baseline = sorted.find((s) => s.id === baselineId) ?? null;
  const comparison = sorted.find((s) => s.id === compareId) ?? null;

  const baselineMetrics = useMemo(
    () => (baseline ? evaluate(baseline.config) : null),
    [baseline],
  );
  const compareMetrics = useMemo(
    () => (comparison ? evaluate(comparison.config) : null),
    [comparison],
  );

  // Δη in percentage points, signed (comparison − baseline). Matches the
  // RecommendationPanel headline convention (PW-106).
  const deltaEtaPP =
    baselineMetrics && compareMetrics
      ? (compareMetrics.grossEfficiency - baselineMetrics.grossEfficiency) * 100
      : 0;

  const diffRows: DiffTableRow[] = useMemo(() => {
    if (!baseline || !comparison || !baselineMetrics || !compareMetrics) return [];
    return [
      {
        label: "Saddle height",
        current: baseline.config.saddleHeight,
        optimum: comparison.config.saddleHeight,
        delta: comparison.config.saddleHeight - baseline.config.saddleHeight,
        unit: "cm",
      },
      {
        label: "Setback",
        current: baseline.config.saddleSetback,
        optimum: comparison.config.saddleSetback,
        delta: comparison.config.saddleSetback - baseline.config.saddleSetback,
        unit: "cm",
      },
      {
        label: "Crank length",
        current: baseline.config.crankLength,
        optimum: comparison.config.crankLength,
        delta: comparison.config.crankLength - baseline.config.crankLength,
        unit: "mm",
        fmt: (v) => v.toFixed(1),
      },
      {
        label: "Cadence",
        current: baseline.config.cadence,
        optimum: comparison.config.cadence,
        delta: comparison.config.cadence - baseline.config.cadence,
        unit: "rpm",
        fmt: (v) => v.toFixed(0),
      },
      {
        label: "Knee at BDC",
        current: baselineMetrics.kneeAtBDC,
        optimum: compareMetrics.kneeAtBDC,
        delta: compareMetrics.kneeAtBDC - baselineMetrics.kneeAtBDC,
        unit: "°",
        fmt: (v) => v.toFixed(0),
      },
      {
        label: "Gross η",
        current: baselineMetrics.grossEfficiency * 100,
        optimum: compareMetrics.grossEfficiency * 100,
        delta: (compareMetrics.grossEfficiency - baselineMetrics.grossEfficiency) * 100,
        unit: "%",
        fmt: (v) => v.toFixed(1),
      },
    ];
  }, [baseline, comparison, baselineMetrics, compareMetrics]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-compare-title"
      data-testid="session-compare-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28, 25, 23, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 24,
      }}
    >
      <div
        ref={dialogRef}
        className="rounded-[10px] flex flex-col"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-default)",
          width: "100%",
          maxWidth: 900,
          maxHeight: "calc(100vh - 48px)",
          overflow: "hidden",
          boxShadow: "0 20px 50px -20px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border-default)",
          }}
        >
          <div>
            <SectionLabel>Session compare</SectionLabel>
            <h2
              id="session-compare-title"
              style={{
                fontSize: 18,
                fontWeight: 600,
                margin: "4px 0 0",
                color: "var(--color-text-primary)",
              }}
            >
              Before vs after
            </h2>
          </div>
          <Button
            ref={closeRef}
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close compare"
            data-testid="session-compare-close"
          >
            Close
          </Button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: 20,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {sessions.length < 2 ? (
            <div
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                padding: "20px 0",
                textAlign: "center",
              }}
              data-testid="session-compare-needs-two"
            >
              Compare needs two sessions. Create another from the left rail.
            </div>
          ) : (
            <>
              {/* Pickers */}
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <SessionPicker
                  label="Baseline"
                  value={baselineId}
                  sessions={sorted}
                  onChange={setBaselineId}
                  testId="session-compare-baseline"
                />
                <SessionPicker
                  label="Comparison"
                  value={compareId}
                  sessions={sorted}
                  onChange={setCompareId}
                  testId="session-compare-comparison"
                />
              </div>

              {/* Side-by-side */}
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <SessionColumn
                  session={baseline}
                  metrics={baselineMetrics}
                  tone="baseline"
                />
                <SessionColumn
                  session={comparison}
                  metrics={compareMetrics}
                  tone="comparison"
                />
              </div>

              {/* Δη headline */}
              <div
                className="rounded-md p-4"
                style={{
                  background: "var(--color-bg-alt)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                <DeltaHeadline
                  value={deltaEtaPP}
                  suffix="pp · gross η vs baseline"
                />
              </div>

              {/* Diff table */}
              <div>
                <SectionLabel className="mb-2">Parameter diff</SectionLabel>
                <DiffTable rows={diffRows} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SessionPicker({
  label,
  value,
  sessions,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  sessions: Session[];
  onChange: (v: string) => void;
  testId: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="section-label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="rounded-md px-3 py-2 cursor-pointer"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-default)",
          color: "var(--color-text-primary)",
          fontSize: 13,
        }}
      >
        {sessions.map((s, i) => {
          const date = new Date(s.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          return (
            <option key={s.id} value={s.id}>
              Session {sessions.length - i} · {date}
              {s.applied ? " · applied" : " · draft"}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function SessionColumn({
  session,
  metrics,
  tone,
}: {
  session: Session | null;
  metrics: ReturnType<typeof evaluate> | null;
  tone: "baseline" | "comparison";
}) {
  if (!session || !metrics) {
    return (
      <div
        className="rounded-md p-4"
        style={{
          background: "var(--color-bg-alt)",
          border: "1px solid var(--color-border-default)",
          fontSize: 12,
          color: "var(--color-text-tertiary)",
        }}
      >
        Pick a session.
      </div>
    );
  }
  const date = new Date(session.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const kneeInRange = metrics.kneeAtBDC >= 25 && metrics.kneeAtBDC <= 45;
  return (
    <div
      className="rounded-md p-4 flex flex-col gap-2"
      style={{
        background: "var(--color-bg-surface)",
        border:
          tone === "comparison"
            ? "1.5px solid var(--color-accent)"
            : "1px solid var(--color-border-default)",
      }}
      data-testid={`session-compare-column-${tone}`}
    >
      <div className="flex items-baseline justify-between">
        <SectionLabel>{tone === "baseline" ? "Baseline" : "Comparison"}</SectionLabel>
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}
        >
          {date}
        </span>
      </div>
      <div
        className="mono"
        style={{
          fontSize: 12,
          color: "var(--color-text-secondary)",
          lineHeight: 1.6,
        }}
      >
        <div>saddle {session.config.saddleHeight.toFixed(1)} cm</div>
        <div>crank {session.config.crankLength.toFixed(1)} mm</div>
        <div>setback {session.config.saddleSetback.toFixed(1)} cm</div>
        <div>cadence {session.config.cadence} rpm</div>
      </div>
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: "1fr 1fr",
          paddingTop: 8,
          borderTop: "1px solid var(--color-border-default)",
        }}
      >
        <MiniStat
          label="Gross η"
          value={`${(metrics.grossEfficiency * 100).toFixed(1)}%`}
        />
        <MiniStat
          label="Knee at BDC"
          value={`${metrics.kneeAtBDC.toFixed(0)}°`}
          status={kneeInRange ? "success" : "warn"}
        />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: "success" | "warn";
}) {
  const color =
    status === "success"
      ? "var(--color-success)"
      : status === "warn"
        ? "var(--color-warn)"
        : "var(--color-text-primary)";
  return (
    <div className="flex flex-col gap-1">
      <span className="section-label">{label}</span>
      <span
        className="mono"
        style={{ fontSize: 16, fontWeight: 500, color }}
      >
        {value}
      </span>
    </div>
  );
}
