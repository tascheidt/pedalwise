"use client";

import { useRef, useState } from "react";

import type { Config } from "@/lib/types";
import type { SweepResult } from "@/lib/sweep";
import { toJSON, toCSV, framesToCSV, fromJSON } from "@/lib/export";

import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";

/**
 * ExportBar — JSON / CSV round-trip for sweep results, plus per-degree
 * frame stream for the current rider config. Import is read-only — it
 * sets a viewer state but does not mutate the running simulator (the
 * engineer can inspect a colleague's sweep without losing their own).
 */

export type ExportBarProps = {
  result: SweepResult | null;
  currentConfig: Config;
  /** Called after a successful import so the page can show the viewer. */
  onImported?: (result: SweepResult) => void;
};

export function ExportBar({ result, currentConfig, onImported }: ExportBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [lastImportedAt, setLastImportedAt] = useState<number | null>(null);

  function timestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function download(filename: string, contents: string, mime: string) {
    const blob = new Blob([contents], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Defer revoke to next tick so the click can flush.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function handleExportJSON() {
    if (!result) return;
    download(`sweep-${timestamp()}.json`, toJSON(result), "application/json");
  }

  function handleExportCSV() {
    if (!result) return;
    download(`sweep-${timestamp()}.csv`, toCSV(result), "text/csv");
  }

  function handleExportFrames() {
    download(`frames-${timestamp()}.csv`, framesToCSV(currentConfig), "text/csv");
  }

  function handleImportClick() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so the same file can be selected again.
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const imported = fromJSON(text);
      onImported?.(imported);
      setLastImportedAt(Date.now());
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    }
  }

  return (
    <div className="flex flex-col gap-2" data-testid="export-bar">
      <SectionLabel>Export · raw numerics</SectionLabel>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportJSON}
          disabled={!result}
          data-testid="export-sweep-json"
          title={result ? "Download sweep as JSON" : "Run a sweep first"}
        >
          Export sweep JSON
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          disabled={!result}
          data-testid="export-sweep-csv"
          title={result ? "Download sweep as CSV" : "Run a sweep first"}
        >
          Export sweep CSV
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportFrames}
          data-testid="export-frames-csv"
          title="Per-degree pose + force + power for the current rider"
        >
          Export per-degree frames CSV
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImportClick}
          data-testid="import-sweep-json"
          title="Load a sweep JSON for inspection (does not change the simulator)"
        >
          Import sweep JSON
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          style={{ display: "none" }}
          data-testid="import-sweep-file"
        />
      </div>

      {importError && (
        <div
          className="mono"
          style={{ fontSize: 11, color: "var(--color-danger)" }}
          role="alert"
          data-testid="export-import-error"
        >
          Import failed · {importError}
        </div>
      )}
      {lastImportedAt && !importError && (
        <div
          className="mono"
          style={{ fontSize: 11, color: "var(--color-success)" }}
          data-testid="export-import-success"
        >
          Imported · displayed below the heatmap.
        </div>
      )}
    </div>
  );
}
