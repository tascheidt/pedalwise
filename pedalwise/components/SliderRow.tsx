"use client";

import { useId } from "react";

type Props = {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  recommended?: number;
  outOfRange?: boolean;
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
  ariaLabel?: string;
};

export function SliderRow({
  label,
  value,
  unit,
  min,
  max,
  step = 0.5,
  recommended,
  outOfRange = false,
  formatValue,
  onChange,
  ariaLabel,
}: Props) {
  const id = useId();
  const recPercent = recommended != null && recommended >= min && recommended <= max
    ? ((recommended - min) / (max - min)) * 100
    : null;

  const displayed = formatValue ? formatValue(value) : value.toString();

  return (
    <div className="flex flex-col" style={{ rowGap: 6 }}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
          {label}
        </label>
        <span
          className="mono"
          style={{
            fontSize: 11,
            color: outOfRange ? "var(--color-danger)" : "var(--color-text-primary)",
            fontWeight: 500,
          }}
        >
          {displayed}{unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="relative" style={{ height: 18 }}>
        <input
          id={id}
          type="range"
          aria-label={ariaLabel ?? label}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        {recPercent != null && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${recPercent}%`,
              top: 4,
              bottom: 4,
              transform: "translateX(-50%)",
              width: 1.5,
              background: "var(--color-accent)",
              opacity: 0.6,
            }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
