"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { Client, Config, Session } from "@/lib/types";
import { DEFAULT_CONFIG } from "@/lib/presets";
import { evaluate } from "@/lib/kinematics";
import { useOptimizer } from "@/lib/useOptimizer";
import {
  applySessionRecommendation,
  createSession,
  getClient,
  listSessionsForClient,
} from "@/lib/storage";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";
import { PersonaSwitcher } from "@/components/workspace/PersonaSwitcher";
import { Simulator } from "@/components/Simulator";
import { ControlsRail } from "@/components/ControlsRail";
import { HudStrip } from "@/components/HudStrip";
import { RecommendationCard } from "@/components/RecommendationPanel";

import { SessionList } from "@/components/fitter/SessionList";
import { SessionCompare } from "@/components/fitter/SessionCompare";

/**
 * Per-client studio (PW-103).
 *
 * Layout:
 *   - Top: breadcrumb (Clients › {client.name}), persona switcher, Compare +
 *     Generate report buttons.
 *   - Left rail: SessionList — pick or create a session.
 *   - Center: Simulator + ControlsRail bound to the active session's config.
 *     Optimizer runs against that config; clicking Apply writes back to the
 *     session via `applySessionRecommendation` (the explicit dialogue from
 *     principle #5 carries through to the session model).
 *
 * Next.js 16: dynamic-segment `params` is a Promise; unwrap with React's
 * `use()` hook in a client component.
 */
export default function ClientSessionStudioPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const router = useRouter();

  // Hydration / data
  const [hydrated, setHydrated] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Per-session config working copy (mutated by sliders; persisted only on Apply).
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [crankAngle, setCrankAngle] = useState(Math.PI / 4);

  // Optimizer + compare modal
  const { state: optState, run: runOptimize, clear: clearOpt } = useOptimizer();
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedGearIndex, setSelectedGearIndex] = useState(0);

  // Reset gear selection on every fresh recommendation so the user always
  // starts on the optimizer's best pick.
  useEffect(() => {
    if (optState.kind === "done") setSelectedGearIndex(0);
  }, [optState]);

  const refreshSessions = useCallback(() => {
    const list = listSessionsForClient(clientId);
    setSessions(list);
    return list;
  }, [clientId]);

  // Initial hydration: load client + sessions, auto-create a first session if none.
  // LocalStorage is read here intentionally — SSR returns null and the
  // post-mount sync flips the UI into the hydrated state.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const c = getClient(clientId);
    setClient(c);
    if (!c) {
      setHydrated(true);
      return;
    }
    const list = listSessionsForClient(clientId);
    setSessions(list);
    if (list.length > 0) {
      const first = list[0];
      setActiveSessionId(first.id);
      setConfig(first.config);
    }
    setHydrated(true);
  }, [clientId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Animate the crank for the Simulator (matches SimulatorWorkspace pattern).
  useEffect(() => {
    let raf = 0;
    let last: number | null = null;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function step(t: number) {
      const dt = last == null ? 0 : Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!reduced) {
        const omega = (config.cadence * 2 * Math.PI) / 60;
        setCrankAngle((a) => (a + omega * dt) % (Math.PI * 2));
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [config.cadence]);

  const metrics = useMemo(() => evaluate(config), [config]);

  const handleNewSession = useCallback(() => {
    // Seed from the active config so the fitter can branch from "where I am".
    const seed = activeSessionId ? config : DEFAULT_CONFIG;
    const s = createSession(clientId, seed);
    const list = refreshSessions();
    setActiveSessionId(s.id);
    setConfig(s.config);
    clearOpt();
    // Silence unused-list warning
    void list;
  }, [activeSessionId, config, clientId, refreshSessions, clearOpt]);

  const handleSelectSession = useCallback(
    (id: string) => {
      const s = sessions.find((x) => x.id === id);
      if (!s) return;
      setActiveSessionId(id);
      setConfig(s.config);
      clearOpt();
    },
    [sessions, clearOpt],
  );

  const handleConfigChange = useCallback(
    (patch: Partial<Config>) => {
      setConfig((c) => ({ ...c, ...patch }));
      if (optState.kind === "done") clearOpt();
    },
    [optState.kind, clearOpt],
  );

  const handleApply = useCallback(() => {
    if (optState.kind !== "done" || !activeSessionId) return;
    const rec = optState.rec;
    // Commit the cadence dictated by the user's selected gear at the target
    // speed, not the optimizer's unconstrained continuous cadence — keeps
    // Apply consistent with the preview the user just inspected.
    const gear = rec.gears[selectedGearIndex] ?? rec.gears[0];
    const cadence = Math.round(gear.cadenceAtTarget);
    setConfig((c) => ({
      ...c,
      saddleHeight: rec.fit.saddleHeight,
      crankLength: rec.fit.crankLength,
      saddleSetback: rec.fit.saddleSetback,
      cadence,
    }));
    // Persist the applied recommendation onto the session — the explicit
    // dialogue from principle #5 carries through to the session model.
    applySessionRecommendation(activeSessionId, {
      fit: {
        crankLength: rec.fit.crankLength,
        saddleHeight: rec.fit.saddleHeight,
        saddleSetback: rec.fit.saddleSetback,
      },
      goalCadence: cadence,
      metrics: rec.metrics,
      at: Date.now(),
    });
    refreshSessions();
    clearOpt();
  }, [optState, selectedGearIndex, activeSessionId, refreshSessions, clearOpt]);

  // Loading / not-found
  if (!hydrated) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "var(--color-bg-app)" }}
      >
        <StudioHeader
          client={null}
          onCompare={() => undefined}
          onReport={() => undefined}
          canCompare={false}
          canReport={false}
        />
      </div>
    );
  }
  if (!client) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "var(--color-bg-app)" }}
      >
        <StudioHeader
          client={null}
          onCompare={() => undefined}
          onReport={() => undefined}
          canCompare={false}
          canReport={false}
        />
        <main
          className="mx-auto"
          style={{ maxWidth: 600, padding: "40px 24px" }}
          data-testid="client-not-found"
        >
          <SectionLabel>Not found</SectionLabel>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: "8px 0 6px",
              color: "var(--color-text-primary)",
            }}
          >
            That client is not in this browser.
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              lineHeight: 1.55,
            }}
          >
            State is per-browser (LocalStorage). The roster lists clients you
            created in this browser; this URL points to one that is not here.
          </p>
          <div style={{ marginTop: 16 }}>
            <Link
              href="/fitter"
              className="cursor-pointer"
              style={{
                color: "var(--color-accent)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Back to roster
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const canReport = activeSession !== null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-bg-app)" }}
    >
      <StudioHeader
        client={client}
        onCompare={() => setCompareOpen(true)}
        onReport={() => {
          if (!activeSessionId) return;
          router.push(`/fitter/${clientId}/report?session=${activeSessionId}`);
        }}
        canCompare={sessions.length >= 2}
        canReport={canReport}
      />

      <main
        className="mx-auto w-full"
        style={{
          maxWidth: 1500,
          padding: "16px 16px 32px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "260px 260px minmax(0, 1fr) 320px",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Session rail */}
          <div style={{ minHeight: 420 }}>
            <SessionList
              sessions={sessions}
              activeId={activeSessionId}
              onSelect={handleSelectSession}
              onNew={handleNewSession}
            />
          </div>

          {/* Controls */}
          <div>
            {activeSession ? (
              <ControlsRail
                config={config}
                preset="Custom"
                recommendation={optState.kind === "done" ? optState.rec : null}
                onPresetChange={() => undefined}
                onConfigChange={handleConfigChange}
                onOptimize={() => runOptimize(config)}
                onReset={() => {
                  setConfig(activeSession.config);
                  clearOpt();
                }}
                optimizing={optState.kind === "running"}
              />
            ) : (
              <EmptyControls onNew={handleNewSession} />
            )}
          </div>

          {/* Simulator + HUD */}
          <div className="flex flex-col gap-3">
            <div
              className="rounded-[10px] px-4 py-3"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-default)",
              }}
              data-testid="hud-band"
            >
              <HudStrip metrics={metrics} />
            </div>
            <div
              className="rounded-[10px] p-4 flex flex-col gap-2"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <div className="flex items-baseline justify-between">
                <SectionLabel>Sagittal · drive side</SectionLabel>
                <div
                  className="mono"
                  style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}
                >
                  {(config.discipline ?? "Road")} · {config.targetSpeed.toFixed(0)} km/h
                </div>
              </div>
              <Simulator
                config={
                  optState.kind === "done"
                    ? {
                        ...config,
                        ...optState.rec.fit,
                        cadence: Math.round(
                          (
                            optState.rec.gears[selectedGearIndex] ??
                            optState.rec.gears[0]
                          ).cadenceAtTarget,
                        ),
                      }
                    : config
                }
                ghostConfig={optState.kind === "done" ? config : null}
                mode="anatomical"
                angularVel={(config.cadence * 2 * Math.PI) / 60}
                scrubAngle={null}
              />
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-text-tertiary)",
                  textAlign: "right",
                }}
              >
                {crankAngle.toFixed(2)} rad
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex flex-col gap-3">
            <RecommendationCard
              optState={optState}
              selectedGearIndex={selectedGearIndex}
              onSelectGear={setSelectedGearIndex}
              onApply={handleApply}
              onDismiss={clearOpt}
              onExport={() => {
                if (!activeSessionId) return;
                router.push(
                  `/fitter/${clientId}/report?session=${activeSessionId}`,
                );
              }}
            />
          </div>
        </div>
      </main>

      {compareOpen && (
        <SessionCompare
          sessions={sessions}
          initialBaselineId={sessions[1]?.id ?? sessions[0]?.id ?? null}
          initialCompareId={activeSessionId}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StudioHeader({
  client,
  onCompare,
  onReport,
  canCompare,
  canReport,
}: {
  client: Client | null;
  onCompare: () => void;
  onReport: () => void;
  canCompare: boolean;
  canReport: boolean;
}) {
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
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2"
          data-testid="studio-breadcrumb"
        >
          <Link
            href="/fitter"
            className="cursor-pointer"
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              textDecoration: "none",
            }}
            data-testid="breadcrumb-clients"
          >
            Clients
          </Link>
          <span style={{ color: "var(--color-text-tertiary)" }}>›</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {client?.name ?? "—"}
          </span>
          {client && (
            <Badge tone="info">Fitter studio</Badge>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onCompare}
          disabled={!canCompare}
          data-testid="compare-button"
        >
          Compare sessions
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onReport}
          disabled={!canReport}
          data-testid="generate-report-button"
        >
          Generate report
        </Button>
      </div>
    </header>
  );
}

function EmptyControls({ onNew }: { onNew: () => void }) {
  return (
    <div
      className="rounded-[10px] p-6 flex flex-col items-center gap-3 text-center"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px dashed var(--color-border-default)",
      }}
      data-testid="studio-no-session"
    >
      <SectionLabel>No active session</SectionLabel>
      <div
        style={{
          fontSize: 12,
          color: "var(--color-text-secondary)",
          lineHeight: 1.5,
        }}
      >
        Start a session to bind the simulator to this client. New sessions seed
        from the default rider profile.
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={onNew}
        data-testid="start-first-session-button"
      >
        + New session
      </Button>
    </div>
  );
}
