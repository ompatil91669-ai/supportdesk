import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
  | "open"
  | "pending"
  | "closed"
  | "low"
  | "medium"
  | "high"
  | "customer"
  | "agent"
  | "admin"
  | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  children: ReactNode;
}

export default function Badge({
  variant,
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={["badge", `badge-${variant}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
