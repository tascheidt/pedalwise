"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PersonaCard } from "@/components/picker/PersonaCard";
import { setWorkspace, getWorkspace, type Workspace } from "@/lib/storage";

const ROUTE: Record<Workspace, string> = {
  diy: "/diy",
  fitter: "/fitter",
  engineer: "/engineer",
};

/**
 * Persona picker — the root entry point (`/`).
 *
 * Per PW-101:
 *   - On mount, read the persisted `pedalwise.workspace` key via
 *     `getWorkspace()`. If set, `router.replace()` to the matching workspace
 *     so a returning user lands in their saved chrome.
 *   - Otherwise show three PersonaCards (DIY, Fitter, Engineer). Clicking a
 *     card writes the choice through `setWorkspace()` and pushes to the
 *     persona route. (The Fitter card carries the Recommended badge per the
 *     thesis ordering — fitters are the primary audience.)
 *
 * Storage is LocalStorage — must run client-side, hence `"use client"`.
 */
export default function PickerPage() {
  const router = useRouter();
  // `null` = pre-mount; `"none"` = no saved persona, show the picker.
  const [resolved, setResolved] = useState<Workspace | "none" | null>(null);

  useEffect(() => {
    const saved = getWorkspace();
    if (saved) {
      router.replace(ROUTE[saved]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResolved(saved);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResolved("none");
    }
  }, [router]);

  function pick(id: Workspace) {
    setWorkspace(id);
    router.push(ROUTE[id]);
  }

  // While we don't know yet (SSR or pre-effect) we render the picker shell so
  // there's no hydration mismatch. The redirect from the effect will replace
  // the page before the user sees the cards if a persona was saved.
  const showCards = resolved !== null
    ? resolved === "none"
    : true;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-app)" }}>
      {/* Top bar — minimal, no app chrome */}
      <header
        className="flex items-center justify-between px-6 py-3"
        style={{
          borderBottom: "1px solid var(--color-border-default)",
          background: "var(--color-bg-surface)",
        }}
      >
        <div className="flex items-baseline gap-2">
          <div style={{ fontSize: 18, fontWeight: 500 }}>Pedalwise</div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            Sagittal-plane bike-fit simulator
          </div>
        </div>
      </header>

      {/* Hero + cards */}
      <main
        className="flex-1 mx-auto w-full"
        style={{ maxWidth: 1200, padding: "48px 24px 32px" }}
        data-testid="persona-picker"
      >
        <div style={{ marginBottom: 32, maxWidth: 640 }}>
          <div className="section-label" style={{ marginBottom: 12 }}>
            Pick your workspace
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
              color: "var(--color-text-primary)",
            }}
          >
            Same simulator. Three workspaces tuned for the way DIY cyclists,
            fitters, and engineers work.
          </h1>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--color-text-secondary)",
            }}
          >
            One kinematic model underneath. The chrome, the controls, and the
            level of math on screen change with the door you walk through. Your
            choice becomes the default on this device — switch any time from
            the workspace chip.
          </p>
        </div>

        {showCards && (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            <PersonaCard
              id="diy"
              tag="DIY cyclist"
              title="DIY guided fit"
              blurb="Set your fit step by step. Saddle, crank, cadence — one decision at a time."
              bullets={[
                "Guided measurement and goal setup",
                "Plain-English explainer per metric",
                "Save and share a fit profile",
              ]}
              cta="Start guided fit"
              icon={<IconBike />}
              onPick={pick}
            />
            <PersonaCard
              id="fitter"
              tag="Bike fitter"
              title="Fitter studio"
              blurb="Open a client. Run a session. Compare current and proposed side by side."
              bullets={[
                "Client roster with session history",
                "Before / after compare in one view",
                "Printable bike-fit handoff report",
              ]}
              cta="Open the studio"
              icon={<IconClipboard />}
              recommended
              onPick={pick}
            />
            <PersonaCard
              id="engineer"
              tag="Engineer or researcher"
              title="Engineer workbench"
              blurb="Sweep a parameter. Inspect the equations. Export the frame stream."
              bullets={[
                "Parameter sweeps and batch runs",
                "Visible equations and assumptions",
                "CSV and JSON frame export",
              ]}
              cta="Open the workbench"
              icon={<IconGraph />}
              onPick={pick}
            />
          </div>
        )}
      </main>

      <footer
        className="text-center"
        style={{
          padding: "16px 24px 24px",
          fontSize: 11,
          color: "var(--color-text-tertiary)",
        }}
      >
        Pedalwise · v1.1 · sagittal-plane bike-fit simulator
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icons — no emoji per design principle 9.               */
/* ------------------------------------------------------------------ */

function IconBike() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="6" cy="17" r="4" />
      <circle cx="18" cy="17" r="4" />
      <path d="M6 17l4-7h6l-3-5" />
      <path d="M12 6l6 11" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function IconGraph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 20V4M4 20h16" />
      <path d="M4 16l5-6 4 3 7-9" />
    </svg>
  );
}
