import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { StatusBadge, UrgencyBadge } from "@/components/mediflow/Badges";
import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { doctorNav } from "@/components/mediflow/navs";
import { ErrorState, LoadingPanel } from "@/components/mediflow/States";
import { useRequireRole } from "@/hooks/useAuth";
import { AI_DISCLAIMER, waitingMinutes } from "@/lib/mediflow";
import { completeConsultation, startConsultation } from "@/lib/queue-service";
import { doctorApi } from "@/services/api";

export default function DoctorConsultation() {
  const auth = useRequireRole("DOCTOR");
  const { queueId } = useParams<{ queueId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["consultation", queueId],
    enabled: Boolean(queueId),
    queryFn: async () => {
      const rows = await doctorApi.queue();
      const entry = rows.find((r) => r.id === queueId);
      if (!entry) throw new Error("Queue entry not found.");
      return {
        entry,
        patient: {
          age: entry.patientAge ?? null,
          gender: entry.patientGender ?? null,
        },
        department: entry.department ?? "—",
        consult: entry.consult ?? null,
      };
    },
  });

  useEffect(() => {
    if (!data?.consult) return;
    setNotes(data.consult.notes);
    setDiagnosis(data.consult.diagnosis);
    setPrescription(data.consult.prescription);
  }, [data?.consult]);

  async function handleStart() {
    if (!data || !auth.doctorId) return;
    setBusy(true);
    try {
      await startConsultation(data.entry, auth.doctorId);
      toast.success("Consultation started.");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the consultation.");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!data || !auth.doctorId || !queueId) return;
    if (!diagnosis.trim()) {
      toast.error("Please add a diagnosis before completing.");
      return;
    }
    setBusy(true);
    try {
      if (!data.consult) {
        toast.error("Consultation record not found.");
        return;
      }

      await completeConsultation({
        consultationId: data.consult.id,
        doctorId: auth.doctorId,
        notes,
        diagnosis,
        prescription,
      });
      toast.success("Consultation completed.");
      await queryClient.invalidateQueries({ queryKey: ["doctor-data"] });
      navigate("/doctor/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete the consultation.");
    } finally {
      setBusy(false);
    }
  }

  const started = data?.entry.status === "IN_CONSULTATION";

  return (
    <DashboardLayout
      nav={doctorNav}
      roleLabel="Doctor"
      title="Consultation"
      subtitle={data?.entry.queue_number}
    >
      {isLoading ? (
        <LoadingPanel label="Loading patient record…" />
      ) : error || !data ? (
        <ErrorState message="This patient record could not be loaded." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="panel space-y-4 p-6 lg:col-span-2">
            <div className="flex items-center gap-2">
              <UrgencyBadge urgency={data.entry.urgency} />
              <StatusBadge status={data.entry.status} />
            </div>
            <Info label="Patient ID" value={data.entry.queue_number} />
            <Info label="Age" value={data.patient?.age?.toString() ?? "—"} />
            <Info label="Gender" value={data.patient?.gender ?? "—"} />
            <Info label="Department" value={data.department} />
            <Info label="Waiting time" value={`${waitingMinutes(data.entry.created_at)} min`} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Symptoms
              </p>
              <p className="mt-1 text-sm">{data.entry.symptoms}</p>
            </div>
            {data.entry.ai_reason && (
              <div className="rounded-lg bg-surface p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  AI urgency note
                </p>
                <p className="mt-1 text-sm">{data.entry.ai_reason}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{AI_DISCLAIMER}</p>
              </div>
            )}
          </div>

          <div className="panel space-y-4 p-6 lg:col-span-3">
            <h2 className="text-lg font-semibold">Clinical record</h2>
            <Textarea label="Clinical Notes" value={notes} onChange={setNotes} rows={5} />
            <Textarea label="Diagnosis" value={diagnosis} onChange={setDiagnosis} rows={3} />
            <Textarea label="Prescription" value={prescription} onChange={setPrescription} rows={3} />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void handleStart()}
                disabled={busy || started || data.entry.status === "COMPLETED"}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                Start Consultation
              </button>
              <button
                onClick={() => void handleComplete()}
                disabled={busy || !started}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Complete Consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
