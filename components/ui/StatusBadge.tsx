import React from "react";
import { Badge } from "./Badge";

export type ResearchStatus = "none" | "pending" | "generating" | "ready" | "failed";

export interface StatusBadgeProps {
  status: ResearchStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const statusConfig: Record<
    ResearchStatus,
    { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
  > = {
    none: { label: "No Research", variant: "default" },
    pending: { label: "Queued", variant: "info" },
    generating: { label: "Researching...", variant: "warning" },
    ready: { label: "Ready", variant: "success" },
    failed: { label: "Failed", variant: "error" },
  };

  const config = statusConfig[status] || statusConfig.none;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
