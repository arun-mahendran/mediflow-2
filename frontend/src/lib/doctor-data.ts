import { useQuery } from "@tanstack/react-query";

import { doctorApi } from "@/services/api";
import { withLivePriority, type QueueRow } from "./queue-service";

/** All data the doctor workspace needs, refreshed on a short interval. */
export function useDoctorData(doctorId: string | null) {
  return useQuery({
    queryKey: ["doctor-data", doctorId],
    enabled: Boolean(doctorId),
    refetchInterval: 8000,
    queryFn: async () => {
      const { doctor, departments, patients, profiles, queue: queueRaw } = await doctorApi.dashboard();
      const queue = queueRaw as QueueRow[];

      const patientName = (patientId: string) => {
        const patient = patients.find((p) => p.id === patientId);
        return patient ? profiles.find((pr) => pr.id === patient.user_id)?.name : undefined;
      };
      const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name;

      const waiting = withLivePriority(queue.filter((q) => q.status === "WAITING")).map((q) => ({
        ...q,
        department: deptName(q.department_id),
        patientName: patientName(q.patient_id),
      }));
      const active = queue.find(
        (q) => q.doctor_id === doctorId && (q.status === "CALLED" || q.status === "IN_CONSULTATION"),
      );
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const mine = queue.filter((q) => q.doctor_id === doctorId);
      const completedToday = mine.filter(
        (q) => q.status === "COMPLETED" && q.completed_at && new Date(q.completed_at) >= todayStart,
      );
      const waitTimes = completedToday
        .filter((q) => q.called_at)
        .map((q) => (new Date(q.called_at!).getTime() - new Date(q.created_at).getTime()) / 60000);

      return {
        doctor,
        departments,
        patients,
        profiles,
        queue,
        waiting,
        active,
        mine,
        completedToday,
        avgWait: waitTimes.length
          ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
          : 0,
      };
    },
  });
}
