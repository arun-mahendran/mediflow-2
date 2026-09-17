import { Link } from "react-router-dom";
import { Activity, AlertTriangle, CheckCircle2, Clock, Stethoscope, Users } from "lucide-react";

import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { adminNav } from "@/components/mediflow/navs";
import { QueueTable } from "@/components/mediflow/QueueTable";
import { StatCard } from "@/components/mediflow/StatCard";
import { EmptyState, LoadingPanel } from "@/components/mediflow/States";
import { useRequireRole } from "@/hooks/useAuth";
import { useAdminData } from "@/lib/admin-data";

export default function AdminDashboard() {
  useRequireRole("ADMIN");
  const { data, isLoading } = useAdminData();

  return (
    <DashboardLayout
      nav={adminNav}
      roleLabel="Administrator"
      title="Hospital overview"
      subtitle="Live patient flow across all departments"
    >
      {isLoading ? (
        <LoadingPanel label="Loading hospital metrics…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Total Patients" value={data!.totals.patients} icon={Users} />
            <StatCard label="Currently Waiting" value={data!.totals.waiting} icon={Clock} />
            <StatCard
              label="Completed"
              value={data!.totals.completed}
              icon={CheckCircle2}
              tone="low"
            />
            <StatCard
              label="Avg Wait Time"
              value={`${data!.totals.avgWait} min`}
              icon={Activity}
              hint="From arrival to being called"
            />
            <StatCard
              label="Active Doctors"
              value={data!.totals.activeDoctors}
              icon={Stethoscope}
            />
            <StatCard
              label="Emergency Cases"
              value={data!.totals.emergencies}
              icon={AlertTriangle}
              tone={data!.totals.emergencies > 0 ? "emergency" : "default"}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Live queue</h2>
              <Link to="/admin/analytics" className="text-sm font-medium text-primary hover:underline">
                View analytics
              </Link>
            </div>
            {data!.waiting.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No patients waiting"
                description="Every patient has been seen. New arrivals appear here in real time."
              />
            ) : (
              <QueueTable rows={data!.waiting.slice(0, 8)} showDoctor />
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
