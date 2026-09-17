import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { statusLabel, urgencyClasses, type QueueStatus, type Urgency } from "@/lib/mediflow";

export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        urgencyClasses(urgency),
        className,
      )}
    >
      {urgency === "EMERGENCY" && <AlertTriangle className="size-3.5" />}
      {urgency}
    </span>
  );
}

const statusStyles: Record<QueueStatus, string> = {
  WAITING: "bg-muted text-muted-foreground border-border",
  CALLED: "bg-accent text-accent-foreground border-primary/30",
  IN_CONSULTATION: "bg-primary/10 text-primary border-primary/30",
  COMPLETED: "bg-low-soft text-low border-low/30",
  CANCELLED: "bg-muted text-muted-foreground border-border line-through",
};

export function StatusBadge({ status }: { status: QueueStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

export function AvailabilityDot({ availability }: { availability: string }) {
  const color =
    availability === "AVAILABLE" ? "bg-low" : availability === "BUSY" ? "bg-high" : "bg-muted-foreground";
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={cn("size-2 rounded-full", color)} />
      <span className="capitalize">{availability.toLowerCase()}</span>
    </span>
  );
}
