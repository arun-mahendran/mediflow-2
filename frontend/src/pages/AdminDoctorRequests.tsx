import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { adminNav } from "@/components/mediflow/navs";
import { EmptyState, SkeletonRows } from "@/components/mediflow/States";
import { useRequireRole } from "@/hooks/useAuth";
import { adminApi, departmentApi } from "@/services/api";

const statusTone: Record<string, string> = {
  PENDING: "bg-medium-soft text-medium",
  APPROVED: "bg-low-soft text-low",
  REJECTED: "bg-high-soft text-high",
};

export default function AdminDoctorRequests() {
  useRequireRole("ADMIN");
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-applications"],
    refetchInterval: 15000,
    queryFn: async () => {
      const [applications, departments] = await Promise.all([
        adminApi.pendingDoctors(),
        departmentApi.list(),
      ]);
      const deptName = new Map(departments.map((d) => [d.id, d.name]));
      return applications.map((row) => ({
        ...row,
        departmentName: row.department_id ? (deptName.get(row.department_id) ?? "—") : "—",
      }));
    },
  });

  const mutation = useMutation({
    mutationFn: (input: { applicationId: string; decision: "APPROVED" | "REJECTED"; note: string }) =>
      input.decision === "APPROVED"
        ? adminApi.approveDoctor(input.applicationId, input.note)
        : (adminApi.rejectDoctor(input.applicationId, input.note) as unknown as Promise<{ ok: true; status: "APPROVED" }>),
    onSuccess: async (_res, input) => {
      toast.success(input.decision === "APPROVED" ? "Doctor approved." : "Request declined.");
      await queryClient.invalidateQueries({ queryKey: ["doctor-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update the request."),
  });

  const pending = (data ?? []).filter((row) => row.status === "PENDING");

  return (
    <DashboardLayout
      nav={adminNav}
      roleLabel="Administrator"
      title="Doctor Requests"
      subtitle={`${pending.length} request${pending.length === 1 ? "" : "s"} waiting for approval`}
    >
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No doctor requests"
          description="Requests appear here when someone registers as a doctor."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data!.map((row) => (
            <div key={row.id} className="panel space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Dr. {row.full_name || row.email}</p>
                  <p className="text-sm text-muted-foreground">{row.specialization}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    statusTone[row.status] ?? ""
                  }`}
                >
                  {row.status.toLowerCase()}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-sm">
                <Info label="Email" value={row.email} />
                <Info label="Department" value={row.departmentName} />
                <Info label="License" value={row.license_number || "—"} />
                <Info label="Requested" value={new Date(row.created_at).toLocaleDateString()} />
              </dl>

              {row.status === "PENDING" ? (
                <div className="space-y-2">
                  <input
                    value={notes[row.id] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    placeholder="Optional note for the applicant"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({
                          applicationId: row.id,
                          decision: "APPROVED",
                          note: notes[row.id] ?? "",
                        })
                      }
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({
                          applicationId: row.id,
                          decision: "REJECTED",
                          note: notes[row.id] ?? "",
                        })
                      }
                      className="flex-1 rounded-lg border border-input px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ) : row.review_note ? (
                <p className="text-xs text-muted-foreground">Note: {row.review_note}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
