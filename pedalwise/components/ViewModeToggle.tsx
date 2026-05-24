"use client";

import type { ViewMode } from "@/lib/types";

const MODES: { id: ViewMode; label: string }[] = [
  { id: "anatomical", label: "Anatomical" },
  { id: "realistic",  label: "Realistic"  },
  { id: "diagnostic", label: "Diagnostic" },
];

export function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div
      className="inline-flex rounded-md p-1"
      style={{ background: "var(--color-bg-alt)", height: 32 }}
      role="tablist"
      aria-label="View mode"
    >
      {MODES.map((m) => {
        const active = m.id === value;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.id)}
            className="rounded-md px-3 mono cursor-pointer"
            style={{
              fontSize: 12,
              fontWeight: 500,
              background: active ? "var(--color-bg-surface)" : "transparent",
              color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,.06)" : "none",
              transition: "background-color 200ms ease-out, color 200ms ease-out",
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
