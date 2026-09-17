import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/services/api";
import { withLivePriority, type QueueRow } from "./queue-service";

export function useAdminData() {
  return useQuery({
    queryKey: ["admin-data"],
    refetchInterval: 15000,
    queryFn: async () => {
      const {
        queue: queueRaw,
        doctors,
        departments,
        profiles,
        consultations,
        patients,
      } = await adminApi.dashboard();
      const queue = queueRaw as QueueRow[];

      const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name;
      const patientName = (patientId: string) => {
        const patient = patients.find((p) => p.id === patientId);
        return patient ? profiles.find((pr) => pr.id === patient.user_id)?.name : undefined;
      };

      const waiting = withLivePriority(queue.filter((q) => q.status === "WAITING")).map((q) => ({
        ...q,
        department: deptName(q.department_id),
        patientName: patientName(q.patient_id),
        doctor: profiles.find(
          (p) => p.id === doctors.find((d) => d.id === q.doctor_id)?.user_id,
        )?.name,
      }));

      const completed = queue.filter((q) => q.status === "COMPLETED" && q.called_at);
      const avgWait = completed.length
        ? Math.round(
            completed.reduce(
              (sum, q) =>
                sum + (new Date(q.called_at!).getTime() - new Date(q.created_at).getTime()) / 60000,
              0,
            ) / completed.length,
          )
        : 0;

      const byUrgency = (["EMERGENCY", "HIGH", "MEDIUM", "LOW"] as const).map((urgency) => ({
        name: urgency.charAt(0) + urgency.slice(1).toLowerCase(),
        value: queue.filter((q) => q.urgency === urgency).length,
      }));

      const byDepartment = departments.map((dept) => ({
        name: dept.name,
        patients: queue.filter((q) => q.department_id === dept.id).length,
      }));

      const hours = Array.from({ length: 12 }, (_, index) => {
        const slot = new Date();
        slot.setMinutes(0, 0, 0);
        slot.setHours(slot.getHours() - (11 - index));
        const next = new Date(slot.getTime() + 3600_000);
        return {
          name: `${slot.getHours()}:00`,
          patients: queue.filter((q) => {
            const created = new Date(q.created_at);
            return created >= slot && created < next;
          }).length,
        };
      });

      return {
        queue,
        waiting,
        doctors: doctors.map((doc) => ({
          ...doc,
          name: profiles.find((p) => p.id === doc.user_id)?.name ?? "Doctor",
          email: profiles.find((p) => p.id === doc.user_id)?.email ?? "",
          department: deptName(doc.department_id) ?? "Unassigned",
          consultations: consultations.filter((c) => c.doctor_id === doc.id).length,
        })),
        departments: departments.map((dept) => ({
          ...dept,
          doctors: doctors.filter((d) => d.department_id === dept.id).length,
          waiting: queue.filter((q) => q.department_id === dept.id && q.status === "WAITING").length,
        })),
        totals: {
          patients: queue.length,
          waiting: queue.filter((q) => q.status === "WAITING").length,
          completed: completed.length,
          emergencies: queue.filter((q) => q.urgency === "EMERGENCY").length,
          activeDoctors: doctors.filter((d) => d.availability !== "OFFLINE").length,
          avgWait,
        },
        charts: { byUrgency, byDepartment, hours },
      };
    },
  });
}
