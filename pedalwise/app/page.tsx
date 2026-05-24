"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Config, Preset, ViewMode } from "@/lib/types";
import { DEFAULT_CONFIG, PRESETS } from "@/lib/presets";
import { evaluate } from "@/lib/kinematics";
import { useOptimizer } from "@/lib/useOptimizer";

import { ViewModeToggle } from "@/components/ViewModeToggle";
import { Simulator } from "@/components/Simulator";
import { ControlsRail } from "@/components/ControlsRail";
import { KneeFlexionChart } from "@/components/charts/KneeFlexionChart";
import { CrankTorqueChart } from "@/components/charts/CrankTorqueChart";
import { EfficiencyCadenceChart } from "@/components/charts/EfficiencyCadenceChart";
import { HudStrip } from "@/components/HudStrip";
import { SpeedControl } from "@/components/SpeedControl";
import {
  RecommendationPanel,
  RecommendationSkeleton,
  RecommendationIdle,
} from "@/components/RecommendationPanel";
import { DiagnosticSidePanel } from "@/components/DiagnosticPanels";
import { SpeedCadenceGearTriangle } from "@/components/SpeedCadenceGearTriangle";
import { Badge } from "@/components/Badge";
import { SectionLabel } from "@/components/SectionLabel";

const STORAGE_KEY = "pedalwise.viewMode";

function readStoredMode(): ViewMode {
  if (typeof window === "undefined") return "anatomical";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "anatomical" || saved === "realistic" || saved === "diagnostic"
    ? saved
    : "anatomical";
}

export default function Page() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [preset, setPreset] = useState<Preset>("5'9\"");
  const [mode, setMode] = useState<ViewMode>(readStoredMode);
  const [speed, setSpeed] = useState(1);
  const [crankAngle, setCrankAngle] = useState(Math.PI / 4);
  const [scrub, setScrub] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const { state: optState, run: runOptimize, clear: clearOpt } = useOptimizer();

  // Metrics for HUD + charts
  const metrics = useMemo(() => evaluate(config), [config]);

  // Apply preset
  const handlePreset = useCallback((p: Preset) => {
    setPreset(p);
    if (p !== "Custom") {
      setConfig(PRESETS[p]);
    }
    clearOpt();
  }, [clearOpt]);

  const handleConfigChange = useCallback((patch: Partial<Config>) => {
    setConfig((c) => ({ ...c, ...patch }));
    setPreset("Custom");
    if (optState.kind === "done") clearOpt();
  }, [optState.kind, clearOpt]);

  const handleApply = useCallback(() => {
    if (optState.kind !== "done") return;
    const rec = optState.rec;
    setConfig((c) => ({
      ...c,
      saddleHeight: rec.fit.saddleHeight,
      crankLength: rec.fit.crankLength,
      saddleSetback: rec.fit.saddleSetback,
      cadence: rec.goal.cadence,
    }));
    setPreset("Custom");
    clearOpt();
  }, [optState, clearOpt]);

  const handleExport = useCallback(() => {
    if (typeof window !== "undefined") window.print();
  }, []);

  // Crank angle track for charts
  useEffect(() => {
    let raf = 0;
    let last: number | null = null;
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function step(t: number) {
      const dt = last == null ? 0 : Math.min(0.05, (t - last) / 1000);
      last = t;
      if (scrub != null) {
        setCrankAngle(scrub);
      } else if (!reduced) {
        const omega = (config.cadence * 2 * Math.PI) / 60;
        setCrankAngle((a) => (a + omega * speed * dt) % (Math.PI * 2));
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [config.cadence, speed, scrub]);

  const ghostConfig = optState.kind === "done" ? config : null;
  const previewConfig: Config = optState.kind === "done"
    ? { ...config, ...optState.rec.fit, cadence: optState.rec.goal.cadence }
    : config;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-app)" }}>
      <Header mode={mode} onModeChange={setMode} />

      {mode === "diagnostic" ? (
        <DiagnosticLayout
          config={previewConfig}
          ghostConfig={ghostConfig}
          speed={speed}
          setSpeed={setSpeed}
          scrub={scrub}
          setScrub={setScrub}
        />
      ) : mode === "realistic" ? (
        <RealisticLayout config={previewConfig} ghostConfig={ghostConfig} />
      ) : (
        <AnatomicalLayout
          config={previewConfig}
          ghostConfig={ghostConfig}
          configBeingControlled={config}
          preset={preset}
          metrics={evaluate(previewConfig)}
          speed={speed}
          setSpeed={setSpeed}
          scrub={scrub}
          setScrub={setScrub}
          crankAngle={crankAngle}
          onPresetChange={handlePreset}
          onConfigChange={handleConfigChange}
          onOptimize={() => runOptimize(config)}
          onReset={() => { setConfig(DEFAULT_CONFIG); setPreset("5'9\""); clearOpt(); }}
          onApply={handleApply}
          onDismiss={clearOpt}
          onExport={handleExport}
          optState={optState}
        />
      )}

      <SpeedCadenceGearSection config={previewConfig} />

      <Footer />
      {/* Silence unused-var warning for the top-level metrics */}
      <span style={{ display: "none" }}>{Math.round(metrics.power)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                            */
/* ------------------------------------------------------------------ */

function Header({ mode, onModeChange }: { mode: ViewMode; onModeChange: (m: ViewMode) => void }) {
  return (
    <header
      className="flex items-center justify-between px-6 py-3"
      style={{ borderBottom: "1px solid var(--color-border-default)", background: "var(--color-bg-surface)" }}
    >
      <div className="flex items-baseline gap-2">
        <div style={{ fontSize: 18, fontWeight: 500 }}>Pedalwise</div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Sagittal biomechanics</div>
      </div>
      <div className="flex items-center gap-3">
        <ViewModeToggle value={mode} onChange={onModeChange} />
        <div className="rounded-full mono flex items-center justify-center"
             style={{
               width: 32, height: 32, background: "var(--color-accent)",
               color: "white", fontSize: 11, fontWeight: 500,
             }}>
          TS
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Anatomical layout                                                 */
/* ------------------------------------------------------------------ */

type AnatomicalProps = {
  config: Config;
  ghostConfig: Config | null;
  configBeingControlled: Config;
  preset: Preset;
  metrics: ReturnType<typeof evaluate>;
  speed: number;
  setSpeed: (n: number) => void;
  scrub: number | null;
  setScrub: (n: number | null) => void;
  crankAngle: number;
  onPresetChange: (p: Preset) => void;
  onConfigChange: (patch: Partial<Config>) => void;
  onOptimize: () => void;
  onReset: () => void;
  onApply: () => void;
  onDismiss: () => void;
  onExport: () => void;
  optState: ReturnType<typeof useOptimizer>["state"];
};

function AnatomicalLayout(p: AnatomicalProps) {
  const goalLabel = p.config.roadGrade === 0 ? "flat" : `${p.config.roadGrade > 0 ? "+" : ""}${p.config.roadGrade}%`;
  return (
    <main className="flex-1 mx-auto w-full" style={{ maxWidth: 1500, padding: "16px 16px 32px" }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: "280px minmax(0, 1fr) 320px" }}>
        {/* Left rail */}
        <div>
          <ControlsRail
            config={p.configBeingControlled}
            preset={p.preset}
            recommendation={p.optState.kind === "done" ? p.optState.rec : null}
            onPresetChange={p.onPresetChange}
            onConfigChange={p.onConfigChange}
            onOptimize={p.onOptimize}
            onReset={p.onReset}
            optimizing={p.optState.kind === "running"}
          />
        </div>

        {/* Center column */}
        <div className="flex flex-col gap-3">
          <div
            className="rounded-[10px] p-4 flex flex-col gap-2"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}
          >
            <div className="flex items-baseline justify-between">
              <SectionLabel>Sagittal view · drive side</SectionLabel>
              <div className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                Endurance · {p.config.targetSpeed.toFixed(0)} km/h · {goalLabel}
              </div>
            </div>

            <Simulator
              config={p.config}
              ghostConfig={p.ghostConfig}
              mode="anatomical"
              angularVel={(p.config.cadence * 2 * Math.PI) / 60 * p.speed}
              scrubAngle={p.scrub}
            />

            {/* HUD strip */}
            <div className="flex items-center justify-between mt-2">
              <HudStrip metrics={p.metrics} />
              <div className="flex items-center gap-3">
                <SpeedControl value={p.speed} onChange={p.setSpeed} />
                <input
                  type="range"
                  min={0}
                  max={2 * Math.PI}
                  step={0.05}
                  value={p.scrub ?? 0}
                  onChange={(e) => p.setScrub(parseFloat(e.target.value))}
                  style={{ width: 120 }}
                  aria-label="Crank angle scrubber"
                />
                <button
                  type="button"
                  onClick={() => p.setScrub(null)}
                  className="mono cursor-pointer"
                  style={{ fontSize: 11, color: "var(--color-text-secondary)" }}
                >
                  ▶ run
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <KneeFlexionChart config={p.config} crankAngle={p.crankAngle} />
            <CrankTorqueChart />
            <EfficiencyCadenceChart config={p.config} />
          </div>

          {p.metrics.geometryImpossible && (
            <div className="rounded-[10px] p-4"
                 style={{ background: "var(--color-danger-bg)", border: "1px solid var(--color-danger)", color: "var(--color-danger)" }}>
              <strong>Geometry impossible.</strong> {p.metrics.impossibleReason} Lower the saddle, lengthen leg segments, or shorten the crank.
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-3">
          <div
            className="rounded-[10px] p-4"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}
          >
            {p.optState.kind === "idle" && <RecommendationIdle />}
            {p.optState.kind === "running" && <RecommendationSkeleton />}
            {p.optState.kind === "done" && (
              <RecommendationPanel
                rec={p.optState.rec}
                onApply={p.onApply}
                onDismiss={p.onDismiss}
                onExport={p.onExport}
              />
            )}
          </div>

          {p.optState.kind === "idle" && <CurrentSummary config={p.config} />}
        </div>
      </div>
    </main>
  );
}

function CurrentSummary({ config }: { config: Config }) {
  const m = evaluate(config);
  const kneeStatus: "success" | "warn" =
    m.kneeAtBDC >= 25 && m.kneeAtBDC <= 45 ? "success" : "warn";
  return (
    <div className="rounded-[10px] p-4"
         style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}>
      <div className="flex items-baseline justify-between mb-3">
        <SectionLabel>Current configuration</SectionLabel>
        <Badge tone={config.fastTwitchPct >= 45 ? "info" : "neutral"}>
          {config.fastTwitchPct >= 45 ? "Trained" : "Recreational"}
        </Badge>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Stat label="Crank length"  value={`${config.crankLength.toFixed(1)} mm`} />
        <Stat label="Saddle height" value={`${config.saddleHeight.toFixed(1)} cm`} />
        <Stat label="Setback"       value={`${config.saddleSetback.toFixed(1)} cm`} />
        <Stat label="Cadence"       value={`${config.cadence} rpm`} note={`opt ${m.optimumCadence.toFixed(0)}`} />
        <Stat label="Knee at BDC"   value={`${m.kneeAtBDC.toFixed(0)}°`} status={kneeStatus}
              note={kneeStatus === "success" ? "in Holmes range" : "out of range"} />
        <Stat label="Metabolic"     value={`${m.metabolicCost.toFixed(0)} W`} />
      </div>
    </div>
  );
}

function Stat({ label, value, note, status }: { label: string; value: string; note?: string; status?: "success" | "warn" | "danger" }) {
  const color = status === "success" ? "var(--color-success)" :
                status === "warn" ? "var(--color-warn)" :
                status === "danger" ? "var(--color-danger)" : "var(--color-text-primary)";
  return (
    <div className="flex flex-col gap-1 rounded-md p-2" style={{ background: "var(--color-bg-alt)" }}>
      <span className="section-label">{label}</span>
      <span className="mono" style={{ fontSize: 16, fontWeight: 500, color }}>{value}</span>
      {note && <span className="italic" style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{note}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Realistic layout                                                  */
/* ------------------------------------------------------------------ */

function RealisticLayout({ config, ghostConfig }: { config: Config; ghostConfig: Config | null }) {
  const metrics = useMemo(() => evaluate(config), [config]);
  return (
    <main className="flex-1 mx-auto w-full" style={{ maxWidth: 1500, padding: "16px 16px 32px" }}>
      <div className="rounded-[10px] p-6 flex flex-col gap-3"
           style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}>
        <div className="flex items-baseline justify-between">
          <SectionLabel>Realistic mode · marketing capture</SectionLabel>
          <Badge tone="success">Active</Badge>
        </div>
        <Simulator
          config={config}
          ghostConfig={ghostConfig}
          mode="realistic"
          angularVel={(config.cadence * 2 * Math.PI) / 60}
          aspect={2}
        />
        <div className="flex items-baseline justify-center mt-3">
          <div className="flex items-end gap-12" style={{ width: "100%", justifyContent: "space-around" }}>
            <RealisticStat value={`${metrics.speed.toFixed(0)}`} unit="km/h" label="cruising · flat road" />
            <RealisticStat value={`${metrics.power.toFixed(0)}`} unit="W" label="power output" />
            <RealisticStat value={`${metrics.cadence}`} unit="rpm" label="cadence" />
          </div>
        </div>
      </div>
    </main>
  );
}

function RealisticStat({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-baseline gap-1">
        <span style={{ fontSize: 36, fontWeight: 500, color: "var(--color-text-primary)" }}>{value}</span>
        <span style={{ fontSize: 18, color: "var(--color-text-secondary)" }}>{unit}</span>
      </div>
      <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Diagnostic layout                                                 */
/* ------------------------------------------------------------------ */

function DiagnosticLayout({
  config, ghostConfig, speed, setSpeed, scrub, setScrub,
}: {
  config: Config;
  ghostConfig: Config | null;
  speed: number;
  setSpeed: (n: number) => void;
  scrub: number | null;
  setScrub: (n: number | null) => void;
}) {
  const metrics = useMemo(() => evaluate(config), [config]);
  const [angle, setAngle] = useState(Math.PI / 2);
  useEffect(() => {
    let raf = 0;
    let last: number | null = null;
    function step(t: number) {
      const dt = last == null ? 0 : Math.min(0.05, (t - last) / 1000);
      last = t;
      if (scrub != null) setAngle(scrub);
      else setAngle((a) => (a + ((config.cadence * 2 * Math.PI) / 60) * speed * dt) % (Math.PI * 2));
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [config.cadence, speed, scrub]);

  return (
    <main className="flex-1 mx-auto w-full" style={{ maxWidth: 1500, padding: "16px 16px 32px" }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0, 1.4fr) 360px" }}>
        <div className="rounded-[10px] p-4 flex flex-col gap-3"
             style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}>
          <div className="flex items-baseline justify-between">
            <SectionLabel>Sagittal · force decomposition</SectionLabel>
            <Badge tone="info">Coach mode</Badge>
          </div>
          <Simulator
            config={config}
            ghostConfig={ghostConfig}
            mode="diagnostic"
            angularVel={(config.cadence * 2 * Math.PI) / 60 * speed}
            scrubAngle={scrub}
            aspect={1.4}
          />
          <div className="flex items-center justify-between">
            <div className="mono flex gap-4" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              <LegendLine color="rgba(15,110,86,1)" label="Tangential (propulsive)" />
              <LegendLine color="rgba(120,113,108,1)" label="Radial (wasted)" dashed />
              <LegendDot color="rgba(163,45,45,0.6)" label="Dead zone" />
            </div>
            <div className="flex items-center gap-3">
              <SpeedControl value={speed} onChange={setSpeed} />
              <input
                type="range"
                min={0}
                max={2 * Math.PI}
                step={0.05}
                value={scrub ?? 0}
                onChange={(e) => setScrub(parseFloat(e.target.value))}
                style={{ width: 120 }}
                aria-label="Crank scrubber"
              />
              <button type="button" onClick={() => setScrub(null)} className="mono cursor-pointer"
                      style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>▶ run</button>
            </div>
          </div>
        </div>

        <DiagnosticSidePanel
          ie={metrics.ie}
          crankAngle={angle}
          share={metrics.jointShare}
          metrics={metrics}
        />
      </div>
    </main>
  );
}

function LegendLine({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <svg width={20} height={6}>
        <line x1={0} y1={3} x2={20} y2={3} stroke={color} strokeWidth={2} strokeDasharray={dashed ? "3 2" : undefined} />
      </svg>
      {label}
    </span>
  );
}
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span style={{ width: 8, height: 8, borderRadius: 9999, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Triangle section + footer                                         */
/* ------------------------------------------------------------------ */

function SpeedCadenceGearSection({ config }: { config: Config }) {
  return (
    <section className="mx-auto w-full" style={{ maxWidth: 1500, padding: "0 16px 32px" }}>
      <SpeedCadenceGearTriangle
        initial={{
          speed: config.targetSpeed,
          cadence: config.cadence,
          gear: 3.06,
          pinned: ["speed", "cadence"],
        }}
      />
    </section>
  );
}

function Footer() {
  return (
    <footer className="text-center" style={{ padding: "0 0 24px", fontSize: 11, color: "var(--color-text-tertiary)" }}>
      Pedalwise · v1.0 · sagittal biomechanics simulator
    </footer>
  );
}
