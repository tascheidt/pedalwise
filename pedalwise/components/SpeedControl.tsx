"use client";

const SPEEDS: { label: string; value: number }[] = [
  { label: "1×", value: 1 },
  { label: "½×", value: 0.5 },
  { label: "¼×", value: 0.25 },
  { label: "❚❚", value: 0 },
];

export function SpeedControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="inline-flex rounded-md p-0.5"
      style={{ background: "var(--color-bg-alt)", height: 28 }}
    >
      {SPEEDS.map((s) => {
        const active = Math.abs(s.value - value) < 0.001;
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => onChange(s.value)}
            className="rounded-md mono cursor-pointer"
            style={{
              fontSize: 11,
              padding: "0 10px",
              background: active ? "var(--color-bg-surface)" : "transparent",
              color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,.06)" : "none",
              fontWeight: 500,
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
