"use client";

import { Card } from "@/components/Card";
import { SliderRow } from "@/components/SliderRow";
import { Badge } from "@/components/Badge";

import type { Config, Discipline } from "@/lib/types";
import { DISCIPLINE_DEFAULTS } from "@/lib/presets";

import { Explainer } from "./Explainer";

/** Per-discipline picker card metadata. Names match Tone & Voice §4. */
type DisciplineCard = {
  id: Exclude<Discipline, "Custom">;
  short: string;
  desc: string;
};

const CARDS: DisciplineCard[] = [
  { id: "Road",        short: "RD", desc: "All-day road. Modal Pedalwise setup." },
  { id: "TT/Tri",      short: "TT", desc: "Aero position. Aggressive bar drop." },
  { id: "XC MTB",      short: "XC", desc: "Cross-country. Clipped, lighter spin." },
  { id: "Gravity MTB", short: "GR", desc: "Descent-first. Flat pedals." },
  { id: "Commuter",    short: "CM", desc: "Upright. Easy spin." },
];

export type GoalPickerProps = {
  config: Config;
  onChange: (patch: Partial<Config>) => void;
};

/**
 * DIY step 4 — discipline + target speed/grade/cadence (PW-102).
 *
 * Picking a discipline writes pedalMode, barDrop, cadence, and the
 * upstroke-effort default in one click (see DISCIPLINE_DEFAULTS).
 * The user can override cadence and the goal sliders below.
 */
export function GoalPicker({ config, onChange }: GoalPickerProps) {
  function pickDiscipline(id: DisciplineCard["id"]) {
    const d = DISCIPLINE_DEFAULTS[id];
    onChange({
      discipline: id,
      pedalMode: d.pedalMode,
      barDrop: d.barDrop,
      cadence: d.cadence,
      rider: {
        ...config.rider,
        upstrokeEffortPct: d.upstrokeEffortPct,
      },
    });
  }

  const selected = config.discipline;

  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}
        role="radiogroup"
        aria-label="Riding discipline"
      >
        {CARDS.map((c) => (
          <DisciplineButton
            key={c.id}
            card={c}
            selected={selected === c.id}
            onPick={pickDiscipline}
          />
        ))}
      </div>

      <Card padding={20}>
        <div
          className="flex items-baseline justify-between"
          style={{ marginBottom: 14 }}
        >
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            Fine-tune the target
          </h3>
          {selected !== "Custom" && (
            <Badge tone="info">{selected} defaults applied</Badge>
          )}
        </div>
        <div
          className="grid"
          style={{ gridTemplateColumns: "1fr 1fr", columnGap: 24, rowGap: 18 }}
        >
          <SliderRow
            label="Target speed"
            value={config.targetSpeed}
            unit="km/h"
            min={15}
            max={50}
            step={1}
            onChange={(v) => onChange({ targetSpeed: v })}
            formatValue={(v) => v.toFixed(0)}
          />
          <SliderRow
            label="Road grade"
            value={config.roadGrade}
            unit="%"
            min={-5}
            max={12}
            step={1}
            onChange={(v) => onChange({ roadGrade: v })}
            formatValue={(v) => v.toFixed(0)}
          />
          <SliderRow
            label="Cadence"
            value={config.cadence}
            unit="rpm"
            min={60}
            max={120}
            step={1}
            onChange={(v) => onChange({ cadence: v })}
            formatValue={(v) => v.toFixed(0)}
          />
          <SliderRow
            label="Upstroke effort"
            value={Math.round(config.rider.upstrokeEffortPct * 100)}
            unit="%"
            min={0}
            max={25}
            step={1}
            onChange={(v) =>
              onChange({
                rider: { ...config.rider, upstrokeEffortPct: v / 100 },
              })
            }
            formatValue={(v) => v.toFixed(0)}
          />
        </div>
      </Card>

      <Explainer title="What the discipline picker writes">
        Each discipline sets pedal mode (clipped or flat), bar drop, a
        typical cadence, and an upstroke-effort starting point in one
        click. Override any field below — the discipline switches to
        Custom when you do.
      </Explainer>
    </div>
  );
}

function DisciplineButton({
  card,
  selected,
  onPick,
}: {
  card: DisciplineCard;
  selected: boolean;
  onPick: (id: DisciplineCard["id"]) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-testid={`diy-discipline-${card.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
      onClick={() => onPick(card.id)}
      className="flex flex-col text-left cursor-pointer"
      style={{
        padding: "14px 14px",
        background: selected ? "var(--color-accent-light)" : "var(--color-bg-surface)",
        border: `1.5px solid ${selected ? "var(--color-accent)" : "var(--color-border-default)"}`,
        borderRadius: 10,
        gap: 6,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="mono"
          style={{
            width: 30,
            height: 22,
            borderRadius: 6,
            background: selected ? "var(--color-accent)" : "var(--color-bg-alt)",
            color: selected ? "white" : "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {card.short}
        </span>
        {selected && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="3"
            aria-hidden
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: selected ? "var(--color-accent-dark)" : "var(--color-text-primary)",
        }}
      >
        {card.id}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "var(--color-text-secondary)",
          lineHeight: 1.4,
        }}
      >
        {card.desc}
      </span>
    </button>
  );
}
