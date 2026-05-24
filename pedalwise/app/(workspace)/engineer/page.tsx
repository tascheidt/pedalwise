"use client";

/**
 * Engineer Workbench (PW-104).
 *
 * Composition:
 *   - SimulatorWorkspace (defaultViewMode="diagnostic") — the same kinematic
 *     model + DiagnosticPanels (force decomposition, polar IE, joint power).
 *   - Workbench panels below: SweepControls + SweepHeatmap, EquationsPanel,
 *     ExportBar.
 *
 * State boundary: the workbench keeps its own `workbenchConfig` so the sweep
 * + equations + export operate on a stable baseline that the user can
 * "pin" by clicking a heatmap cell. The simulator at the top is the
 * existing single-source-of-truth UI for the persona and is intentionally
 * untouched (do-not-modify-other-files constraint of this ticket).
 */

import { useCallback, useMemo, useState } from "react";

import { SimulatorWorkspace } from "@/components/workspace/SimulatorWorkspace";
import { SweepControls } from "@/components/engineer/SweepControls";
import { SweepHeatmap } from "@/components/engineer/SweepHeatmap";
import { EquationsPanel } from "@/components/engineer/EquationsPanel";
import { ExportBar } from "@/components/engineer/ExportBar";

import { Card } from "@/components/Card";
import { SectionLabel } from "@/components/SectionLabel";

import type { Config } from "@/lib/types";
import type { SweepRequest, SweepResult } from "@/lib/sweep";
import { useSweep } from "@/lib/sweep";
import { DEFAULT_CONFIG } from "@/lib/presets";
import { evaluate } from "@/lib/kinematics";

export default function EngineerWorkspacePage() {
  // Workbench baseline — what sweeps vary around and what the equations
  // panel substitutes live values from. Click a heatmap cell to pin it.
  const [workbenchConfig, setWorkbenchConfig] = useState<Config>(DEFAULT_CONFIG);
  const [importedResult, setImportedResult] = useState<SweepResult | null>(null);

  const { result, inFlight, error, run, cancel } = useSweep();

  const metrics = useMemo(() => evaluate(workbenchConfig), [workbenchConfig]);

  const handleRun = useCallback(
    (req: SweepRequest) => {
      // Always run against the latest workbench baseline.
      run({ ...req, base: workbenchConfig });
    },
    [run, workbenchConfig],
  );

  const handleCellClick = useCallback((overrides: Record<string, number>) => {
    setWorkbenchConfig((c) => ({ ...c, ...overrides }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-app)" }}>
      {/* Top: shared simulator + diagnostic panels — engineer audience #2
          lives in this view per CLAUDE.md §1. */}
      <SimulatorWorkspace persona="engineer" defaultViewMode="diagnostic" />

      {/* Workbench: sweep + equations + export */}
      <section
        className="mx-auto w-full"
        style={{ maxWidth: 1500, padding: "0 16px 32px" }}
        data-testid="engineer-workbench"
      >
        <Card padding={20} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="flex items-baseline justify-between">
            <SectionLabel>Workbench · parameter sweep, equations, raw export</SectionLabel>
            <span className="mono" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              baseline pinned to last clicked cell
            </span>
          </div>

          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "260px minmax(0, 1fr) 360px" }}
          >
            {/* Left rail — sweep controls + export */}
            <div className="flex flex-col gap-5">
              <SweepControls
                baseConfig={workbenchConfig}
                inFlight={inFlight}
                hasResult={Boolean(result)}
                onRun={handleRun}
                onCancel={cancel}
              />
              <ExportBar
                result={result}
                currentConfig={workbenchConfig}
                onImported={setImportedResult}
              />
            </div>

            {/* Center — heatmap + imported viewer */}
            <div className="flex flex-col gap-4 min-w-0">
              <SweepHeatmap
                result={result}
                inFlight={inFlight}
                error={error}
                onCellClick={handleCellClick}
              />

              {importedResult && (
                <div
                  className="rounded-md p-3"
                  style={{
                    background: "var(--color-bg-alt)",
                    border: "1px dashed var(--color-border-strong)",
                  }}
                  data-testid="imported-viewer"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <SectionLabel>Imported sweep · viewer-only</SectionLabel>
                    <button
                      type="button"
                      onClick={() => setImportedResult(null)}
                      className="mono cursor-pointer"
                      style={{ fontSize: 11, color: "var(--color-text-secondary)" }}
                      data-testid="imported-viewer-close"
                    >
                      ✕ close
                    </button>
                  </div>
                  <SweepHeatmap result={importedResult} inFlight={false} error={null} />
                </div>
              )}
            </div>

            {/* Right rail — equations */}
            <div>
              <EquationsPanel config={workbenchConfig} metrics={metrics} />
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
