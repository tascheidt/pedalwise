"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-[12px]",
  md: "h-9 px-4 text-[13px]",
  lg: "h-11 px-5 text-[14px]",
};

const STYLE: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "var(--color-accent)",
    color: "white",
    border: "1px solid var(--color-accent)",
  },
  secondary: {
    background: "var(--color-bg-surface)",
    color: "var(--color-accent)",
    border: "1px solid var(--color-accent)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text-secondary)",
    border: "1px solid transparent",
  },
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className = "", style, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`rounded-md font-medium inline-flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${SIZE[size]} ${className}`}
      style={{ ...STYLE[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
});
