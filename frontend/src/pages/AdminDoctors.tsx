import { useQueryClient } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { adminNav } from "@/components/mediflow/navs";
import { EmptyState, SkeletonRows } from "@/components/mediflow/States";
import { useRequireRole } from "@/hooks/useAuth";
import { useAdminData } from "@/lib/admin-data";
import { adminApi } from "@/services/api";

const availabilityTone: Record<string, string> = {
  AVAILABLE: "bg-low-soft text-low",
  BUSY: "bg-high-soft text-high",
  OFFLINE: "bg-muted text-muted-foreground",
};

export default function AdminDoctors() {
  useRequireRole("ADMIN");
  const { data, isLoading } = useAdminData();
  const queryClient = useQueryClient();

  async function reassign(doctorId: string, departmentId: string) {
    try {
      await adminApi.updateDoctorDepartment(doctorId, departmentId || null);
      toast.success("Department updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    } catch {
      toast.error("Could not update the department.");
    }
  }

  return (
    <DashboardLayout
      nav={adminNav}
      roleLabel="Administrator"
      title="Doctors"
      subtitle="Availability and workload across the hospital"
    >
      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : (data?.doctors.length ?? 0) === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors yet"
          description="Doctor accounts appear here once they are created and given the doctor role."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data!.doctors.map((doc) => (
            <div key={doc.id} className="panel space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Dr. {doc.name}</p>
                  <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    availabilityTone[doc.availability] ?? ""
                  }`}
                >
                  {doc.availability.toLowerCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{doc.email}</p>
              <p className="text-sm">
                <span className="font-semibold">{doc.consultations}</span> consultations
              </p>
              <select
                value={doc.department_id ?? ""}
                onChange={(e) => void reassign(doc.id, e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {data!.departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
