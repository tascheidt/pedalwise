export type BadgeTone = "success" | "warn" | "danger" | "info" | "neutral";

const STYLES: Record<BadgeTone, { bg: string; fg: string; border: string }> = {
  success: { bg: "var(--color-success-bg)", fg: "var(--color-success)", border: "transparent" },
  warn:    { bg: "var(--color-warn-bg)",    fg: "var(--color-warn)",    border: "transparent" },
  danger:  { bg: "var(--color-danger-bg)",  fg: "var(--color-danger)",  border: "transparent" },
  info:    { bg: "var(--color-accent-light)", fg: "var(--color-accent-dark)", border: "transparent" },
  neutral: { bg: "var(--color-bg-alt)",     fg: "var(--color-text-secondary)", border: "var(--color-border-default)" },
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  const s = STYLES[tone];
  return (
    <span
      className="inline-flex items-center rounded-md mono"
      style={{
        backgroundColor: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
        fontSize: 11,
        padding: "2px 8px",
        lineHeight: 1.3,
        fontWeight: 500,
        letterSpacing: 0.01,
      }}
    >
      {children}
    </span>
  );
}
