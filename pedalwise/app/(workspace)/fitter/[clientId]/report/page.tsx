"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import type { Client, Session } from "@/lib/types";
import { getClient, listSessionsForClient } from "@/lib/storage";

import { BikeFitReport } from "@/components/report/BikeFitReport";
import { SectionLabel } from "@/components/SectionLabel";

/**
 * Bike-fit report page (PW-103).
 *
 * Reads `?session={sessionId}` to choose the session being reported. Falls
 * back to the most-recent session for the client. Client-only because the
 * data lives in LocalStorage.
 *
 * Next.js 16: `params` and `searchParams` are Promises in client components;
 * unwrap with React's `use()` hook.
 */
export default function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId } = use(params);
  const search = use(searchParams);
  const sessionParam = search?.session;
  const sessionId = Array.isArray(sessionParam) ? sessionParam[0] : sessionParam;

  const [hydrated, setHydrated] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [fitterName, setFitterName] = useState("");

  // LocalStorage hydration on mount; SSR renders the loading shell.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const c = getClient(clientId);
    setClient(c);
    if (c) {
      const list = listSessionsForClient(clientId);
      const chosen = sessionId
        ? (list.find((s) => s.id === sessionId) ?? list[0] ?? null)
        : (list[0] ?? null);
      setSession(chosen);
    }
    // Read previously-typed fitter name (no PII persisted by default — opt-in).
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("pedalwise.fitterName")
        : null;
    if (saved) setFitterName(saved);
    setHydrated(true);
  }, [clientId, sessionId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!hydrated) {
    return (
      <Shell>
        <SectionLabel>Loading</SectionLabel>
      </Shell>
    );
  }
  if (!client || !session) {
    return (
      <Shell>
        <SectionLabel>Not found</SectionLabel>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            margin: "8px 0 6px",
            color: "var(--color-text-primary)",
          }}
        >
          {client ? "No session selected." : "Client not found in this browser."}
        </h1>
        <div style={{ marginTop: 16 }}>
          <Link
            href={client ? `/fitter/${client.id}` : "/fitter"}
            style={{
              color: "var(--color-accent)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {client ? "Back to studio" : "Back to roster"}
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <div>
      {/* On-screen-only toolbar above the paper: lets the fitter type a name
          to brand the report. Persisted across reports via LocalStorage. */}
      <div
        className="no-print"
        style={{
          background: "var(--color-bg-surface)",
          borderBottom: "1px solid var(--color-border-default)",
          padding: "12px 24px",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between gap-4"
          style={{ maxWidth: 768 }}
        >
          <Link
            href={`/fitter/${client.id}`}
            style={{
              color: "var(--color-text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
            data-testid="back-to-studio"
          >
            ← Back to studio
          </Link>
          <label
            className="flex items-center gap-2"
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <span
              className="section-label"
              style={{ whiteSpace: "nowrap" }}
            >
              Fitter name
            </span>
            <input
              type="text"
              value={fitterName}
              onChange={(e) => {
                const v = e.target.value;
                setFitterName(v);
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("pedalwise.fitterName", v);
                }
              }}
              placeholder="e.g. Cascade Bike Studio"
              maxLength={60}
              data-testid="fitter-name-input"
              className="rounded-md px-3 py-1"
              style={{
                background: "var(--color-bg-app)",
                border: "1px solid var(--color-border-default)",
                color: "var(--color-text-primary)",
                fontSize: 13,
                width: 240,
              }}
            />
          </label>
        </div>
      </div>

      <BikeFitReport client={client} session={session} fitterName={fitterName} />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="mx-auto"
      style={{ maxWidth: 600, padding: "40px 24px" }}
    >
      {children}
    </main>
  );
}
