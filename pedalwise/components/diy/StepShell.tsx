"use client";

import Link from "next/link";

import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";

import { DIY_STEPS, type DiyStep, stepIndex } from "./useDiyDraft";

export type StepShellProps = {
  step: DiyStep;
  title: string;
  /** Short intro paragraph under the title. */
  lede?: string;
  /** Whether the Next button is enabled. */
  canAdvance: boolean;
  /** Override label for the Next button (e.g. "Open simulator"). */
  nextLabel?: string;
  /** Override the Next href. Defaults to the next step's slug. */
  nextHref?: string;
  /** Called on Next click before navigation. Use to persist any pending state. */
  onNext?: () => void;
  /** Children render the body of the step (forms, pickers, simulator). */
  children: React.ReactNode;
  /** Optional footer slot (replaces the default next/back chrome when set). */
  footer?: React.ReactNode;
};

/**
 * Common chrome for DIY steps 2–5 (PW-102). The welcome step renders
 * its own shell because its CTA is centred and the rail is hidden.
 */
export function StepShell({
  step,
  title,
  lede,
  canAdvance,
  nextLabel,
  nextHref,
  onNext,
  children,
  footer,
}: StepShellProps) {
  const idx = stepIndex(step);
  const prevSlug: DiyStep | null = idx > 0 ? DIY_STEPS[idx - 1] : null;
  const nextSlug: DiyStep | null = idx < DIY_STEPS.length - 1 ? DIY_STEPS[idx + 1] : null;
  const stepNumber = idx; // 1..4 for anatomy..simulate; welcome is 0
  const totalSteps = DIY_STEPS.length - 1; // exclude welcome

  return (
    <div
      className="flex flex-col"
      style={{
        padding: "32px 40px",
        gap: 20,
        overflowY: "auto",
        minHeight: "100%",
      }}
    >
      <header>
        <SectionLabel>Step {stepNumber} of {totalSteps}</SectionLabel>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            margin: "8px 0 6px",
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h1>
        {lede && (
          <p
            style={{
              fontSize: 14,
              color: "var(--color-text-secondary)",
              margin: 0,
              lineHeight: 1.55,
              maxWidth: 640,
            }}
          >
            {lede}
          </p>
        )}
      </header>

      <div className="flex flex-col" style={{ gap: 16 }}>
        {children}
      </div>

      {footer !== undefined ? footer : (
        <div
          className="flex items-center justify-between"
          style={{
            paddingTop: 8,
            marginTop: 8,
            borderTop: "1px solid var(--color-border-default)",
          }}
        >
          {prevSlug ? (
            <Link
              href={`/diy/${prevSlug}`}
              data-testid="diy-back-button"
              style={{ textDecoration: "none" }}
            >
              <Button variant="ghost" size="md" type="button">
                <ArrowLeft />
                Back
              </Button>
            </Link>
          ) : <span />}

          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
            Your draft saves as you go.
          </span>

          {nextSlug ? (
            nextHref ? (
              <Link
                href={canAdvance ? nextHref : "#"}
                data-testid="diy-next-button"
                aria-disabled={!canAdvance}
                style={{
                  textDecoration: "none",
                  pointerEvents: canAdvance ? "auto" : "none",
                }}
                onClick={(e) => {
                  if (!canAdvance) { e.preventDefault(); return; }
                  if (onNext) onNext();
                }}
              >
                <Button variant="primary" size="md" type="button" disabled={!canAdvance}>
                  {nextLabel ?? "Continue"}
                  <ArrowRight />
                </Button>
              </Link>
            ) : (
              <Link
                href={canAdvance ? `/diy/${nextSlug}` : "#"}
                data-testid="diy-next-button"
                aria-disabled={!canAdvance}
                style={{
                  textDecoration: "none",
                  pointerEvents: canAdvance ? "auto" : "none",
                }}
                onClick={(e) => {
                  if (!canAdvance) { e.preventDefault(); return; }
                  if (onNext) onNext();
                }}
              >
                <Button variant="primary" size="md" type="button" disabled={!canAdvance}>
                  {nextLabel ?? "Continue"}
                  <ArrowRight />
                </Button>
              </Link>
            )
          ) : <span />}
        </div>
      )}
    </div>
  );
}

function ArrowLeft() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
