import { Link } from "react-router-dom";

import { StatusBadge, UrgencyBadge } from "./Badges";
import { waitingMinutes, type QueueStatus, type Urgency } from "@/lib/mediflow";

export interface QueueTableRow {
  id: string;
  queue_number: string;
  symptoms: string;
  urgency: Urgency;
  status: QueueStatus;
  created_at: string;
  livePriority: number;
  patientName?: string | undefined;
  department?: string | undefined;
  doctor?: string | undefined;
}

/** Table on desktop, stacked cards on small screens. */
export function QueueTable({
  rows,
  showDoctor = false,
  actionFor,
}: {
  rows: QueueTableRow[];
  showDoctor?: boolean;
  actionFor?: (row: QueueTableRow) => React.ReactNode;
}) {
  return (
    <div className="panel overflow-hidden">
      <table className="hidden w-full text-sm md:table">
        <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Patient</th>
            <th className="px-4 py-3 font-semibold">Symptoms</th>
            <th className="px-4 py-3 font-semibold">Urgency</th>
            <th className="px-4 py-3 font-semibold">Waiting</th>
            {showDoctor && <th className="px-4 py-3 font-semibold">Doctor</th>}
            <th className="px-4 py-3 font-semibold">Status</th>
            {actionFor && <th className="px-4 py-3 font-semibold">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className={row.urgency === "EMERGENCY" ? "bg-emergency-soft/50" : undefined}>
              <td className="px-4 py-3 font-bold tabular-nums">{row.livePriority}</td>
              <td className="px-4 py-3 font-medium">
                <span className="font-bold tabular-nums">{row.queue_number}</span>
                {row.patientName && (
                  <span className="ml-2 text-muted-foreground">{row.patientName}</span>
                )}
                {row.department && (
                  <span className="block text-xs text-muted-foreground">{row.department}</span>
                )}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">{row.symptoms}</td>
              <td className="px-4 py-3">
                <UrgencyBadge urgency={row.urgency} />
              </td>
              <td className="px-4 py-3 tabular-nums">{waitingMinutes(row.created_at)} min</td>
              {showDoctor && <td className="px-4 py-3">{row.doctor ?? "—"}</td>}
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
              {actionFor && <td className="px-4 py-3">{actionFor(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="divide-y divide-border md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{row.queue_number}</span>
              {row.patientName && (
                <span className="truncate text-sm text-muted-foreground">{row.patientName}</span>
              )}
              <UrgencyBadge urgency={row.urgency} />
              <span className="ml-auto text-xs font-bold tabular-nums">P {row.livePriority}</span>
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{row.symptoms}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <StatusBadge status={row.status} />
              <span>{waitingMinutes(row.created_at)} min waiting</span>
              {row.department && <span>· {row.department}</span>}
            </div>
            {actionFor?.(row)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConsultLink({ queueId, label = "Open" }: { queueId: string; label?: string }) {
  return (
    <Link
      to={`/doctor/consultation/${queueId}`}
      className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {label}
    </Link>
  );
}
