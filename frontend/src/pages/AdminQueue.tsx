import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { adminNav } from "@/components/mediflow/navs";
import { QueueTable } from "@/components/mediflow/QueueTable";
import { EmptyState, SkeletonRows } from "@/components/mediflow/States";
import { useRequireRole } from "@/hooks/useAuth";
import { useAdminData } from "@/lib/admin-data";
import { URGENCY_LEVELS, type Urgency } from "@/lib/mediflow";

export default function AdminQueue() {
  useRequireRole("ADMIN");
  const { data, isLoading } = useAdminData();
  const [urgency, setUrgency] = useState<Urgency | "ALL">("ALL");
  const [department, setDepartment] = useState("ALL");

  const rows = (data?.waiting ?? []).filter(
    (row) =>
      (urgency === "ALL" || row.urgency === urgency) &&
      (department === "ALL" || row.department === department),
  );

  return (
    <DashboardLayout
      nav={adminNav}
      roleLabel="Administrator"
      title="Queue monitor"
      subtitle="Every waiting patient, ordered by live priority"
    >
      <div className="flex flex-wrap gap-3">
        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value as Urgency | "ALL")}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">All urgencies</option>
          {URGENCY_LEVELS.map((value) => (
            <option key={value} value={value}>
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">All departments</option>
          {(data?.departments ?? []).map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <SkeletonRows rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nothing in the queue"
          description="No waiting patients match the selected filters."
        />
      ) : (
        <QueueTable rows={rows} showDoctor />
      )}
    </DashboardLayout>
  );
}
