"use client";

import { ClientRoster } from "@/components/fitter/ClientRoster";
import { PersonaSwitcher } from "@/components/workspace/PersonaSwitcher";

/**
 * Fitter workspace root (PW-103).
 *
 * Replaces V7's simulator placeholder with the ClientRoster. Opening a client
 * navigates to `/fitter/{clientId}` where the per-client session studio
 * (SimulatorWorkspace + SessionList) lives.
 *
 * Client-only because the roster is read from LocalStorage on mount.
 */
export default function FitterWorkspacePage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-bg-app)" }}
    >
      <FitterHeader />
      <ClientRoster />
    </div>
  );
}

function FitterHeader() {
  return (
    <header
      className="flex items-center justify-between"
      style={{
        padding: "12px 24px",
        borderBottom: "1px solid var(--color-border-default)",
        background: "var(--color-bg-surface)",
      }}
    >
      <div className="flex items-center gap-3">
        <PersonaSwitcher persona="fitter" />
        <div className="flex items-baseline gap-2">
          <div style={{ fontSize: 18, fontWeight: 500 }}>Pedalwise</div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            Bike-fit simulator
          </div>
        </div>
      </div>
    </header>
  );
}
