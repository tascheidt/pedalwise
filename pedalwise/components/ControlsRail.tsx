"use client";

import { useState } from "react";
import type { Config, Discipline, PedalMode, Preset, Recommendation } from "@/lib/types";
import { DISCIPLINE_DEFAULTS, PRESETS } from "@/lib/presets";
import { fastTwitchFromPreferredCadence } from "@/lib/metabolic";
import { SliderRow } from "./SliderRow";
import { Button } from "./Button";
import { SectionLabel } from "./SectionLabel";

const PRESET_KEYS: Preset[] = ["5'4\"", "5'9\"", "6'2\"", "Custom"];

const DISCIPLINE_KEYS: Discipline[] = [
  "Road",
  "TT/Tri",
  "XC MTB",
  "Gravity MTB",
  "Commuter",
  "Custom",
];

/**
 * Derive the active discipline for display. Returns config.discipline when it
 * matches a known preset exactly, otherwise falls back to matching the four
 * discipline-controlled fields (pedalMode, barDrop, cadence, upstrokeEffortPct)
 * within tolerance. Returns "Custom" if no discipline matches.
 *
 * The field-match fallback handles configs loaded from legacy share URLs or
 * LocalStorage that were saved before Config gained the discipline field.
 */
function disciplineFromConfig(config: Config): Discipline {
  // Fast path: trust the stored field when it's a known non-Custom value.
  if (config.discipline && config.discipline !== "Custom") return config.discipline;

  const pedalMode: PedalMode = config.pedalMode ?? "clipped";
  const barDrop = config.barDrop ?? 0;
  const cadence = config.cadence;
  const upstroke = config.rider.upstrokeEffortPct;

  for (const key of Object.keys(DISCIPLINE_DEFAULTS) as Exclude<Discipline, "Custom">[]) {
    const d = DISCIPLINE_DEFAULTS[key];
    if (
      d.pedalMode === pedalMode
      && Math.abs(d.barDrop - barDrop) <= 0.5
      && Math.abs(d.cadence - cadence) <= 2
      && Math.abs(d.upstrokeEffortPct - upstroke) <= 0.01
    ) {
      return key;
    }
  }
  return "Custom";
}

type Props = {
  config: Config;
  preset: Preset;
  recommendation: Recommendation | null;
  onPresetChange: (p: Preset) => void;
  onConfigChange: (patch: Partial<Config>) => void;
  onOptimize: () => void;
  onReset: () => void;
  optimizing: boolean;
};

export function ControlsRail({
  config, preset, recommendation, onPresetChange, onConfigChange, onOptimize, onReset, optimizing,
}: Props) {
  const recFit = recommendation?.fit;
  const recGoal = recommendation?.goal;
  const activeDiscipline = disciplineFromConfig(config);
  const [advFitOpen, setAdvFitOpen] = useState(false);

  const pedalMode: PedalMode = config.pedalMode ?? "clipped";
  const isFlat = pedalMode === "flat";

  const handleDiscipline = (d: Discipline) => {
    if (d === "Custom") return; // display-only state
    const defaults = DISCIPLINE_DEFAULTS[d];
    onConfigChange({
      discipline: d,
      pedalMode: defaults.pedalMode,
      barDrop: defaults.barDrop,
      cadence: defaults.cadence,
      rider: { ...config.rider, upstrokeEffortPct: defaults.upstrokeEffortPct },
    });
  };

  const handlePedalMode = (mode: PedalMode) => {
    onConfigChange({ pedalMode: mode });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Discipline picker */}
      <div
        className="rounded-[10px] p-4 flex flex-col gap-3"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}
      >
        <SectionLabel>Discipline</SectionLabel>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {DISCIPLINE_KEYS.map((d) => {
            const active = d === activeDiscipline;
            const isCustom = d === "Custom";
            // "Custom" is display-only — toned lighter when active so it
            // doesn't read as clickable.
            const bg = active
              ? (isCustom ? "var(--color-bg-alt)" : "var(--color-accent-light)")
              : "var(--color-bg-surface)";
            const border = active
              ? (isCustom ? "var(--color-border-strong)" : "var(--color-accent)")
              : "var(--color-border-default)";
            const color = active
              ? (isCustom ? "var(--color-text-secondary)" : "var(--color-accent-dark)")
              : "var(--color-text-secondary)";
            return (
              <button
                key={d}
                type="button"
                onClick={() => handleDiscipline(d)}
                disabled={isCustom}
                className="rounded-md text-center mono"
                style={{
                  height: 30,
                  fontSize: 11,
                  background: bg,
                  border: `1px solid ${border}`,
                  color,
                  fontWeight: 500,
                  cursor: isCustom ? "default" : "pointer",
                  opacity: isCustom && !active ? 0.6 : 1,
                  padding: "0 4px",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                data-testid={`discipline-${d.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rider profile */}
      <div
        className="rounded-[10px] p-4 flex flex-col gap-3"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}
      >
        <SectionLabel>Rider profile</SectionLabel>
        <div className="grid grid-cols-4 gap-1">
          {PRESET_KEYS.map((p) => {
            const active = p === preset;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPresetChange(p)}
                className="rounded-md text-center mono cursor-pointer"
                style={{
                  height: 30,
                  fontSize: 12,
                  background: active ? "var(--color-accent-light)" : "var(--color-bg-surface)",
                  border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border-default)"}`,
                  color: active ? "var(--color-accent-dark)" : "var(--color-text-secondary)",
                  fontWeight: 500,
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 mt-1">
          <SliderRow label="Height" value={config.height} unit="cm" min={150} max={205} step={1}
                     onChange={(v) => onConfigChange({ height: v })} formatValue={(v) => v.toFixed(0)} />
          <SliderRow label="Femur" value={config.femur} unit="cm" min={35} max={52} step={0.1}
                     onChange={(v) => onConfigChange({ femur: v })} formatValue={(v) => v.toFixed(1)} />
          <SliderRow label="Tibia" value={config.tibia} unit="cm" min={35} max={52} step={0.1}
                     onChange={(v) => onConfigChange({ tibia: v })} formatValue={(v) => v.toFixed(1)} />
          <SliderRow label="Foot" value={config.foot} unit="cm" min={20} max={32} step={0.1}
                     onChange={(v) => onConfigChange({ foot: v })} formatValue={(v) => v.toFixed(1)} />
          <SliderRow label="Mass" value={config.mass} unit="kg" min={45} max={110} step={1}
                     onChange={(v) => onConfigChange({ mass: v })} formatValue={(v) => v.toFixed(0)} />
          {/* A5 rename: preferred cadence is the canonical input; fastTwitchPct
              is derived and kept in lockstep for legacy callers. */}
          <SliderRow
            label="Preferred cadence" value={config.preferredCadence} unit="rpm"
            min={60} max={100} step={1}
            onChange={(v) => onConfigChange({
              preferredCadence: v,
              fastTwitchPct: fastTwitchFromPreferredCadence(v),
            })}
            formatValue={(v) => v.toFixed(0)}
          />
        </div>
      </div>

      {/* Bike fit */}
      <div
        className="rounded-[10px] p-4 flex flex-col gap-3"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}
      >
        <SectionLabel>Bike fit</SectionLabel>
        <SliderRow
          label="Crank length" value={config.crankLength} unit="mm" min={150} max={180} step={2.5}
          onChange={(v) => onConfigChange({ crankLength: v })}
          recommended={recFit?.crankLength}
          formatValue={(v) => v.toFixed(1)}
        />
        <SliderRow
          label="Saddle height" value={config.saddleHeight} unit="cm" min={55} max={95} step={0.5}
          onChange={(v) => onConfigChange({ saddleHeight: v })}
          recommended={recFit?.saddleHeight}
          formatValue={(v) => v.toFixed(1)}
        />
        <SliderRow
          label="Saddle setback" value={config.saddleSetback} unit="cm" min={0} max={12} step={0.5}
          onChange={(v) => onConfigChange({ saddleSetback: v })}
          recommended={recFit?.saddleSetback}
          formatValue={(v) => v.toFixed(1)}
        />

        {/* Advanced fit (collapsed by default — rail height must not grow on
            first load per CLAUDE.md §1 "biomechanics first, chrome last"). */}
        <button
          type="button"
          onClick={() => setAdvFitOpen((open) => !open)}
          className="mono cursor-pointer rounded-md"
          style={{
            height: 24,
            fontSize: 11,
            background: "transparent",
            border: "1px solid transparent",
            color: "var(--color-text-secondary)",
            textAlign: "left",
            padding: "0 4px",
            marginTop: 2,
          }}
          data-testid="adv-fit-toggle"
          aria-expanded={advFitOpen}
        >
          {advFitOpen ? "▴" : "▾"} Advanced fit
        </button>

        {advFitOpen && (
          <div className="flex flex-col gap-3" style={{ marginTop: 2 }}>
            {/* Pedal mode segmented toggle */}
            <div className="flex flex-col" style={{ rowGap: 6 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                Pedal mode
              </span>
              <div className="grid grid-cols-2 gap-1">
                {(["clipped", "flat"] as PedalMode[]).map((m) => {
                  const active = m === pedalMode;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handlePedalMode(m)}
                      className="rounded-md text-center mono cursor-pointer"
                      style={{
                        height: 28,
                        fontSize: 11,
                        background: active ? "var(--color-accent-light)" : "var(--color-bg-surface)",
                        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border-default)"}`,
                        color: active ? "var(--color-accent-dark)" : "var(--color-text-secondary)",
                        fontWeight: 500,
                        textTransform: "capitalize",
                      }}
                      data-testid={`pedal-mode-${m}`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <SliderRow
              label="Pelvis above saddle" value={config.pelvisAboveSaddle ?? 6.0} unit="cm"
              min={4} max={10} step={0.5}
              onChange={(v) => onConfigChange({ pelvisAboveSaddle: v })}
              formatValue={(v) => v.toFixed(1)}
            />
            <SliderRow
              label="Bar drop" value={config.barDrop ?? 8.0} unit="cm"
              min={-2} max={18} step={0.5}
              onChange={(v) => onConfigChange({ barDrop: v })}
              formatValue={(v) => v.toFixed(1)}
            />
            <SliderRow
              label="Cleat offset" value={config.cleatOffset ?? 0.0} unit="cm"
              min={-2} max={3} step={0.5}
              onChange={(v) => onConfigChange({ cleatOffset: v })}
              formatValue={(v) => v.toFixed(1)}
            />
          </div>
        )}
      </div>

      {/* Stroke style */}
      <div
        className="rounded-[10px] p-4 flex flex-col gap-3"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}
      >
        <SectionLabel>Stroke style</SectionLabel>
        <SliderRow
          label="Upstroke effort"
          value={config.rider.upstrokeEffortPct * 100}
          unit="%"
          min={0} max={25} step={1}
          disabled={isFlat}
          onChange={(v) => onConfigChange({
            rider: { ...config.rider, upstrokeEffortPct: v / 100 },
          })}
          formatValue={(v) => v.toFixed(0)}
        />
        {isFlat && (
          <span className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            Flat pedals — no upstroke pull available
          </span>
        )}
      </div>

      {/* Goal */}
      <div
        className="rounded-[10px] p-4 flex flex-col gap-3"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}
      >
        <SectionLabel>Riding target</SectionLabel>
        <SliderRow label="Target speed" value={config.targetSpeed} unit="km/h" min={10} max={60} step={1}
                   onChange={(v) => onConfigChange({ targetSpeed: v })} formatValue={(v) => v.toFixed(0)} />
        <SliderRow label="Road grade" value={config.roadGrade} unit="%" min={-5} max={15} step={1}
                   onChange={(v) => onConfigChange({ roadGrade: v })} formatValue={(v) => v.toFixed(0)} />
        <SliderRow
          label="Cadence" value={config.cadence} unit="rpm" min={50} max={130} step={1}
          onChange={(v) => onConfigChange({ cadence: v })}
          recommended={recGoal?.cadence}
          formatValue={(v) => v.toFixed(0)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="primary" size="lg" onClick={onOptimize} disabled={optimizing}>
          {optimizing ? "Solving…" : "Find optimal fit →"}
        </Button>
        <Button variant="secondary" onClick={onReset}>Reset to preset</Button>
      </div>
    </div>
  );
}

export { PRESETS as PRESETS_FOR_HEADER };
