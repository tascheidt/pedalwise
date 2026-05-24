"use client";

import type { KeyboardEvent, ReactNode } from "react";

import { Badge } from "@/components/Badge";
import { SectionLabel } from "@/components/SectionLabel";
import { Button } from "@/components/Button";

export type PersonaCardProps = {
  /** Persona id — used for the test id and the click handler. */
  id: "diy" | "fitter" | "engineer";
  /** Short audience tag shown above the title (e.g. "DIY cyclist"). */
  tag: string;
  /** Card title. */
  title: string;
  /** One-line role description, ≤ 22 words. */
  blurb: string;
  /** Two or three "what you get" bullet items. */
  bullets: readonly string[];
  /** Imperative CTA label (e.g. "Open the studio"). */
  cta: string;
  /** Small SVG mark rendered top-right inside the card body. No emoji. */
  icon: ReactNode;
  /** When true, paints the accent border + "Recommended" badge. */
  recommended?: boolean;
  /** Click anywhere on the card → set persona + redirect. */
  onPick: (id: "diy" | "fitter" | "engineer") => void;
};

/**
 * Persona-picker card. Click anywhere on the card (or press Enter / Space
 * when focused) invokes `onPick(id)`. The whole card is the affordance —
 * the CTA button is a visual cue, not a separate target.
 *
 * Uses only existing tokens / primitives (Badge, SectionLabel, Button).
 */
export function PersonaCard({
  id,
  tag,
  title,
  blurb,
  bullets,
  cta,
  icon,
  recommended = false,
  onPick,
}: PersonaCardProps) {
  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPick(id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${title}. ${blurb}`}
      data-testid={`persona-card-${id}`}
      onClick={() => onPick(id)}
      onKeyDown={handleKey}
      className="rounded-[10px] flex flex-col cursor-pointer focus:outline-none"
      style={{
        background: "var(--color-bg-surface)",
        border: recommended
          ? "1px solid var(--color-accent)"
          : "1px solid var(--color-border-default)",
        boxShadow: recommended
          ? "0 0 0 2px var(--color-accent-light)"
          : "none",
        padding: 20,
        gap: 12,
        position: "relative",
        transition: "border-color 120ms ease-out, transform 120ms ease-out",
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-accent-light)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = recommended
          ? "0 0 0 2px var(--color-accent-light)"
          : "none";
      }}
    >
      {/* Header row: tag + icon + (optional) Recommended badge */}
      <div className="flex items-start justify-between">
        <SectionLabel>{tag}</SectionLabel>
        <div
          aria-hidden
          style={{
            width: 28,
            height: 28,
            color: "var(--color-accent)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>

      {/* Title */}
      <div className="flex items-baseline justify-between gap-2">
        <h3
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h3>
        {recommended && <Badge tone="info">Recommended</Badge>}
      </div>

      {/* Blurb */}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--color-text-secondary)",
        }}
      >
        {blurb}
      </p>

      {/* Bullets */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {bullets.map((b) => (
          <li
            key={b}
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              lineHeight: 1.4,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2.5"
              aria-hidden
              style={{ flexShrink: 0, marginTop: 3 }}
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {/* CTA — visual; full card is the click target. */}
      <div className="flex justify-end" style={{ marginTop: 4 }}>
        <Button
          variant={recommended ? "primary" : "secondary"}
          size="sm"
          tabIndex={-1}
          onClick={(e) => {
            // The card itself handles the click; stop the button from
            // double-firing onPick via event bubbling.
            e.stopPropagation();
            onPick(id);
          }}
          data-testid={`persona-card-${id}-cta`}
        >
          {cta}
        </Button>
      </div>
    </div>
  );
}
