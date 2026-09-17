import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Loader2, PhoneCall, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { UrgencyBadge } from "@/components/mediflow/Badges";
import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { doctorNav } from "@/components/mediflow/navs";
import { ConsultLink, QueueTable } from "@/components/mediflow/QueueTable";
import { StatCard } from "@/components/mediflow/StatCard";
import { EmptyState, LoadingPanel } from "@/components/mediflow/States";
import { useRequireRole } from "@/hooks/useAuth";
import { useDoctorData } from "@/lib/doctor-data";
import { waitingMinutes, type Availability } from "@/lib/mediflow";
import { callNextPatient } from "@/lib/queue-service";
import { doctorApi } from "@/services/api";

export function AvailabilityToggle({
  doctorId,
  value,
  onChanged,
}: {
  doctorId: string;
  value: Availability;
  onChanged: () => void;
}) {
  const options: Availability[] = ["AVAILABLE", "BUSY", "OFFLINE"];
  return (
    <div className="flex rounded-lg border border-border bg-card p-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={async () => {
            try {
              await doctorApi.setAvailability(option);
              toast.success(`You are now ${option.toLowerCase()}.`);
              onChanged();
            } catch {
              toast.error("Could not update availability.");
            }
          }}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
            value === option
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.toLowerCase()}
        </button>
      ))}
    </div>
  );
}

export default function DoctorDashboard() {
  const auth = useRequireRole("DOCTOR");
  const queryClient = useQueryClient();
  const { data, isLoading } = useDoctorData(auth.doctorId);
  const [calling, setCalling] = useState(false);

  async function handleCallNext() {
    if (!auth.doctorId) return;
    setCalling(true);
    try {
      const next = await callNextPatient();
      if (!next) toast.info("No patients are waiting right now.");
      else toast.success(`Called ${next.queue_number}.`);
      await queryClient.invalidateQueries({ queryKey: ["doctor-data"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not call the next patient.");
    } finally {
      setCalling(false);
    }
  }

  if (!auth.doctorId && !auth.loading) {
    return (
      <DashboardLayout nav={doctorNav} roleLabel="Doctor" title="Doctor workspace">
        <EmptyState
          icon={Users}
          title="No doctor record linked"
          description="An administrator needs to add you as a doctor before your queue becomes available."
        />
      </DashboardLayout>
    );
  }

  const active = data?.active;
  const activePatient = data?.patients.find((p) => p.id === active?.patient_id);
  const activePatientName = activePatient
    ? data?.profiles.find((pr) => pr.id === activePatient.user_id)?.name
    : undefined;
  const emergencyCount = (data?.waiting ?? []).filter((q) => q.urgency === "EMERGENCY").length;

  return (
    <DashboardLayout
      nav={doctorNav}
      roleLabel="Doctor"
      title={`Dr. ${auth.name || ""}`.trim()}
      subtitle={data?.doctor?.specialization ?? "Clinical workspace"}
      actions={
        data?.doctor && (
          <AvailabilityToggle
            doctorId={data.doctor.id}
            value={data.doctor.availability as Availability}
            onChanged={() => void queryClient.invalidateQueries({ queryKey: ["doctor-data"] })}
          />
        )
      }
    >
      {isLoading ? (
        <LoadingPanel label="Loading your queue…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Today's Patients" value={data?.mine.length ?? 0} icon={Users} />
            <StatCard label="Waiting" value={data?.waiting.length ?? 0} icon={Clock} />
            <StatCard
              label="Completed"
              value={data?.completedToday.length ?? 0}
              icon={CheckCircle2}
              tone="low"
            />
            <StatCard
              label="Emergency Cases"
              value={emergencyCount}
              hint={`Avg wait ${data?.avgWait ?? 0} min`}
              icon={AlertTriangle}
              tone={emergencyCount > 0 ? "emergency" : "default"}
            />
          </div>

          <div className="panel space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Current patient</h2>
              <button
                onClick={() => void handleCallNext()}
                disabled={calling || Boolean(active)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {calling ? <Loader2 className="size-4 animate-spin" /> : <PhoneCall className="size-4" />}
                Call Next Patient
              </button>
            </div>

            {!active ? (
              <p className="text-sm text-muted-foreground">
                No patient assigned. Call the next patient to start.
              </p>
            ) : (
              <div className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-4">
                <Info
                  label="Patient"
                  value={
                    <span className="flex items-baseline gap-2">
                      <span className="font-bold tabular-nums">{active.queue_number}</span>
                      {activePatientName && (
                        <span className="font-medium normal-case text-muted-foreground">
                          {activePatientName}
                        </span>
                      )}
                    </span>
                  }
                />
                <Info label="Age" value={activePatient?.age?.toString() ?? "—"} />
                <Info label="Gender" value={activePatient?.gender ?? "—"} />
                <Info label="Waiting" value={`${waitingMinutes(active.created_at)} min`} />
                <div className="sm:col-span-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Symptoms
                  </p>
                  <p className="mt-1 text-sm">{active.symptoms}</p>
                </div>
                <div className="flex flex-col items-start gap-3">
                  <UrgencyBadge urgency={active.urgency} />
                  <ConsultLink queueId={active.id} label="Start Consultation" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Prioritized queue</h2>
              <Link to="/doctor/queue" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            {(data?.waiting.length ?? 0) === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Queue is clear"
                description="No patients are waiting. New arrivals appear here automatically, ordered by priority."
              />
            ) : (
              <QueueTable rows={(data?.waiting ?? []).slice(0, 6)} />
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
