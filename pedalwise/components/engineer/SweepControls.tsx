"use client";

import { useMemo, useState } from "react";

import type { Config } from "@/lib/types";
import type { SweepAxis, SweepMeasure, SweepRequest } from "@/lib/sweep";

import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";

/* ------------------------------------------------------------------ */
/*  Field metadata                                                    */
/* ------------------------------------------------------------------ */

/**
 * Sweep-able Config fields, mirrored from lib/sweep.ts → SweepAxis.field.
 * Each entry carries a label, unit, and a sensible default range so the
 * "Run" button does something sane on first click. The defaults are
 * narrow enough to keep a 9 × 7 grid (63 cells) under the 500 ms target.
 */
type FieldId = SweepAxis["field"];

const FIELDS: ReadonlyArray<{
  id: FieldId;
  label: string;
  unit: string;
  /** Range used when the user picks this axis. */
  range: { min: number; max: number };
  /** Step that gives ~9 (x) or ~7 (y) samples across `range`. */
  xStep: number;
  yStep: number;
}> = [
  { id: "crankLength",   label: "crank length",   unit: "mm",   range: { min: 160, max: 180 }, xStep: 2.5, yStep: 3.3 },
  { id: "saddleHeight",  label: "saddle height",  unit: "cm",   range: { min: 62,  max: 70  }, xStep: 1,   yStep: 1.3 },
  { id: "saddleSetback", label: "setback",        unit: "cm",   range: { min: 2,   max: 8   }, xStep: 0.75, yStep: 1 },
  { id: "cadence",       label: "cadence",        unit: "rpm",  range: { min: 70,  max: 105 }, xStep: 4.4, yStep: 5.8 },
  { id: "targetSpeed",   label: "target speed",   unit: "km/h", range: { min: 20,  max: 40  }, xStep: 2.5, yStep: 3.3 },
  { id: "barDrop",       label: "bar drop",       unit: "cm",   range: { min: 0,   max: 14  }, xStep: 1.75, yStep: 2.3 },
  { id: "cleatOffset",   label: "cleat offset",   unit: "cm",   range: { min: -1.5, max: 1.5 }, xStep: 0.375, yStep: 0.5 },
  { id: "roadGrade",     label: "road grade",     unit: "%",    range: { min: 0,   max: 8   }, xStep: 1,    yStep: 1.3 },
] as const;

const MEASURES: ReadonlyArray<{ id: SweepMeasure; label: string; unit: string }> = [
  { id: "grossEfficiency", label: "gross η",      unit: "" },
  { id: "metabolicCost",   label: "metabolic",    unit: "W" },
  { id: "kneeAtBDC",       label: "knee@BDC",     unit: "°" },
  { id: "ie",              label: "IE",           unit: "" },
  { id: "power",           label: "power",        unit: "W" },
] as const;

function fieldMeta(id: FieldId) {
  // FIELDS is a constant union — id is always present.
  return FIELDS.find((f) => f.id === id)!;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export type SweepControlsProps = {
  /** Base Config the sweep varies around. Sweep axes override two fields. */
  baseConfig: Config;
  inFlight: boolean;
  /** True after the first sweep result arrives — gates the optimum/legend UI. */
  hasResult: boolean;
  onRun: (req: SweepRequest) => void;
  onCancel: () => void;
};

export function SweepControls({ baseConfig, inFlight, hasResult, onRun, onCancel }: SweepControlsProps) {
  const [xField, setXField] = useState<FieldId>("crankLength");
  const [yField, setYField] = useState<FieldId>("cadence");
  const [measure, setMeasure] = useState<SweepMeasure>("grossEfficiency");

  const xMeta = useMemo(() => fieldMeta(xField), [xField]);
  const yMeta = useMemo(() => fieldMeta(yField), [yField]);

  const axesAreSame = xField === yField;

  function handleRun() {
    if (axesAreSame) return;
    const xAxis: SweepAxis = { field: xField, min: xMeta.range.min, max: xMeta.range.max, step: xMeta.xStep };
    const yAxis: SweepAxis = { field: yField, min: yMeta.range.min, max: yMeta.range.max, step: yMeta.yStep };
    onRun({ base: baseConfig, xAxis, yAxis, measure });
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Sweep · pick two axes and a measure</SectionLabel>

      <AxisPicker
        testId="sweep-x-axis"
        label="X axis"
        value={xField}
        onChange={setXField}
        disabled={inFlight}
      />
      <AxisPicker
        testId="sweep-y-axis"
        label="Y axis"
        value={yField}
        onChange={setYField}
        disabled={inFlight}
      />

      {axesAreSame && (
        <div className="mono" style={{ fontSize: 11, color: "var(--color-warn)" }}>
          X and Y must differ.
        </div>
      )}

      <MeasurePicker value={measure} onChange={setMeasure} disabled={inFlight} />

      <div className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
        grid · {axesAreSame ? "—" : "9 × 7 cells"}<br />
        x · {xMeta.label} {xMeta.range.min}–{xMeta.range.max} {xMeta.unit} · step {xMeta.xStep}<br />
        y · {yMeta.label} {yMeta.range.min}–{yMeta.range.max} {yMeta.unit} · step {yMeta.yStep}
      </div>

      <div className="flex gap-2">
        {!inFlight ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleRun}
            disabled={axesAreSame}
            data-testid="sweep-run"
          >
            Run sweep
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            data-testid="sweep-cancel"
          >
            Cancel
          </Button>
        )}
        {hasResult && !inFlight && (
          <span className="mono self-center" style={{ fontSize: 11, color: "var(--color-success)" }}>
            ready
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-pickers                                                       */
/* ------------------------------------------------------------------ */

function AxisPicker({
  label, value, onChange, disabled, testId,
}: {
  label: string;
  value: FieldId;
  onChange: (v: FieldId) => void;
  disabled: boolean;
  testId: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="section-label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FieldId)}
        disabled={disabled}
        data-testid={testId}
        className="mono"
        style={{
          background: "var(--color-bg-alt)",
          border: "1px solid var(--color-border-default)",
          color: "var(--color-text-primary)",
          borderRadius: 6,
          padding: "6px 8px",
          fontSize: 12,
        }}
      >
        {FIELDS.map((f) => (
          <option key={f.id} value={f.id}>{f.label} ({f.unit})</option>
        ))}
      </select>
    </label>
  );
}

function MeasurePicker({
  value, onChange, disabled,
}: {
  value: SweepMeasure;
  onChange: (v: SweepMeasure) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="section-label">measure</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SweepMeasure)}
        disabled={disabled}
        data-testid="sweep-measure"
        className="mono"
        style={{
          background: "var(--color-bg-alt)",
          border: "1px solid var(--color-border-default)",
          color: "var(--color-text-primary)",
          borderRadius: 6,
          padding: "6px 8px",
          fontSize: 12,
        }}
      >
        {MEASURES.map((m) => (
          <option key={m.id} value={m.id}>{m.label}{m.unit ? ` (${m.unit})` : ""}</option>
        ))}
      </select>
    </label>
  );
}
