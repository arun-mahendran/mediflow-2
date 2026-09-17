import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";

import { StatusBadge, UrgencyBadge } from "@/components/mediflow/Badges";
import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { patientNav } from "@/components/mediflow/navs";
import { EmptyState, SkeletonRows } from "@/components/mediflow/States";
import { useAuth } from "@/hooks/useAuth";
import { consultationApi } from "@/services/api";

export default function HistoryPage() {
  const auth = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["patient-history", auth.patientId],
    enabled: Boolean(auth.patientId),
    queryFn: () => consultationApi.myHistory(),
  });

  return (
    <DashboardLayout
      nav={patientNav}
      roleLabel="Patient"
      title="Visit history"
      subtitle="Every queue entry and its outcome"
    >
      {isLoading ? (
        <SkeletonRows />
      ) : (data?.entries.length ?? 0) === 0 ? (
        <EmptyState
          icon={History}
          title="No visits yet"
          description="Once you join the queue your visits will appear here with urgency, department and clinical outcome."
        />
      ) : (
        <div className="space-y-3">
          {data!.entries.map((entry) => {
            const consult = data!.consults.find((c) => c.queue_id === entry.id);
            return (
              <div key={entry.id} className="panel space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold">{entry.queue_number}</span>
                  <UrgencyBadge urgency={entry.urgency} />
                  <StatusBadge status={entry.status} />
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{entry.symptoms}</p>
                {consult?.completed_at && (
                  <div className="grid gap-3 rounded-lg bg-surface p-4 text-sm sm:grid-cols-3">
                    <Field label="Diagnosis" value={consult.diagnosis} />
                    <Field label="Prescription" value={consult.prescription} />
                    <Field label="Notes" value={consult.notes} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1">{value || "—"}</p>
    </div>
  );
}
