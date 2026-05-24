type Status = "success" | "warn" | "danger" | "neutral";

const ACCENT: Record<Status, string> = {
  success: "var(--color-success)",
  warn: "var(--color-warn)",
  danger: "var(--color-danger)",
  neutral: "var(--color-border-default)",
};

const TEXT: Record<Status, string> = {
  success: "var(--color-text-primary)",
  warn: "var(--color-text-primary)",
  danger: "var(--color-danger)",
  neutral: "var(--color-text-primary)",
};

export function StatCard({
  label,
  value,
  note,
  status = "neutral",
  size = "md",
}: {
  label: string;
  value: string;
  note?: string;
  status?: Status;
  size?: "sm" | "md" | "lg";
}) {
  const valueSize = size === "lg" ? 28 : size === "sm" ? 16 : 22;
  return (
    <div
      className="rounded-md px-3 py-2 flex flex-col gap-1"
      style={{
        background: "var(--color-bg-alt)",
        borderLeft: `2px solid ${ACCENT[status]}`,
      }}
    >
      <div className="section-label">{label}</div>
      <div className="mono" style={{ color: TEXT[status], fontSize: valueSize, fontWeight: 500, lineHeight: 1 }}>
        {value}
      </div>
      {note && (
        <div className="italic" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          {note}
        </div>
      )}
    </div>
  );
}
