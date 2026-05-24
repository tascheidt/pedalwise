"use client";

import type { Metrics } from "@/lib/types";

export function HudStrip({
  metrics,
  large = false,
}: {
  metrics: Metrics;
  large?: boolean;
}) {
  const items: { value: string; unit?: string; label: string; accent?: boolean }[] = [
    { value: metrics.speed.toFixed(0), unit: " km/h", label: "speed" },
    { value: metrics.cadence.toFixed(0), unit: " rpm", label: "cadence" },
    { value: metrics.power.toFixed(0), unit: " W", label: "power" },
    { value: (metrics.grossEfficiency * 100).toFixed(1) + "%", label: "gross effic.", accent: true },
  ];
  const valueSize = large ? 28 : 22;

  return (
    <div className="flex items-baseline gap-6">
      {items.map((it, i) => (
        <div key={i} className="flex items-baseline gap-1">
          <span className="mono" style={{ fontSize: valueSize, fontWeight: 500, color: it.accent ? "var(--color-success)" : "var(--color-text-primary)" }}>
            {it.value}{it.unit ?? ""}
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
