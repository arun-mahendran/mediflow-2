import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { patientNav } from "@/components/mediflow/navs";
import { useAuth } from "@/hooks/useAuth";
import { patientApi } from "@/services/api";

export default function ProfilePage() {
  const auth = useAuth();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["patient-profile", auth.patientId],
    enabled: Boolean(auth.patientId),
    queryFn: () => patientApi.getMe(),
  });

  useEffect(() => {
    setName(auth.name);
  }, [auth.name]);

  useEffect(() => {
    if (!data) return;
    setAge(data.age?.toString() ?? "");
    setGender(data.gender ?? "");
    setPhone(data.phone ?? "");
  }, [data]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!auth.userId || !auth.patientId) return;
    setSaving(true);
    try {
      await patientApi.updateMe({
        name,
        age: age ? Number(age) : null,
        gender: gender || null,
        phone: phone || null,
      });
      await auth.refresh();
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout nav={patientNav} roleLabel="Patient" title="Profile" subtitle="Your personal details">
      <form onSubmit={save} className="panel max-w-xl space-y-4 p-6">
        <Input label="Full name" value={name} onChange={setName} />
        <Input label="Email" value={auth.email} onChange={() => {}} disabled />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Age" value={age} onChange={setAge} type="number" />
          <Input label="Gender" value={gender} onChange={setGender} />
        </div>
        <Input label="Phone" value={phone} onChange={setPhone} />
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

function Input({
  label,
  value,
  onChange,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
      />
    </label>
  );
}
