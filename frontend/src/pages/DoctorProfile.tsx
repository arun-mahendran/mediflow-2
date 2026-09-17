import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { doctorNav } from "@/components/mediflow/navs";
import { useRequireRole } from "@/hooks/useAuth";
import { useDoctorData } from "@/lib/doctor-data";
import type { Availability } from "@/lib/mediflow";
import { doctorApi } from "@/services/api";
import { AvailabilityToggle } from "./DoctorDashboard";

export default function DoctorProfile() {
  const auth = useRequireRole("DOCTOR");
  const queryClient = useQueryClient();
  const { data } = useDoctorData(auth.doctorId);
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setName(auth.name), [auth.name]);
  useEffect(() => {
    if (!data?.doctor) return;
    setSpecialization(data.doctor.specialization);
    setDepartmentId(data.doctor.department_id ?? "");
  }, [data?.doctor]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!auth.userId || !auth.doctorId) return;
    setSaving(true);
    try {
      await doctorApi.updateProfile({
        name,
        specialization,
        departmentId: departmentId || null,
      });
      await auth.refresh();
      await queryClient.invalidateQueries({ queryKey: ["doctor-data"] });
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout nav={doctorNav} roleLabel="Doctor" title="Profile" subtitle="Your clinical details">
      <form onSubmit={save} className="panel max-w-xl space-y-4 p-6">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Full name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Specialization</span>
          <input
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Department</span>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Unassigned</option>
            {(data?.departments ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        {data?.doctor && (
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Availability</span>
            <AvailabilityToggle
              doctorId={data.doctor.id}
              value={data.doctor.availability as Availability}
              onChanged={() => void queryClient.invalidateQueries({ queryKey: ["doctor-data"] })}
            />
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </button>
      </form>
    </DashboardLayout>
  );
}
