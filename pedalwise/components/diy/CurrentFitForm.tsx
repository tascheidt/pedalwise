"use client";

import { SliderRow } from "@/components/SliderRow";
import { Card } from "@/components/Card";

import type { Config } from "@/lib/types";

import { Explainer } from "./Explainer";

export type CurrentFitFormProps = {
  config: Config;
  onChange: (patch: Partial<Config>) => void;
};

/**
 * DIY step 3 — current bike fit capture (PW-102). Three load-bearing
 * fields: crank length (mm), saddle height (cm, BB to saddle top),
 * and saddle setback (cm, BB to saddle nose). These are the inputs
 * the optimizer searches around.
 */
export function CurrentFitForm({ config, onChange }: CurrentFitFormProps) {
  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      <Card padding={20}>
        <div
          className="grid"
          style={{ gridTemplateColumns: "1fr 1fr", columnGap: 24, rowGap: 18 }}
        >
          <SliderRow
            label="Crank length"
            value={config.crankLength}
            unit="mm"
            min={155}
            max={180}
            step={2.5}
            onChange={(v) => onChange({ crankLength: v })}
            formatValue={(v) => v.toFixed(1)}
          />
          <SliderRow
            label="Saddle height"
            value={config.saddleHeight}
            unit="cm"
            min={55}
            max={82}
            step={0.5}
            onChange={(v) => onChange({ saddleHeight: v })}
            formatValue={(v) => v.toFixed(1)}
          />
          <SliderRow
            label="Saddle setback"
            value={config.saddleSetback}
            unit="cm"
            min={0}
            max={10}
            step={0.5}
            onChange={(v) => onChange({ saddleSetback: v })}
            formatValue={(v) => v.toFixed(1)}
          />
        </div>
      </Card>

      <Explainer title="Measuring your current fit">
        Saddle height is the <strong>vertical</strong> distance from the
        bottom-bracket centre up to the top of the saddle — measure with a
        plumb tape, not along the seat tube. The 2D sagittal model uses
        vertical hip height directly. Setback is the horizontal distance
        from the BB to the saddle nose. Crank length is centre to centre,
        BB spindle to pedal axle. Holmes range — 25–45° of knee flexion at
        BDC — is the target the simulator scores against.
      </Explainer>
    </div>
  );
}
