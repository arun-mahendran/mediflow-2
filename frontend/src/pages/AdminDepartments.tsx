import { Building2 } from "lucide-react";

import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { adminNav } from "@/components/mediflow/navs";
import { EmptyState, SkeletonRows } from "@/components/mediflow/States";
import { useRequireRole } from "@/hooks/useAuth";
import { useAdminData } from "@/lib/admin-data";

export default function AdminDepartments() {
  useRequireRole("ADMIN");
  const { data, isLoading } = useAdminData();

  return (
    <DashboardLayout
      nav={adminNav}
      roleLabel="Administrator"
      title="Departments"
      subtitle="Where patients are being routed"
    >
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : (data?.departments.length ?? 0) === 0 ? (
        <EmptyState icon={Building2} title="No departments" description="Add departments to route patients." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data!.departments.map((dept) => (
            <div key={dept.id} className="panel space-y-3 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{dept.name}</p>
                  <p className="text-xs text-muted-foreground">{dept.doctors} doctors</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{dept.description}</p>
              <div className="rounded-lg bg-surface px-3 py-2 text-sm">
                <span className="font-semibold">{dept.waiting}</span> patients waiting
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
