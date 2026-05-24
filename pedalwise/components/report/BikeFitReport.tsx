"use client";

import { useMemo } from "react";

import type { Client, Session } from "@/lib/types";
import { evaluate } from "@/lib/kinematics";

import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";
import { DeltaHeadline } from "@/components/DeltaHeadline";

/**
 * BikeFitReport (PW-103) — print-friendly summary of a fit session.
 *
 * Mirrors `redesign/report.jsx`: header (client + date + fitter), summary
 * delta, current vs recommended side-by-side, anatomy strip, fitter notes,
 * footer. A4-ish width (720 px) so it prints onto a single page when content
 * fits.
 *
 * Print stylesheet: `.no-print` hides chrome; the paper itself uses semantic
 * tokens that remain legible on white paper. No hex values.
 */
export function BikeFitReport({
  client,
  session,
  fitterName,
}: {
  client: Client;
  session: Session;
  fitterName: string;
}) {
  // Current = the config the session was created with.
  // Recommended = the applied snapshot if present, else current (no rec yet).
  const currentMetrics = useMemo(() => evaluate(session.config), [session.config]);

  const recommendedConfig = useMemo(() => {
    if (!session.applied) return session.config;
    return {
      ...session.config,
      saddleHeight: session.applied.fit.saddleHeight,
      crankLength: session.applied.fit.crankLength,
      saddleSetback: session.applied.fit.saddleSetback,
      cadence: session.applied.goalCadence,
    };
  }, [session]);
  const recommendedMetrics = useMemo(
    () => (session.applied ? session.applied.metrics : evaluate(recommendedConfig)),
    [session.applied, recommendedConfig],
  );

  const deltaEtaPP =
    (recommendedMetrics.grossEfficiency - currentMetrics.grossEfficiency) * 100;

  const date = new Date(session.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const generatedAt = new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <>
      {/* Print stylesheet — semantic tokens only; no hex values. */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 18mm; }
          body { background: white !important; }
          .report-paper {
            box-shadow: none !important;
            border: none !important;
            max-width: none !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .report-page-break-before { page-break-before: always; }
        }
      `}</style>

      <div
        style={{
          background: "var(--color-bg-app)",
          minHeight: "100vh",
          padding: "32px 24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div style={{ width: "100%", maxWidth: 720 }}>
          {/* On-screen toolbar */}
          <div
            className="no-print flex items-center justify-between"
            style={{ marginBottom: 16 }}
          >
            <div>
              <SectionLabel>Bike-fit report</SectionLabel>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  marginTop: 4,
                }}
              >
                Generated {generatedAt}
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              data-testid="print-report"
            >
              Print
            </Button>
          </div>

          {/* Paper */}
          <article
            className="report-paper rounded-[10px]"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-default)",
              boxShadow: "0 10px 30px -15px rgba(0,0,0,0.12)",
              padding: "44px 48px",
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
            data-testid="bike-fit-report"
          >
            {/* Header */}
            <header
              className="flex items-start justify-between gap-6"
              style={{
                borderBottom: "1px solid var(--color-border-default)",
                paddingBottom: 16,
              }}
              data-testid="report-section-header"
            >
              <div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--color-accent)",
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Pedalwise
                </div>
                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    margin: "12px 0 4px",
                    lineHeight: 1.1,
                    color: "var(--color-text-primary)",
                  }}
                >
                  Bike-fit report
                </h1>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  {client.name} · {date}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="section-label">Fitted by</div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    marginTop: 4,
                  }}
                >
                  {fitterName || "—"}
                </div>
              </div>
            </header>

            {/* Summary box */}
            <section
              className="rounded-md flex items-center gap-5"
              style={{
                background: "var(--color-accent-light)",
                color: "var(--color-accent-dark)",
                padding: "16px 20px",
              }}
              data-testid="report-section-summary"
            >
              <DeltaHeadline
                value={deltaEtaPP}
                suffix="pp · gross η · recommended vs current"
              />
              <div
                style={{
                  flex: 1,
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: "var(--color-text-primary)",
                }}
              >
                {session.applied ? (
                  <>
                    Saddle{" "}
                    <strong>
                      {formatDelta(
                        recommendedConfig.saddleHeight - session.config.saddleHeight,
                        "cm",
                      )}
                    </strong>
                    , crank{" "}
                    <strong>
                      {formatDelta(
                        recommendedConfig.crankLength - session.config.crankLength,
                        "mm",
                      )}
                    </strong>
                    . Knee at BDC moves from{" "}
                    <strong>{currentMetrics.kneeAtBDC.toFixed(0)}°</strong> to{" "}
                    <strong>{recommendedMetrics.kneeAtBDC.toFixed(0)}°</strong>
                    {" "}— Holmes range is 25–45°.
                  </>
                ) : (
                  <>
                    No recommendation applied yet. The current fit is shown
                    below; run the optimizer in the studio to populate the
                    recommended column.
                  </>
                )}
              </div>
            </section>

            {/* Side-by-side */}
            <section data-testid="report-section-fit">
              <SectionLabel>Current vs recommended</SectionLabel>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                  marginTop: 10,
                }}
              >
                <ReportPanel title="Current" sub="Measured at intake">
                  <FitTable
                    rows={[
                      ["Saddle height", `${session.config.saddleHeight.toFixed(1)} cm`],
                      ["Crank length", `${session.config.crankLength.toFixed(1)} mm`],
                      ["Saddle setback", `${session.config.saddleSetback.toFixed(1)} cm`],
                      ["Cadence", `${session.config.cadence} rpm`],
                      [
                        "Knee at BDC",
                        `${currentMetrics.kneeAtBDC.toFixed(0)}°`,
                        currentMetrics.kneeAtBDC >= 25 && currentMetrics.kneeAtBDC <= 45
                          ? "success"
                          : "warn",
                      ],
                      ["Gross η", `${(currentMetrics.grossEfficiency * 100).toFixed(1)}%`],
                    ]}
                  />
                </ReportPanel>
                <ReportPanel
                  title="Recommended"
                  sub={session.applied ? "After fit adjustments" : "No applied recommendation"}
                  emphasized
                >
                  <FitTable
                    rows={[
                      [
                        "Saddle height",
                        `${recommendedConfig.saddleHeight.toFixed(1)} cm`,
                        undefined,
                        recommendedConfig.saddleHeight - session.config.saddleHeight,
                        "cm",
                      ],
                      [
                        "Crank length",
                        `${recommendedConfig.crankLength.toFixed(1)} mm`,
                        undefined,
                        recommendedConfig.crankLength - session.config.crankLength,
                        "mm",
                      ],
                      [
                        "Saddle setback",
                        `${recommendedConfig.saddleSetback.toFixed(1)} cm`,
                        undefined,
                        recommendedConfig.saddleSetback - session.config.saddleSetback,
                        "cm",
                      ],
                      [
                        "Cadence",
                        `${recommendedConfig.cadence} rpm`,
                        undefined,
                        recommendedConfig.cadence - session.config.cadence,
                        "rpm",
                      ],
                      [
                        "Knee at BDC",
                        `${recommendedMetrics.kneeAtBDC.toFixed(0)}°`,
                        recommendedMetrics.kneeAtBDC >= 25 && recommendedMetrics.kneeAtBDC <= 45
                          ? "success"
                          : "warn",
                        recommendedMetrics.kneeAtBDC - currentMetrics.kneeAtBDC,
                        "°",
                      ],
                      [
                        "Gross η",
                        `${(recommendedMetrics.grossEfficiency * 100).toFixed(1)}%`,
                        "success",
                        (recommendedMetrics.grossEfficiency - currentMetrics.grossEfficiency) * 100,
                        "pp",
                      ],
                    ]}
                  />
                </ReportPanel>
              </div>
            </section>

            {/* Anatomy + key metrics */}
            <section
              className="grid"
              style={{ gridTemplateColumns: "200px 1fr", gap: 20 }}
              data-testid="report-section-anatomy"
            >
              <div>
                <SectionLabel>Anatomy</SectionLabel>
                <FitTable
                  rows={[
                    ["Height", `${session.config.height.toFixed(0)} cm`],
                    ["Mass", `${session.config.mass.toFixed(0)} kg`],
                    ["Femur", `${session.config.femur.toFixed(1)} cm`],
                    ["Tibia", `${session.config.tibia.toFixed(1)} cm`],
                    ["Foot", `${session.config.foot.toFixed(1)} cm`],
                    [
                      "Preferred cadence",
                      `${session.config.preferredCadence.toFixed(0)} rpm`,
                    ],
                  ]}
                />
              </div>
              <div>
                <SectionLabel>Key metrics · recommended</SectionLabel>
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <KeyMetric
                    label="Gross η"
                    value={`${(recommendedMetrics.grossEfficiency * 100).toFixed(1)}%`}
                  />
                  <KeyMetric
                    label="Knee at BDC"
                    value={`${recommendedMetrics.kneeAtBDC.toFixed(0)}°`}
                    note="Holmes 25–45°"
                  />
                  <KeyMetric label="IE" value={recommendedMetrics.ie.toFixed(2)} />
                  <KeyMetric
                    label="Optimum cadence"
                    value={`${recommendedMetrics.optimumCadence.toFixed(0)} rpm`}
                  />
                </div>
              </div>
            </section>

            {/* Fitter notes */}
            {client.notes && (
              <section data-testid="report-section-notes">
                <SectionLabel>Fitter notes</SectionLabel>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.6,
                    padding: "12px 14px",
                    background: "var(--color-bg-alt)",
                    borderRadius: 6,
                    border: "1px solid var(--color-border-default)",
                    marginTop: 8,
                  }}
                >
                  {client.notes}
                </div>
              </section>
            )}

            {/* Rationale */}
            <section data-testid="report-section-rationale">
              <SectionLabel>Optimizer rationale</SectionLabel>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                  marginTop: 8,
                }}
              >
                {session.applied
                  ? `The proposed fit lifts gross η by ${deltaEtaPP.toFixed(1)} pp at the chosen cadence. Trial for two weeks, then re-measure.`
                  : "Apply a recommendation in the studio to populate this section."}
              </div>
            </section>

            {/* Footer */}
            <footer
              className="flex items-center justify-between"
              style={{
                borderTop: "1px solid var(--color-border-default)",
                paddingTop: 14,
                marginTop: "auto",
                fontSize: 10,
                color: "var(--color-text-tertiary)",
              }}
              data-testid="report-section-footer"
            >
              <span>Pedalwise · v1.1 · sagittal-plane bike-fit simulator</span>
              <span className="mono">session {session.id.slice(0, 8)}</span>
            </footer>
          </article>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function ReportPanel({
  title,
  sub,
  emphasized,
  children,
}: {
  title: string;
  sub: string;
  emphasized?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-md"
      style={{
        border: emphasized
          ? "1.5px solid var(--color-accent)"
          : "1px solid var(--color-border-default)",
        background: emphasized ? "var(--color-accent-light)" : "var(--color-bg-surface)",
        padding: 14,
      }}
    >
      <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: emphasized ? "var(--color-accent-dark)" : "var(--color-text-primary)",
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{sub}</span>
      </div>
      {children}
    </div>
  );
}

type FitRow =
  | [string, string]
  | [string, string, "success" | "warn" | undefined]
  | [string, string, "success" | "warn" | undefined, number, string];

function FitTable({ rows }: { rows: FitRow[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 4 }}>
      <tbody>
        {rows.map((row) => {
          const label = row[0];
          const value = row[1];
          const status = row[2];
          const delta = row[3];
          const unit = row[4];
          const color =
            status === "success"
              ? "var(--color-success)"
              : status === "warn"
                ? "var(--color-warn)"
                : "var(--color-text-primary)";
          const showDelta = delta !== undefined && Math.abs(delta) > 0.05;
          const sign = delta && delta > 0 ? "+" : delta && delta < 0 ? "−" : "";
          const deltaText = showDelta
            ? `${sign}${Math.abs(delta!).toFixed(unit === "rpm" || unit === "°" ? 0 : 1)} ${unit}`
            : null;
          return (
            <tr
              key={label}
              style={{ borderBottom: "1px solid var(--color-border-default)" }}
            >
              <td
                style={{
                  padding: "5px 0",
                  fontSize: 11,
                  color: "var(--color-text-secondary)",
                }}
              >
                {label}
              </td>
              <td
                className="mono"
                style={{
                  padding: "5px 0",
                  fontSize: 11,
                  color,
                  fontWeight: 500,
                  textAlign: "right",
                }}
              >
                {value}
                {deltaText && (
                  <span
                    className="mono"
                    style={{
                      marginLeft: 6,
                      color: "var(--color-success)",
                      fontSize: 10,
                    }}
                  >
                    {deltaText}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function KeyMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div
      className="rounded-md p-2"
      style={{ background: "var(--color-bg-alt)" }}
    >
      <div className="section-label">{label}</div>
      <div
        className="mono"
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: "var(--color-text-primary)",
          marginTop: 2,
        }}
      >
        {value}
      </div>
      {note && (
        <div
          className="italic"
          style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

function formatDelta(v: number, unit: string): string {
  if (Math.abs(v) < 0.05) return `unchanged ${unit}`;
  const sign = v > 0 ? "+" : "−";
  const precision = unit === "rpm" || unit === "°" ? 0 : 1;
  return `${sign}${Math.abs(v).toFixed(precision)} ${unit}`;
}
