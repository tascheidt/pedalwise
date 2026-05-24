"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { setWorkspace, clearWorkspace, type Workspace } from "@/lib/storage";

const LABEL: Record<Workspace, string> = {
  diy: "DIY cyclist",
  fitter: "Bike fitter",
  engineer: "Engineer",
};

const ROUTE: Record<Workspace, string> = {
  diy: "/diy",
  fitter: "/fitter",
  engineer: "/engineer",
};

export type PersonaSwitcherProps = {
  /** Currently-active persona, displayed on the chip. */
  persona: Workspace;
};

/**
 * Small chip in the workspace top-bar. Shows the active persona; clicking
 * opens a menu with the other personas plus a "Back to picker" link.
 *
 * Writes through `setWorkspace` / `clearWorkspace` from `lib/storage` so the
 * persisted choice stays the source of truth (PW-101).
 */
export function PersonaSwitcher({ persona }: PersonaSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(next: Workspace) {
    setWorkspace(next);
    setOpen(false);
    router.push(ROUTE[next]);
  }

  function backToPicker() {
    clearWorkspace();
    setOpen(false);
    router.push("/");
  }

  const others = (Object.keys(LABEL) as Workspace[]).filter((w) => w !== persona);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Workspace: ${LABEL[persona]}. Switch workspace.`}
        data-testid="persona-switcher"
        className="inline-flex items-center gap-2 rounded-full cursor-pointer"
        style={{
          height: 28,
          padding: "0 10px 0 8px",
          background: "var(--color-bg-alt)",
          border: "1px solid var(--color-border-default)",
          fontSize: 12,
          color: "var(--color-text-secondary)",
          fontWeight: 500,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "var(--color-accent)",
            display: "inline-block",
          }}
        />
        <span>{LABEL[persona]}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Switch workspace"
          data-testid="persona-switcher-menu"
          className="absolute left-0 mt-2 rounded-md"
          style={{
            top: "100%",
            minWidth: 200,
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-default)",
            boxShadow: "0 6px 24px -8px rgba(0, 0, 0, 0.18)",
            zIndex: 50,
            padding: 4,
          }}
        >
          <div
            className="section-label"
            style={{ padding: "8px 10px 4px" }}
          >
            Switch to
          </div>
          {others.map((w) => (
            <button
              key={w}
              role="menuitem"
              type="button"
              onClick={() => switchTo(w)}
              data-testid={`persona-switcher-option-${w}`}
              className="w-full text-left rounded-sm cursor-pointer"
              style={{
                padding: "6px 10px",
                fontSize: 13,
                color: "var(--color-text-primary)",
                background: "transparent",
                border: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-bg-alt)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {LABEL[w]}
            </button>
          ))}
          <div
            style={{
              height: 1,
              background: "var(--color-border-default)",
              margin: "4px 0",
            }}
          />
          <button
            role="menuitem"
            type="button"
            onClick={backToPicker}
            data-testid="persona-switcher-back-to-picker"
            className="w-full text-left rounded-sm cursor-pointer"
            style={{
              padding: "6px 10px",
              fontSize: 12,
              color: "var(--color-text-secondary)",
              background: "transparent",
              border: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-bg-alt)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Back to picker
          </button>
        </div>
      )}
    </div>
  );
}
