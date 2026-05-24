"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { SectionLabel } from "@/components/SectionLabel";
import { StatCard } from "@/components/StatCard";

import { PersonaSwitcher } from "@/components/workspace/PersonaSwitcher";
import { SimulatorWorkspace } from "@/components/workspace/SimulatorWorkspace";

import { evaluate } from "@/lib/kinematics";
import { encodeConfig } from "@/lib/share";
import type { Config } from "@/lib/types";

import { AnatomyForm } from "@/components/diy/AnatomyForm";
import { CurrentFitForm } from "@/components/diy/CurrentFitForm";
import { GoalPicker } from "@/components/diy/GoalPicker";
import { Explainer } from "@/components/diy/Explainer";
import { StepRail } from "@/components/diy/StepRail";
import { StepShell } from "@/components/diy/StepShell";
import {
  type DiyStep,
  isDiyStep,
  stepIndex,
  useDiyDraft,
} from "@/components/diy/useDiyDraft";

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export default function DIYStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: stepParam } = use(params);
  const router = useRouter();

  // Unknown slug → bounce to the start. Avoids a 404 from a typo.
  useEffect(() => {
    if (!isDiyStep(stepParam)) router.replace("/diy/welcome");
  }, [stepParam, router]);

  const step: DiyStep = isDiyStep(stepParam) ? stepParam : "welcome";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-bg-app)" }}
      data-testid="diy-workspace"
    >
      <DIYHeader />

      <main className="flex-1" style={{ minHeight: 0 }}>
        <DIYStepBody step={step} />
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                            */
/* ------------------------------------------------------------------ */

function DIYHeader() {
  return (
    <header
      className="flex items-center justify-between px-6 py-3"
      style={{
        borderBottom: "1px solid var(--color-border-default)",
        background: "var(--color-bg-surface)",
      }}
    >
      <div className="flex items-center gap-3">
        <PersonaSwitcher persona="diy" />
        <div className="flex items-baseline gap-2">
          <div style={{ fontSize: 18, fontWeight: 500 }}>Pedalwise</div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            DIY guided fit
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Body — splits the rail from the step content                      */
/* ------------------------------------------------------------------ */

function DIYStepBody({ step }: { step: DiyStep }) {
  const { draft, updateConfig, markFurthest, reset } = useDiyDraft();
  const config = draft.config;

  // The current step is reachable; widen `furthest` if the user clicked
  // a deep link or refreshed onto a later step.
  useEffect(() => {
    markFurthest(step);
  }, [step, markFurthest]);

  const showRail = step !== "welcome";

  if (!showRail) {
    return (
      <div
        className="mx-auto w-full"
        style={{ maxWidth: 720, padding: "64px 24px" }}
      >
        <WelcomeStep onReset={reset} hasDraft={stepIndex(draft.furthest) > 0} />
      </div>
    );
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "300px minmax(0, 1fr)",
        minHeight: "calc(100vh - 53px)",
      }}
    >
      <StepRail current={step} furthest={draft.furthest} />
      <div className="mx-auto w-full" style={{ maxWidth: 1100 }}>
        {step === "anatomy" && (
          <AnatomyStep config={config} onChange={updateConfig} />
        )}
        {step === "current-fit" && (
          <CurrentFitStep config={config} onChange={updateConfig} />
        )}
        {step === "goal" && (
          <GoalStep config={config} onChange={updateConfig} />
        )}
        {step === "simulate" && (
          <SimulateStep config={config} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Welcome                                                           */
/* ------------------------------------------------------------------ */

function WelcomeStep({ onReset, hasDraft }: { onReset: () => void; hasDraft: boolean }) {
  return (
    <div className="flex flex-col" style={{ gap: 20 }}>
      <div>
        <SectionLabel>Guided fit · 5 steps</SectionLabel>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            margin: "10px 0 8px",
            lineHeight: 1.15,
          }}
        >
          Set your bike fit step by step.
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--color-text-secondary)",
            maxWidth: 560,
          }}
        >
          Measure your body, enter your current saddle and crank, pick a
          riding goal. The simulator renders your rider in real time and
          the optimizer proposes a fit you can apply, or not.
        </p>
      </div>

      <ol
        className="flex flex-col"
        style={{
          gap: 8,
          paddingLeft: 22,
          fontSize: 13,
          color: "var(--color-text-secondary)",
          lineHeight: 1.6,
        }}
      >
        <li>Measure anatomy — height, femur, tibia, foot, mass, fast-twitch fraction.</li>
        <li>Enter your current fit — crank length, saddle height, saddle setback.</li>
        <li>Pick a riding discipline and a target speed, grade, and cadence.</li>
        <li>Tune in the simulator and run the optimizer for a proposed fit.</li>
      </ol>

      <div className="flex items-center" style={{ gap: 12, marginTop: 8 }}>
        <Link href="/diy/anatomy" data-testid="diy-welcome-start" style={{ textDecoration: "none" }}>
          <Button variant="primary" size="lg" type="button">
            Start guided fit
          </Button>
        </Link>
        {hasDraft && (
          <button
            type="button"
            onClick={onReset}
            data-testid="diy-welcome-reset"
            className="cursor-pointer"
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              background: "transparent",
              border: "none",
              padding: "6px 8px",
            }}
          >
            Reset draft
          </button>
        )}
      </div>

      <Explainer title="What you will leave with">
        A saved draft on this device, a recommendation from the optimizer,
        and a share URL that encodes the configuration in 2 KB or less.
      </Explainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step bodies                                                       */
/* ------------------------------------------------------------------ */

function AnatomyStep({
  config,
  onChange,
}: {
  config: Config;
  onChange: (patch: Partial<Config>) => void;
}) {
  // Required fields are bounded by the slider ranges, so a default config
  // is always valid; canAdvance is true as soon as the form renders.
  const canAdvance = anatomyValid(config);
  return (
    <StepShell
      step="anatomy"
      title="Measure your body"
      lede="Six measurements drive the rider. Use a tape measure against a wall for height and inseam-derived saddle math."
      canAdvance={canAdvance}
    >
      <AnatomyForm config={config} onChange={onChange} />
    </StepShell>
  );
}

function CurrentFitStep({
  config,
  onChange,
}: {
  config: Config;
  onChange: (patch: Partial<Config>) => void;
}) {
  const canAdvance = currentFitValid(config);
  return (
    <StepShell
      step="current-fit"
      title="Tell us your current fit"
      lede="Crank length, saddle height, and saddle setback. These are the inputs the optimizer searches around."
      canAdvance={canAdvance}
    >
      <CurrentFitForm config={config} onChange={onChange} />
    </StepShell>
  );
}

function GoalStep({
  config,
  onChange,
}: {
  config: Config;
  onChange: (patch: Partial<Config>) => void;
}) {
  const canAdvance = goalValid(config);
  return (
    <StepShell
      step="goal"
      title="Pick a riding goal"
      lede="Different disciplines favour different cadences, pedal modes, and bar drops. Pick one — fine-tune below."
      canAdvance={canAdvance}
      nextLabel="Open simulator"
    >
      <GoalPicker config={config} onChange={onChange} />
    </StepShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Simulate (final step)                                             */
/* ------------------------------------------------------------------ */

function SimulateStep({ config }: { config: Config }) {
  const metrics = useMemo(() => evaluate(config), [config]);

  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");

  const handleShare = useCallback(async () => {
    try {
      const token = encodeConfig(config);
      const origin = typeof window !== "undefined" ? window.location.origin : "https://pedalwise.app";
      const url = `${origin}/diy/share?c=${token}`;
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareState("copied");
        window.setTimeout(() => setShareState("idle"), 2400);
      } else {
        setShareState("error");
      }
    } catch {
      setShareState("error");
      window.setTimeout(() => setShareState("idle"), 2400);
    }
  }, [config]);

  const kneeStatus: "success" | "warn" =
    metrics.kneeAtBDC >= 25 && metrics.kneeAtBDC <= 45 ? "success" : "warn";

  return (
    <StepShell
      step="simulate"
      title="Tune and save"
      lede="Your draft is below. The simulator runs the same kinematic model the fitter and engineer workspaces use. Share the configuration, or apply the optimizer's recommendation from the right rail."
      canAdvance
      footer={null}
    >
      <Card padding={20}>
        <div className="flex items-baseline justify-between" style={{ marginBottom: 12 }}>
          <SectionLabel>Your draft configuration</SectionLabel>
          <span className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            {config.discipline} · {config.targetSpeed.toFixed(0)} km/h ·{" "}
            {config.roadGrade === 0 ? "flat" : `${config.roadGrade > 0 ? "+" : ""}${config.roadGrade}%`}
          </span>
        </div>
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}
        >
          <StatCard
            label="Crank length"
            value={`${config.crankLength.toFixed(1)} mm`}
          />
          <StatCard
            label="Saddle height"
            value={`${config.saddleHeight.toFixed(1)} cm`}
          />
          <StatCard
            label="Setback"
            value={`${config.saddleSetback.toFixed(1)} cm`}
          />
          <StatCard
            label="Cadence"
            value={`${config.cadence} rpm`}
            note={`opt ${metrics.optimumCadence.toFixed(0)}`}
          />
          <StatCard
            label="Knee at BDC"
            value={`${metrics.kneeAtBDC.toFixed(0)}°`}
            status={kneeStatus}
            note={kneeStatus === "success" ? "in Holmes range" : "out of Holmes range"}
          />
          <StatCard
            label="Gross efficiency"
            value={`${(metrics.grossEfficiency * 100).toFixed(1)}%`}
          />
          <StatCard label="Power" value={`${metrics.power.toFixed(0)} W`} />
          <StatCard label="Speed" value={`${metrics.speed.toFixed(0)} km/h`} />
        </div>

        <div
          className="flex items-center justify-between"
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--color-border-default)",
            gap: 12,
          }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={handleShare}
              data-testid="diy-share-button"
            >
              {shareState === "copied" ? "Link copied" :
               shareState === "error" ? "Copy failed" :
               "Copy share link"}
            </Button>
            <Link
              href="/diy/welcome"
              data-testid="diy-restart-link"
              style={{
                fontSize: 12,
                color: "var(--color-text-secondary)",
                textDecoration: "none",
              }}
            >
              Restart guided fit
            </Link>
          </div>
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}
          >
            Share encodes a 2 KB token. Reopen at /diy/share?c=…
          </span>
        </div>
      </Card>

      <Explainer title="What the simulator shows next">
        The full workspace renders below. Press Find optimal fit on the
        right rail to run the optimizer — it returns a proposed fit as a
        ghost overlay. Apply it explicitly, or dismiss it.
      </Explainer>

      <div
        style={{
          borderRadius: 10,
          border: "1px solid var(--color-border-default)",
          overflow: "hidden",
        }}
      >
        <SimulatorWorkspace persona="diy" />
      </div>
    </StepShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Validity guards                                                   */
/* ------------------------------------------------------------------ */

function anatomyValid(c: Config): boolean {
  return (
    c.height > 0 &&
    c.femur > 0 &&
    c.tibia > 0 &&
    c.foot > 0 &&
    c.mass > 0 &&
    c.fastTwitchPct > 0
  );
}

function currentFitValid(c: Config): boolean {
  return c.crankLength > 0 && c.saddleHeight > 0 && c.saddleSetback >= 0;
}

function goalValid(c: Config): boolean {
  return (
    c.discipline !== undefined &&
    c.targetSpeed > 0 &&
    c.cadence > 0
  );
}

