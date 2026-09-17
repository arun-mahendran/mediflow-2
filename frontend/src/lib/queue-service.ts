import { consultationApi, doctorApi, queueApi, type QueueRow } from "@/services/api";
import { priorityScore, type Urgency } from "./mediflow";

export type { QueueRow };

/** Live priority: stored urgency weight + waiting-time bonus, recomputed on read. */
export function withLivePriority<T extends { urgency: Urgency; created_at: string }>(rows: T[]) {
  const now = Date.now();
  return rows
    .map((row) => ({ ...row, livePriority: priorityScore(row.urgency, row.created_at, now) }))
    .sort((a, b) => b.livePriority - a.livePriority);
}

export async function joinQueue(params: {
  patientId: string;
  departmentId: string | null;
  symptoms: string;
  urgency: Urgency;
  reason: string;
}) {
  return queueApi.join(params);
}

/** Asks the backend to assign the highest-priority waiting patient to the calling doctor. */
export async function callNextPatient() {
  return doctorApi.callNext();
}

export async function startConsultation(queueRow: QueueRow, doctorId: string) {
  await consultationApi.start({ queueId: queueRow.id, doctorId });
}

export async function completeConsultation(params: {
  consultationId: string;
  doctorId: string;
  notes: string;
  diagnosis: string;
  prescription: string;
}) {
  await consultationApi.complete(params.consultationId, {
    notes: params.notes,
    diagnosis: params.diagnosis,
    prescription: params.prescription,
    doctorId: params.doctorId,
  });
}
