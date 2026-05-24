"use client";

import Link from "next/link";

import { SectionLabel } from "@/components/SectionLabel";
import { DIY_STEPS, type DiyStep, stepIndex } from "./useDiyDraft";

type StepMeta = {
  slug: DiyStep;
  n: number;
  title: string;
  time: string;
};

/** Title + estimated time per step. Matches diy.jsx artboard 03A. The
 *  welcome step is the intro and is not rendered as a numbered row. */
const META: Record<DiyStep, StepMeta> = {
  welcome:       { slug: "welcome",     n: 0, title: "Welcome",                  time: "1 min" },
  anatomy:       { slug: "anatomy",     n: 1, title: "Measure your body",        time: "3 min" },
  "current-fit": { slug: "current-fit", n: 2, title: "Tell us your current fit", time: "2 min" },
  goal:          { slug: "goal",        n: 3, title: "Pick a riding goal",       time: "1 min" },
  simulate:      { slug: "simulate",    n: 4, title: "Tune and save",            time: "2 min" },
};

const RAIL_STEPS: StepMeta[] = [
  { slug: "anatomy",     n: 1, title: "Measure your body",         time: "3 min" },
  { slug: "current-fit", n: 2, title: "Tell us your current fit",  time: "2 min" },
  { slug: "goal",        n: 3, title: "Pick a riding goal",        time: "1 min" },
  { slug: "simulate",    n: 4, title: "Tune and save",             time: "2 min" },
];

export type StepRailProps = {
  current: DiyStep;
  furthest: DiyStep;
};

/**
 * Left-rail navigation for steps 2–5 of the DIY flow (PW-102).
 *
 * - Completed steps (index < current) are linkable.
 * - The current step is highlighted with `aria-current="step"`.
 * - Steps the user has not yet reached (index > furthest) are disabled.
 */
export function StepRail({ current, furthest }: StepRailProps) {
  const currentIdx = stepIndex(current);
  const furthestIdx = stepIndex(furthest);

  return (
    <nav
      aria-label="Guided fit progress"
      data-testid="diy-step-rail"
      className="flex flex-col"
      style={{
        background: "var(--color-bg-surface)",
        borderRight: "1px solid var(--color-border-default)",
        padding: "20px 18px",
        gap: 6,
        minHeight: "100%",
      }}
    >
      <SectionLabel>Setup progress</SectionLabel>
      <div className="flex flex-col" style={{ gap: 4, marginTop: 12 }}>
        {RAIL_STEPS.map((s) => {
          const idx = stepIndex(s.slug);
          const state: "done" | "current" | "todo" =
            idx < currentIdx ? "done"
            : idx === currentIdx ? "current"
            : "todo";
          const reachable = idx <= furthestIdx;
          return (
            <StepRailRow
              key={s.slug}
              step={s}
              state={state}
              reachable={reachable}
            />
          );
        })}
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: "14px 14px",
          background: "var(--color-bg-alt)",
          borderRadius: 10,
          fontSize: 12,
          color: "var(--color-text-secondary)",
          lineHeight: 1.55,
        }}
      >
        <strong style={{ fontWeight: 600, display: "block", marginBottom: 4, color: "var(--color-text-primary)" }}>
          Tip
        </strong>
        Measure your inseam against a wall with a book between your legs. Saddle-height suggestions anchor to that.
      </div>
    </nav>
  );
}

function StepRailRow({
  step,
  state,
  reachable,
}: {
  step: StepMeta;
  state: "done" | "current" | "todo";
  reachable: boolean;
}) {
  const isCurrent = state === "current";
  const isDone = state === "done";

  const body = (
    <div
      data-testid={`diy-step-rail-row-${step.slug}`}
      aria-current={isCurrent ? "step" : undefined}
      className="flex items-start gap-3 rounded-md"
      style={{
        padding: "10px 12px",
        background: isCurrent ? "var(--color-accent-light)" : "transparent",
        border: isCurrent ? "1px solid var(--color-accent)" : "1px solid transparent",
        opacity: reachable ? 1 : 0.55,
      }}
    >
      <span
        aria-hidden
        className="flex items-center justify-center"
        style={{
          width: 24,
          height: 24,
          borderRadius: 9999,
          flexShrink: 0,
          background: isDone ? "var(--color-success)"
                  : isCurrent ? "var(--color-accent)"
                  : "var(--color-bg-surface)",
          border: !isDone && !isCurrent ? "1.5px solid var(--color-border-strong)" : "none",
          color: isDone || isCurrent ? "white" : "var(--color-text-tertiary)",
          fontSize: 12,
          fontWeight: 600,
          marginTop: 1,
        }}
      >
        {isDone ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          step.n
        )}
      </span>
      <span className="flex flex-col" style={{ minWidth: 0 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: isCurrent ? 600 : 500,
            color: !reachable ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
            lineHeight: 1.3,
          }}
        >
          {step.title}
        </span>
        <span
          className="mono"
          style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2 }}
        >
          {step.time}
        </span>
      </span>
    </div>
  );

  if (!reachable || isCurrent) {
    return (
      <span
        data-testid={`diy-step-rail-link-${step.slug}-disabled`}
        aria-disabled={!reachable ? true : undefined}
      >
        {body}
      </span>
    );
  }

  return (
    <Link
      href={`/diy/${step.slug}`}
      data-testid={`diy-step-rail-link-${step.slug}`}
      style={{ textDecoration: "none" }}
    >
      {body}
    </Link>
  );
}

// Re-export META for any consumer that wants step titles outside the rail.
export const DIY_STEP_META = META;
export { DIY_STEPS };
