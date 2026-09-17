import { useQuery } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";

import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { doctorNav } from "@/components/mediflow/navs";
import { EmptyState, SkeletonRows } from "@/components/mediflow/States";
import { useRequireRole } from "@/hooks/useAuth";
import { consultationApi, queueApi } from "@/services/api";

export default function DoctorConsultations() {
  const auth = useRequireRole("DOCTOR");

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-consultations", auth.doctorId],
    enabled: Boolean(auth.doctorId),
    queryFn: async () => {
      const [consults, queue] = await Promise.all([
        consultationApi.listForDoctor(),
        queueApi.list(),
      ]);
      return {
        consults: [...consults].sort(
          (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
        ),
        queue,
      };
    },
  });

  return (
    <DashboardLayout
      nav={doctorNav}
      roleLabel="Doctor"
      title="Consultations"
      subtitle="Everything you have recorded in MediFlow"
    >
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : (data?.consults.length ?? 0) === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No consultations yet"
          description="Once you complete a consultation the clinical record appears here."
        />
      ) : (
        <div className="space-y-3">
          {data!.consults.map((consult) => {
            const entry = data!.queue.find((q) => q.id === consult.queue_id);
            return (
              <div key={consult.id} className="panel space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold">{entry?.queue_number ?? "Patient"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(consult.started_at).toLocaleString()}
                  </span>
                  <span className="ml-auto text-xs font-medium text-muted-foreground">
                    {consult.completed_at ? "Completed" : "In progress"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{entry?.symptoms}</p>
                <div className="grid gap-3 rounded-lg bg-surface p-4 text-sm sm:grid-cols-3">
                  <Field label="Diagnosis" value={consult.diagnosis} />
                  <Field label="Prescription" value={consult.prescription} />
                  <Field label="Notes" value={consult.notes} />
                </div>
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
