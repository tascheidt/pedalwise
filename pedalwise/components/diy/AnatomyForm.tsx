"use client";

import { SliderRow } from "@/components/SliderRow";
import { Card } from "@/components/Card";

import type { Config } from "@/lib/types";

import { Explainer } from "./Explainer";

export type AnatomyFormProps = {
  config: Config;
  onChange: (patch: Partial<Config>) => void;
};

/**
 * DIY step 2 — anatomy capture (PW-102). Six fields drive the kinematic
 * model: height, femur, tibia, foot, mass, fast-twitch %. Cadence
 * preference is derived in the goal step; we hold the raw fast-twitch
 * input here per the Config schema.
 */
export function AnatomyForm({ config, onChange }: AnatomyFormProps) {
  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      <Card padding={20}>
        <div
          className="grid"
          style={{ gridTemplateColumns: "1fr 1fr", columnGap: 24, rowGap: 18 }}
        >
          <SliderRow
            label="Height"
            value={config.height}
            unit="cm"
            min={150}
            max={205}
            step={1}
            onChange={(v) => onChange({ height: v })}
            formatValue={(v) => v.toFixed(0)}
          />
          <SliderRow
            label="Mass"
            value={config.mass}
            unit="kg"
            min={45}
            max={110}
            step={1}
            onChange={(v) => onChange({ mass: v })}
            formatValue={(v) => v.toFixed(0)}
          />
          <SliderRow
            label="Femur length"
            value={config.femur}
            unit="cm"
            min={32}
            max={52}
            step={0.5}
            onChange={(v) => onChange({ femur: v })}
            formatValue={(v) => v.toFixed(1)}
          />
          <SliderRow
            label="Tibia length"
            value={config.tibia}
            unit="cm"
            min={32}
            max={52}
            step={0.5}
            onChange={(v) => onChange({ tibia: v })}
            formatValue={(v) => v.toFixed(1)}
          />
          <SliderRow
            label="Foot length"
            value={config.foot}
            unit="cm"
            min={22}
            max={32}
            step={0.5}
            onChange={(v) => onChange({ foot: v })}
            formatValue={(v) => v.toFixed(1)}
          />
          <SliderRow
            label="Fast-twitch fraction"
            value={config.fastTwitchPct}
            unit="%"
            min={25}
            max={75}
            step={1}
            onChange={(v) => onChange({ fastTwitchPct: v })}
            formatValue={(v) => v.toFixed(0)}
          />
        </div>
      </Card>

      <Explainer title="Why these six fields">
        Femur and tibia set leg reach at BDC (bottom dead centre — the
        bottom of the pedal stroke). Foot length sets ankle-to-pedal
        offset. Mass scales the inverse-dynamics torques. Fast-twitch
        fraction shifts the optimum cadence — type-II-rich riders
        prefer 85–100 rpm; type-I-dominant riders favour 70–85 rpm.
      </Explainer>
    </div>
  );
}
