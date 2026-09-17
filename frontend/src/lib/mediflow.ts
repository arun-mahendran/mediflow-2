/** Shared MediFlow domain constants and helpers (safe for client + server). */

export const URGENCY_LEVELS = ["EMERGENCY", "HIGH", "MEDIUM", "LOW"] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number];

export const DEPARTMENT_NAMES = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Pediatrics",
  "Emergency",
] as const;
export type DepartmentName = (typeof DEPARTMENT_NAMES)[number];

export const QUEUE_STATUSES = [
  "WAITING",
  "CALLED",
  "IN_CONSULTATION",
  "COMPLETED",
  "CANCELLED",
] as const;
export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export type Availability = "AVAILABLE" | "BUSY" | "OFFLINE";
export type AppRole = "PATIENT" | "DOCTOR" | "ADMIN";

export const AI_DISCLAIMER =
  "AI-generated urgency assessment is for support purposes only and does not replace professional medical evaluation.";

/** Deterministic urgency weights used by the queue optimizer. */
export const URGENCY_SCORE: Record<Urgency, number> = {
  EMERGENCY: 100,
  HIGH: 70,
  MEDIUM: 40,
  LOW: 20,
};

/** Average minutes a consultation takes, used for wait estimates. */
export const AVG_CONSULT_MINUTES = 6;

export function waitingMinutes(createdAt: string, now: number = Date.now()): number {
  return Math.max(0, Math.round((now - new Date(createdAt).getTime()) / 60000));
}

/**
 * priority = urgency weight + (waiting minutes x 0.5)
 * Waiting time is included so low-urgency patients never starve.
 */
export function priorityScore(urgency: Urgency, createdAt: string, now?: number): number {
  return Math.round((URGENCY_SCORE[urgency] + waitingMinutes(createdAt, now) * 0.5) * 10) / 10;
}

export function estimatedWaitMinutes(position: number, availableDoctors: number): number {
  const doctors = Math.max(1, availableDoctors);
  return Math.max(0, Math.round((position / doctors) * AVG_CONSULT_MINUTES));
}

export function urgencyClasses(urgency: Urgency): string {
  switch (urgency) {
    case "EMERGENCY":
      return "bg-emergency-soft text-emergency border-emergency/30";
    case "HIGH":
      return "bg-high-soft text-high border-high/30";
    case "MEDIUM":
      return "bg-medium-soft text-medium-foreground border-medium/40";
    default:
      return "bg-low-soft text-low border-low/30";
  }
}

export function statusLabel(status: QueueStatus): string {
  return status.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export const STATUS_TIMELINE: QueueStatus[] = [
  "WAITING",
  "CALLED",
  "IN_CONSULTATION",
  "COMPLETED",
];
