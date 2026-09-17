import { CheckCircle2 } from "lucide-react";

import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { doctorNav } from "@/components/mediflow/navs";
import { QueueTable } from "@/components/mediflow/QueueTable";
import { EmptyState, SkeletonRows } from "@/components/mediflow/States";
import { useRequireRole } from "@/hooks/useAuth";
import { useDoctorData } from "@/lib/doctor-data";

export default function DoctorQueue() {
  const auth = useRequireRole("DOCTOR");
  const { data, isLoading } = useDoctorData(auth.doctorId);

  return (
    <DashboardLayout
      nav={doctorNav}
      roleLabel="Doctor"
      title="My queue"
      subtitle="Sorted by live priority score (urgency + waiting time)"
    >
      {isLoading ? (
        <SkeletonRows rows={5} />
      ) : (data?.waiting.length ?? 0) === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Queue is clear"
          description="No patients are waiting for a consultation right now."
        />
      ) : (
        <QueueTable rows={data?.waiting ?? []} />
      )}
    </DashboardLayout>
  );
}
