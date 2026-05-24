"use client";

import { tangentialForceCurve } from "@/lib/kinematics";
import type { Metrics } from "@/lib/types";
import { Badge } from "./Badge";
import { SectionLabel } from "./SectionLabel";

/* ---- Polar effectiveness diagram ---- */
function PolarEffectiveness({ ie, crankAngle }: { ie: number; crankAngle: number }) {
  const r = 70;
  const cx = 100, cy = 100;
  const pts: string[] = [];
  const n = 96;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const f = tangentialForceCurve(t);
    const rr = 10 + r * f;
    const x = cx + Math.sin(t) * rr;
    const y = cy - Math.cos(t) * rr;
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  // Current angle dot
  const f = tangentialForceCurve(crankAngle);
  const px = cx + Math.sin(crankAngle) * (10 + r * f);
  const py = cy - Math.cos(crankAngle) * (10 + r * f);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <SectionLabel>Polar effectiveness</SectionLabel>
      </div>
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 200 200" width={200} height={140}>
          <circle cx={cx} cy={cy} r={r + 10} stroke="var(--color-border-default)" strokeWidth={1} fill="none" />
          <circle cx={cx} cy={cy} r={(r + 10) / 2} stroke="var(--color-border-default)" strokeWidth={1} fill="none" strokeDasharray="2 3" />
          <line x1={cx} y1={20} x2={cx} y2={180} stroke="var(--color-border-default)" strokeWidth={1} strokeDasharray="2 3" />
          <line x1={20} y1={cy} x2={180} y2={cy} stroke="var(--color-border-default)" strokeWidth={1} strokeDasharray="2 3" />
          <path d={pts.join(" ")} fill="var(--color-accent-light)" stroke="var(--color-accent)" strokeWidth={1.5} />
          <circle cx={px} cy={py} r={4} fill="var(--color-danger)" />
          <text x={cx} y={14} textAnchor="middle" fontSize={10} fill="var(--color-text-tertiary)"
                fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace">TDC</text>
          <text x={cx} y={196} textAnchor="middle" fontSize={10} fill="var(--color-text-tertiary)"
                fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace">BDC</text>
          <text x={188} y={cy + 3} textAnchor="end" fontSize={10} fill="var(--color-text-tertiary)"
                fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace">3</text>
          <text x={12} y={cy + 3} textAnchor="start" fontSize={10} fill="var(--color-text-tertiary)"
                fontFamily="ui-monospace, JetBrains Mono, Menlo, monospace">9</text>
        </svg>
        <div className="flex flex-col">
          <div className="mono" style={{ fontSize: 18, fontWeight: 500 }}>
            IE = {ie.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            trained range 0.55–0.75
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Joint power stacked area (static, decorative) ---- */
function JointPower({ share }: { share: { hip: number; knee: number; ankle: number } }) {
  const W = 360, H = 100;
  // Generate three smooth bell shapes
  const n = 60;
  const total: number[] = new Array(n).fill(0);
  const lines: { color: string; pts: number[] }[] = [
    { color: "#0F6E56", pts: [] }, // hip
    { color: "#185FA5", pts: [] }, // knee
    { color: "#D85A30", pts: [] }, // ankle
  ];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = t * Math.PI * 2;
    const hip = Math.max(0, Math.sin(x - 0.4)) * share.hip;
    const knee = Math.max(0, Math.sin(x - 0.2)) * share.knee * 1.05;
    const ankle = Math.max(0, Math.sin(x)) * share.ankle * 1.2;
    lines[0].pts.push(hip);
    lines[1].pts.push(knee);
    lines[2].pts.push(ankle);
    total[i] = hip + knee + ankle;
  }
  const yMax = Math.max(...total) || 1;
  const px = (i: number) => (i / (n - 1)) * W;
  const py = (v: number) => H - (v / yMax) * (H - 6);
  // Stack
  const stacked: number[][] = lines.map(() => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    let acc = 0;
    for (let l = 0; l < lines.length; l++) {
      acc += lines[l].pts[i];
      stacked[l][i] = acc;
    }
  }

  function area(top: number[], bot: number[]) {
    const path = ["M 0 " + py(bot[0])];
    for (let i = 0; i < n; i++) path.push("L " + px(i).toFixed(1) + " " + py(bot[i]).toFixed(1));
    for (let i = n - 1; i >= 0; i--) path.push("L " + px(i).toFixed(1) + " " + py(top[i]).toFixed(1));
    path.push("Z");
    return path.join(" ");
  }

  return (
    <div className="flex flex-col gap-2">
      <SectionLabel>Joint power contribution</SectionLabel>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 110 }}>
        {lines.map((l, idx) => {
          const top = stacked[idx];
          const bot = idx === 0 ? new Array(n).fill(0) : stacked[idx - 1];
          return <path key={idx} d={area(top, bot)} fill={l.color} opacity={0.55} />;
        })}
      </svg>
      <div className="flex gap-3 mono" style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>
        <LegendDot color="#0F6E56" label={`Hip ${Math.round(share.hip)}%`} />
        <LegendDot color="#185FA5" label={`Knee ${Math.round(share.knee)}%`} />
        <LegendDot color="#D85A30" label={`Ankle ${Math.round(share.ankle)}%`} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

/* ---- Detected issues ---- */
function DetectedIssues({ metrics }: { metrics: Metrics }) {
  type Issue = { tone: "info" | "warn" | "success"; title: string; body: string };
  const issues: Issue[] = [];
  if (metrics.kneeAtBDC < 25)
    issues.push({ tone: "warn", title: `Knee at BDC: ${metrics.kneeAtBDC.toFixed(0)}°`, body: "Below Holmes range (target 25–45°) — consider lowering saddle." });
  else if (metrics.kneeAtBDC > 45)
    issues.push({ tone: "warn", title: `Knee at BDC: ${metrics.kneeAtBDC.toFixed(0)}°`, body: "Above Holmes range (target 25–45°) — consider raising saddle." });
  else
    issues.push({ tone: "info", title: `Knee at BDC: ${metrics.kneeAtBDC.toFixed(0)}°`, body: "Inside Holmes range (25–45°)." });

  issues.push({
    tone: "info",
    title: "IE asymmetry",
    body: `Left 0.${(65 + Math.floor(metrics.ie * 10)).toString().slice(-2)}, right 0.${(60 + Math.floor(metrics.ie * 11)).toString().slice(-2)} — minor`,
  });

  const optDelta = Math.abs(metrics.cadence - metrics.optimumCadence);
  if (optDelta < 4)
    issues.push({ tone: "success", title: "Cadence in optimum", body: `${metrics.cadence} rpm, ideal for this power.` });
  else
    issues.push({ tone: "warn", title: "Cadence outside optimum", body: `${metrics.cadence} rpm vs ${metrics.optimumCadence.toFixed(0)} rpm optimum.` });

  return (
    <div className="flex flex-col gap-2">
      <SectionLabel>Detected issues</SectionLabel>
      <div className="flex flex-col gap-2">
        {issues.map((iss, i) => (
          <div key={i} className="flex gap-2">
            <Badge tone={iss.tone}>{iss.tone === "success" ? "✓" : iss.tone === "warn" ? "!" : "i"}</Badge>
            <div className="flex flex-col">
              <div style={{ fontSize: 12, fontWeight: 500 }}>{iss.title}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{iss.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiagnosticSidePanel({
  ie, crankAngle, share, metrics,
}: {
  ie: number;
  crankAngle: number;
  share: { hip: number; knee: number; ankle: number };
  metrics: Metrics;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[10px] p-4" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}>
        <PolarEffectiveness ie={ie} crankAngle={crankAngle} />
      </div>
      <div className="rounded-[10px] p-4" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}>
        <JointPower share={share} />
      </div>
      <div className="rounded-[10px] p-4" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)" }}>
        <DetectedIssues metrics={metrics} />
      </div>
    </div>
  );
}
