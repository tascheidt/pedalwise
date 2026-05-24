"use client";

import { useEffect, useRef } from "react";
import type { Config, Frame, ViewMode } from "@/lib/types";
import { computeFrame, tangentialForceCurve } from "@/lib/kinematics";

type Props = {
  config: Config;
  ghostConfig?: Config | null;
  mode: ViewMode;
  /** rad/s; if 0 the simulator is paused at the current angle */
  angularVel: number;
  /** Manual scrub override (rad) — when set, animation pauses on this value */
  scrubAngle?: number | null;
  className?: string;
  /** Render aspect = width / height */
  aspect?: number;
};

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ */
/*  Drawing helpers                                                   */
/* ------------------------------------------------------------------ */

type Camera = {
  scale: number; // px per cm
  cx: number;    // BB x in canvas px
  cy: number;    // BB y in canvas px
};

function makeCamera(
  cfg: Config,
  canvasW: number,
  canvasH: number,
): Camera {
  // World extent: saddle is roughly at y=saddleHeight (~75 cm). Crank reaches
  // ~17 cm below BB. Torso adds maybe 60 cm above hip. So vertical world
  // span ~170 cm. Add 30% padding.
  const worldH = cfg.saddleHeight + 70 + 25;
  const worldW = worldH * 0.75;
  const scale = Math.min(canvasW / worldW, canvasH / worldH);
  // Place BB slightly below center
  const cx = canvasW * 0.55;
  const cy = canvasH * 0.78;
  return { scale, cx, cy };
}

function worldToCanvas(cam: Camera, x: number, y: number): [number, number] {
  return [cam.cx + x * cam.scale, cam.cy - y * cam.scale];
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(168,162,158,0.18)";
  ctx.lineWidth = 1;
  const step = 24;
  ctx.beginPath();
  for (let x = 0; x <= w; x += step) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
  }
  for (let y = 0; y <= h; y += step) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPedalArc(ctx: CanvasRenderingContext2D, cam: Camera, cfg: Config) {
  const crankCm = cfg.crankLength / 10;
  const [cx, cy] = worldToCanvas(cam, 0, 0);
  ctx.save();
  ctx.strokeStyle = "rgba(168,162,158,0.4)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, crankCm * cam.scale, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawReachEnvelope(ctx: CanvasRenderingContext2D, cam: Camera, cfg: Config) {
  const maxLeg = cfg.femur + cfg.tibia + cfg.foot;
  const [sx, sy] = worldToCanvas(cam, -cfg.saddleSetback, cfg.saddleHeight);
  ctx.save();
  ctx.strokeStyle = "rgba(168,162,158,0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.arc(sx, sy, maxLeg * cam.scale, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawFrameStub(ctx: CanvasRenderingContext2D, cam: Camera, cfg: Config) {
  const [bbX, bbY] = worldToCanvas(cam, 0, 0);
  const [seatX, seatY] = worldToCanvas(cam, -cfg.saddleSetback, cfg.saddleHeight);
  // Seat tube
  ctx.save();
  ctx.strokeStyle = "var(--color-text-tertiary)";
  ctx.strokeStyle = "rgba(120,113,108,0.85)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(bbX, bbY);
  ctx.lineTo(seatX, seatY);
  ctx.stroke();
  // Saddle nose
  ctx.fillStyle = "rgba(28,25,23,0.9)";
  ctx.beginPath();
  const saddleW = 22;
  ctx.ellipse(seatX, seatY - 6, saddleW * 0.6, 5, -0.2, 0, TAU);
  ctx.fill();
  // BB dot
  ctx.fillStyle = "rgba(28,25,23,0.85)";
  ctx.beginPath();
  ctx.arc(bbX, bbY, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawDeadZones(ctx: CanvasRenderingContext2D, cam: Camera, cfg: Config) {
  const crankCm = cfg.crankLength / 10;
  const [tdcX, tdcY] = worldToCanvas(cam, 0, crankCm);
  const [bdcX, bdcY] = worldToCanvas(cam, 0, -crankCm);
  ctx.save();
  ctx.fillStyle = "var(--color-danger)";
  ctx.fillStyle = "rgba(163,45,45,0.6)";
  ctx.beginPath();
  ctx.arc(tdcX, tdcY, 6, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bdcX, bdcY, 6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(163,45,45,0.95)";
  ctx.font = "10px ui-monospace, 'JetBrains Mono', Menlo, monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("TDC", tdcX + 10, tdcY - 1);
  ctx.fillText("BDC", bdcX + 10, bdcY + 1);
  ctx.restore();
}

function drawLegOutline(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  hip: { x: number; y: number },
  knee: { x: number; y: number },
  pedal: { x: number; y: number },
  opts: { active: boolean; ghost?: boolean; jointDots: boolean },
) {
  const [hx, hy] = worldToCanvas(cam, hip.x, hip.y);
  const [kx, ky] = worldToCanvas(cam, knee.x, knee.y);
  const [px, py] = worldToCanvas(cam, pedal.x, pedal.y);

  ctx.save();
  if (opts.ghost) ctx.globalAlpha = 0.28;
  ctx.strokeStyle = opts.active ? "rgba(28,25,23,0.95)" : "rgba(168,162,158,0.85)";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = opts.active ? 8 : 7;
  // Thigh
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(kx, ky);
  ctx.stroke();
  // Shank+foot
  ctx.beginPath();
  ctx.moveTo(kx, ky);
  ctx.lineTo(px, py);
  ctx.stroke();

  // Foot tab
  if (opts.active) {
    const dx = px - kx, dy = py - ky;
    const n = Math.hypot(dx, dy) || 1;
    const ux = dx / n, uy = dy / n;
    // Perpendicular forward
    const fx = -uy, fy = ux;
    ctx.fillStyle = "rgba(28,25,23,0.9)";
    ctx.beginPath();
    ctx.moveTo(px - ux * 2 - fx * 4, py - uy * 2 - fy * 4);
    ctx.lineTo(px + ux * 12 - fx * 4, py + uy * 12 - fy * 4);
    ctx.lineTo(px + ux * 12 + fx * 4, py + uy * 12 + fy * 4);
    ctx.lineTo(px - ux * 2 + fx * 4, py - uy * 2 + fy * 4);
    ctx.closePath();
    ctx.fill();
  }

  if (opts.jointDots) {
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.strokeStyle = "rgba(28,25,23,0.9)";
    ctx.lineWidth = 1.5;
    for (const [x, y] of [[hx, hy], [kx, ky], [px, py]]) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawLegFilled(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  hip: { x: number; y: number },
  knee: { x: number; y: number },
  pedal: { x: number; y: number },
  active: boolean,
) {
  const [hx, hy] = worldToCanvas(cam, hip.x, hip.y);
  const [kx, ky] = worldToCanvas(cam, knee.x, knee.y);
  const [px, py] = worldToCanvas(cam, pedal.x, pedal.y);

  ctx.save();
  ctx.strokeStyle = active ? "rgba(28,25,23,0.95)" : "rgba(120,113,108,0.6)";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(kx, ky);
  ctx.stroke();
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(kx, ky);
  ctx.lineTo(px, py);
  ctx.stroke();
  ctx.restore();
}

function drawTorso(ctx: CanvasRenderingContext2D, cam: Camera, cfg: Config) {
  // Simple cycling silhouette: torso leans forward 45°, arm reaches to bars.
  const [hipX, hipY] = worldToCanvas(cam, -cfg.saddleSetback, cfg.saddleHeight);
  const torsoLen = 55; // cm
  const forwardAngle = (45 * Math.PI) / 180; // lean from vertical
  const shoulderXcm = -cfg.saddleSetback + torsoLen * Math.sin(forwardAngle);
  const shoulderYcm = cfg.saddleHeight + torsoLen * Math.cos(forwardAngle);
  const [sx, sy] = worldToCanvas(cam, shoulderXcm, shoulderYcm);
  // Arm
  const armLen = 55;
  const armAngle = (60 * Math.PI) / 180;
  const wristXcm = shoulderXcm + armLen * Math.sin(armAngle);
  const wristYcm = shoulderYcm - armLen * Math.cos(armAngle);
  const [wx, wy] = worldToCanvas(cam, wristXcm, wristYcm);

  ctx.save();
  ctx.lineCap = "round";
  // Torso
  ctx.strokeStyle = "rgba(68,64,60,0.92)";
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(sx, sy);
  ctx.stroke();
  // Arm
  ctx.lineWidth = 11;
  ctx.strokeStyle = "rgba(120,113,108,0.85)";
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(wx, wy);
  ctx.stroke();
  // Neck + head + helmet
  const neckLen = 12;
  const headX = sx + Math.cos(forwardAngle) * neckLen;
  const headY = sy - Math.sin(forwardAngle) * neckLen;
  ctx.fillStyle = "rgba(68,64,60,0.95)";
  ctx.beginPath();
  ctx.arc(headX, headY, 14, 0, TAU);
  ctx.fill();
  // Helmet: chunk over the front
  ctx.fillStyle = "rgba(28,25,23,0.96)";
  ctx.beginPath();
  ctx.arc(headX, headY - 4, 13, Math.PI * 0.95, Math.PI * 2.05, false);
  ctx.fill();
  ctx.restore();
}

function drawMotionTrail(ctx: CanvasRenderingContext2D, cam: Camera, cfg: Config, theta: number) {
  const crankCm = cfg.crankLength / 10;
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const ago = (i + 1) * (Math.PI / 60) * 5; // up to ~25°
    const t = theta - ago;
    const x = crankCm * Math.sin(t);
    const y = -crankCm * Math.cos(t);
    const [px, py] = worldToCanvas(cam, x, y);
    ctx.fillStyle = `rgba(28,25,23,${0.18 - i * 0.025})`;
    ctx.beginPath();
    ctx.arc(px, py, 5 - i * 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawForceVectors(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  cfg: Config,
  frame: Frame,
) {
  const crankCm = cfg.crankLength / 10;
  const t = frame.crankAngle;
  // Only on the propulsive phase
  if (!(t > Math.PI / 4 && t < (3 * Math.PI) / 4)) return;
  const force = tangentialForceCurve(t);
  const [px, py] = worldToCanvas(cam, frame.right.pedal.x, frame.right.pedal.y);
  // Tangential = perpendicular to crank arm, in direction of motion (CW)
  const tx = Math.cos(t), ty = Math.sin(t);
  const len = 60 + force * 80;
  ctx.save();
  // Radial wasted force (gray dashed)
  const rlen = 18 + force * 14;
  const rx = Math.sin(t), ry = -Math.cos(t);
  ctx.strokeStyle = "rgba(120,113,108,0.85)";
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + rx * rlen, py + ry * rlen * -1);
  ctx.stroke();
  ctx.setLineDash([]);
  // Tangential (green)
  ctx.strokeStyle = "var(--color-success)";
  ctx.strokeStyle = "rgba(15,110,86,1)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + tx * len, py - ty * len);
  ctx.stroke();
  // Arrow head
  const ahx = px + tx * len, ahy = py - ty * len;
  const ax = -tx, ay = ty;
  const ox = -ty, oy = -tx;
  ctx.fillStyle = "rgba(15,110,86,1)";
  ctx.beginPath();
  ctx.moveTo(ahx, ahy);
  ctx.lineTo(ahx + ax * 8 + ox * 4, ahy + ay * 8 + oy * 4);
  ctx.lineTo(ahx + ax * 8 - ox * 4, ahy + ay * 8 - oy * 4);
  ctx.closePath();
  ctx.fill();
  // Hip-to-pedal resultant
  const [hx, hy] = worldToCanvas(cam, frame.right.hip.x, frame.right.hip.y);
  ctx.strokeStyle = "rgba(163,45,45,0.55)";
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(px, py);
  ctx.stroke();
  ctx.restore();
  void crankCm;
}

function drawAngleLabels(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  frame: Frame,
) {
  // Right leg knee angle label
  const [kx, ky] = worldToCanvas(cam, frame.right.knee.x, frame.right.knee.y);
  ctx.save();
  ctx.font = "12px ui-monospace, 'JetBrains Mono', Menlo, monospace";
  ctx.fillStyle = "var(--color-danger)";
  ctx.fillStyle = "rgba(163,45,45,1)";
  ctx.textBaseline = "middle";
  ctx.fillText(`${Math.round(frame.right.kneeAngle)}°`, kx + 12, ky);
  ctx.fillStyle = "rgba(168,162,158,1)";
  ctx.font = "10px ui-monospace, 'JetBrains Mono', Menlo, monospace";
  ctx.fillText("knee", kx + 14, ky + 12);

  // Hip angle label
  const [hx, hy] = worldToCanvas(cam, frame.right.hip.x, frame.right.hip.y);
  ctx.fillStyle = "rgba(28,25,23,0.9)";
  ctx.font = "12px ui-monospace, 'JetBrains Mono', Menlo, monospace";
  ctx.fillText(`${Math.round(frame.right.hipAngle)}°`, hx - 38, hy + 4);
  ctx.fillStyle = "rgba(168,162,158,1)";
  ctx.font = "10px ui-monospace, 'JetBrains Mono', Menlo, monospace";
  ctx.fillText("hip", hx - 26, hy + 16);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function Simulator({
  config,
  ghostConfig = null,
  mode,
  angularVel,
  scrubAngle = null,
  className,
  aspect = 1.5,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thetaRef = useRef(Math.PI / 4);
  const lastTRef = useRef<number | null>(null);
  const cfgRef = useRef(config);
  const ghostRef = useRef(ghostConfig);
  const modeRef = useRef(mode);
  const velRef = useRef(angularVel);
  const scrubRef = useRef<number | null>(scrubAngle);

  // Keep refs in sync without restarting the RAF loop
  useEffect(() => { cfgRef.current = config; }, [config]);
  useEffect(() => { ghostRef.current = ghostConfig; }, [ghostConfig]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { velRef.current = angularVel; }, [angularVel]);
  useEffect(() => { scrubRef.current = scrubAngle; }, [scrubAngle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;

    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function step(t: number) {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const last = lastTRef.current;
      lastTRef.current = t;
      const dt = last == null ? 0 : Math.min(0.05, (t - last) / 1000);
      const scrub = scrubRef.current;
      if (scrub != null) {
        thetaRef.current = scrub;
      } else if (!reduced) {
        thetaRef.current += velRef.current * dt;
      }

      const cfg = cfgRef.current;
      const ghost = ghostRef.current;
      const m = modeRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const cam = makeCamera(cfg, w, h);

      // 1 — Grid
      drawGrid(ctx, w, h);
      // 2 — Pedal arc / reach
      drawPedalArc(ctx, cam, cfg);
      if (m === "anatomical" || m === "diagnostic") drawReachEnvelope(ctx, cam, cfg);
      // 4 — Dead zones (below the legs)
      if (m === "diagnostic") drawDeadZones(ctx, cam, cfg);
      // 3 — Frame stub
      drawFrameStub(ctx, cam, cfg);

      const frame = computeFrame(cfg, thetaRef.current);

      if (m === "realistic") {
        // Ghost leg (left) first
        drawLegFilled(ctx, cam, frame.left.hip, frame.left.knee, frame.left.pedal, false);
        // Active leg (right)
        drawLegFilled(ctx, cam, frame.right.hip, frame.right.knee, frame.right.pedal, true);
        // Torso on top
        drawTorso(ctx, cam, cfg);
        // Motion blur trail
        drawMotionTrail(ctx, cam, cfg, thetaRef.current);
      } else {
        // Ghost overlay (current config faded)
        if (ghost) {
          const gframe = computeFrame(ghost, thetaRef.current);
          drawLegOutline(ctx, cam, gframe.left.hip, gframe.left.knee, gframe.left.pedal,
            { active: false, ghost: true, jointDots: false });
          drawLegOutline(ctx, cam, gframe.right.hip, gframe.right.knee, gframe.right.pedal,
            { active: true, ghost: true, jointDots: false });
        }
        // Left (back) leg
        drawLegOutline(ctx, cam, frame.left.hip, frame.left.knee, frame.left.pedal,
          { active: false, jointDots: m === "anatomical" || m === "diagnostic" });
        // Right (front/active) leg
        drawLegOutline(ctx, cam, frame.right.hip, frame.right.knee, frame.right.pedal,
          { active: true, jointDots: m === "anatomical" || m === "diagnostic" });

        if (m === "anatomical" || m === "diagnostic") drawAngleLabels(ctx, cam, frame);
        if (m === "diagnostic") drawForceVectors(ctx, cam, cfg, frame);
      }

      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={className} style={{ position: "relative", width: "100%", aspectRatio: aspect }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
