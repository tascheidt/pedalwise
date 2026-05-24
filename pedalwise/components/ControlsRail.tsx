"use client";

import type { Config, Preset, Recommendation } from "@/lib/types";
import { PRESETS } from "@/lib/presets";
import { SliderRow } from "./SliderRow";
import { Button } from "./Button";
import { SectionLabel } from "./SectionLabel";

const PRESET_KEYS: Preset[] = ["5'4\"", "5'9\"", "6'2\"", "Custom"];

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

  return (
    <div className="flex flex-col gap-4">
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
          <SliderRow label="Fast-twitch %" value={config.fastTwitchPct} unit="%" min={30} max={70} step={1}
                     onChange={(v) => onConfigChange({ fastTwitchPct: v })} formatValue={(v) => v.toFixed(0)} />
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
      </div>

      {/* Goal */}
      <div
        className="rounded-[10px] p-4 flex flex-col gap-3"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}
      >
        <SectionLabel>Goal</SectionLabel>
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
        <Button variant="secondary" onClick={onReset}>Reset to default</Button>
      </div>
    </div>
  );
}

export { PRESETS as PRESETS_FOR_HEADER };
