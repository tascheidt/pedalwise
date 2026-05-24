"use client";

import { useMemo, useState } from "react";
import { CHAINRINGS, COGS, WHEEL_DIAMETER_M } from "@/lib/presets";
import { solveTriangle, TriangleState, TriangleVar } from "@/lib/kinematics";
import { SectionLabel } from "./SectionLabel";

type Props = {
  initial?: Partial<TriangleState>;
  onChange?: (state: TriangleState) => void;
};

const NODE_LABEL: Record<TriangleVar, { label: string; unit: string }> = {
  speed:   { label: "Speed",   unit: "km/h" },
  cadence: { label: "Cadence", unit: "rpm" },
  gear:    { label: "Gear",    unit: "ratio" },
};

const VIEW_W = 600;
const VIEW_H = 360;

const NODE_POS: Record<TriangleVar, { x: number; y: number }> = {
  speed:   { x: 300, y: 90  },
  cadence: { x: 170, y: 250 },
  gear:    { x: 430, y: 250 },
};

export function SpeedCadenceGearTriangle({ initial, onChange }: Props) {
  const [state, setState] = useState<TriangleState>(() => {
    const base: TriangleState = {
      speed: 30,
      cadence: 88,
      gear: 3.06,
      pinned: ["speed", "cadence"],
      ...initial,
    };
    return solveTriangle(base);
  });

  function update(next: TriangleState) {
    setState(solveTriangle(next));
    onChange?.(solveTriangle(next));
  }

  function togglePin(v: TriangleVar) {
    if (state.pinned.includes(v)) {
      const other = state.pinned.find((x) => x !== v)!;
      const wasSolved = (["speed", "cadence", "gear"] as TriangleVar[]).find(
        (x) => !state.pinned.includes(x),
      )!;
      update({ ...state, pinned: [other, wasSolved] });
    }
  }

  function setValue(v: TriangleVar, value: number) {
    update({ ...state, [v]: value });
  }

  const solvedVar = (["speed", "cadence", "gear"] as TriangleVar[]).find(
    (v) => !state.pinned.includes(v),
  )!;

  const closest = useMemo(() => {
    const candidates: { label: string; ratio: number }[] = [];
    for (const cr of CHAINRINGS) for (const cog of COGS) {
      candidates.push({ label: `${cr} × ${cog}`, ratio: cr / cog });
    }
    candidates.sort((a, b) => Math.abs(a.ratio - state.gear) - Math.abs(b.ratio - state.gear));
    return candidates.slice(0, 3);
  }, [state.gear]);

  // Gain ratio = ratio × (wheel radius / crank length); radius/crank both in metres
  const gainRatio = state.gear * ((WHEEL_DIAMETER_M / 2) / (172.5 / 1000));

  return (
    <div
      className="rounded-[10px] p-5"
      style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex flex-col gap-1">
          <SectionLabel>Speed · cadence · gear</SectionLabel>
          <div style={{ fontSize: 14, color: "var(--color-text-primary)" }}>
            Pin any two, solve the third
          </div>
        </div>
      </div>

      {/* Triangle: capped size so the SVG isn't stretched. */}
      <div className="relative mx-auto" style={{ width: "100%", maxWidth: 720 }}>
        <div className="relative" style={{ width: "100%" }}>
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            {/* triangle edges */}
            <line x1={NODE_POS.speed.x}   y1={NODE_POS.speed.y}
                  x2={NODE_POS.cadence.x} y2={NODE_POS.cadence.y}
                  stroke="var(--color-border-strong)" strokeWidth={1.5} />
            <line x1={NODE_POS.speed.x}   y1={NODE_POS.speed.y}
                  x2={NODE_POS.gear.x}    y2={NODE_POS.gear.y}
                  stroke="var(--color-border-strong)" strokeWidth={1.5} />
            <line x1={NODE_POS.cadence.x} y1={NODE_POS.cadence.y}
                  x2={NODE_POS.gear.x}    y2={NODE_POS.gear.y}
                  stroke="var(--color-border-strong)" strokeWidth={1.5} />
            {/* equation along the bottom edge */}
            <text x={300} y={245} textAnchor="middle" fontSize={14}
                  fill="var(--color-text-secondary)"
                  fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace">
              v = (n / 60) · G · π · D
            </text>
            {/* Circles + values inside the SVG (purely visual) */}
            {(["speed", "cadence", "gear"] as TriangleVar[]).map((v) => {
              const pos = NODE_POS[v];
              const isSolved = v === solvedVar;
              return (
                <g key={v}>
                  <circle
                    cx={pos.x} cy={pos.y} r={48}
                    fill={isSolved ? "transparent" : "var(--color-accent)"}
                    stroke={isSolved ? "var(--color-success)" : "var(--color-accent)"}
                    strokeWidth={2}
                    strokeDasharray={isSolved ? "5 4" : undefined}
                  />
                  <text x={pos.x} y={pos.y + 5} textAnchor="middle"
                        fontSize={26} fontWeight={500}
                        fill={isSolved ? "var(--color-success)" : "white"}
                        fontFamily="var(--font-geist-sans), system-ui, sans-serif">
                    {v === "gear" ? state.gear.toFixed(2) :
                     v === "speed" ? state.speed.toFixed(0) :
                     state.cadence.toFixed(0)}
                  </text>
                  <text x={pos.x} y={pos.y + 26} textAnchor="middle"
                        fontSize={11}
                        fill={isSolved ? "var(--color-success)" : "white"}
                        opacity={0.9}
                        fontFamily="var(--font-geist-sans), system-ui, sans-serif">
                    {NODE_LABEL[v].unit}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Absolutely-positioned overlays for labels and pin badges.
              Speed (top): label & badge sit above the circle.
              Cadence/Gear (bottom): label & badge sit below the circle. */}
          {(["speed", "cadence", "gear"] as TriangleVar[]).map((v) => {
            const pos = NODE_POS[v];
            const isSolved = v === solvedVar;
            const isTop = v === "speed";
            const left = `${(pos.x / VIEW_W) * 100}%`;
            // For the top node, label sits 78 px above and badge 60 px above center
            // (above the circle). For the bottom nodes, the order flips below the
            // circle: label 60 px below, badge 80 px below.
            const labelOffset = isTop ? -78 : 60;
            const badgeOffset = isTop ? -60 : 80;
            const topL = `${((pos.y + labelOffset) / VIEW_H) * 100}%`;
            const topB = `${((pos.y + badgeOffset) / VIEW_H) * 100}%`;
            const cfg = NODE_LABEL[v];
            return (
              <div key={v}>
                <div
                  className="absolute -translate-x-1/2"
                  style={{ left, top: topL, fontSize: 13, color: "var(--color-text-secondary)" }}
                >
                  {cfg.label}
                </div>
                <button
                  type="button"
                  onClick={() => togglePin(v)}
                  disabled={isSolved}
                  className="absolute -translate-x-1/2 mono"
                  style={{
                    left, top: topB,
                    background: isSolved ? "var(--color-success-bg)" : "var(--color-text-primary)",
                    color: isSolved ? "var(--color-success)" : "white",
                    fontSize: 10, fontWeight: 500, letterSpacing: "0.08em",
                    padding: "3px 10px",
                    borderRadius: 9999,
                    border: "none",
                    cursor: isSolved ? "default" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isSolved ? "SOLVED" : "PINNED"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct value editing for the pinned variables */}
      <div className="flex justify-center gap-6 mt-3">
        {(["speed", "cadence", "gear"] as TriangleVar[]).filter((v) => state.pinned.includes(v)).map((v) => (
          <label key={v} className="flex items-center gap-2 mono" style={{ fontSize: 12 }}>
            <span style={{ color: "var(--color-text-secondary)" }}>
              {NODE_LABEL[v].label}
            </span>
            <input
              type="number"
              value={v === "gear" ? state[v].toFixed(2) : state[v].toFixed(0)}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                if (!Number.isNaN(n)) setValue(v, n);
              }}
              step={v === "gear" ? 0.05 : 1}
              className="rounded-md px-2 py-1"
              style={{
                width: 80,
                border: "1px solid var(--color-border-default)",
                background: "var(--color-bg-surface)",
                color: "var(--color-text-primary)",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            />
            <span style={{ color: "var(--color-text-tertiary)" }}>{NODE_LABEL[v].unit}</span>
          </label>
        ))}
      </div>

      <div
        className="flex items-center justify-between mt-4 pt-3"
        style={{ borderTop: "1px solid var(--color-border-default)" }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            Closest commercial gears:
          </span>
          {closest.map((g) => {
            const sel = Math.abs(g.ratio - state.gear) < 0.01;
            return (
              <button
                key={g.label}
                type="button"
                onClick={() => setValue("gear", g.ratio)}
                className="rounded-md mono cursor-pointer"
                style={{
                  fontSize: 12,
                  padding: "5px 10px",
                  background: sel ? "var(--color-accent-light)" : "var(--color-bg-surface)",
                  border: `1px solid ${sel ? "var(--color-accent)" : "var(--color-border-default)"}`,
                  color: "var(--color-text-primary)",
                }}
              >
                {g.label}
              </button>
            );
          })}
        </div>
        <div className="mono" style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
          gain ratio {gainRatio.toFixed(1)}
        </div>
      </div>
    </div>
  );
}
