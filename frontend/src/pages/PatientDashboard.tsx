import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, ClipboardList, Clock, Hash, ListOrdered, Stethoscope } from "lucide-react";

import { UrgencyBadge } from "@/components/mediflow/Badges";
import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { patientNav } from "@/components/mediflow/navs";
import { StatCard } from "@/components/mediflow/StatCard";
import { EmptyState, LoadingPanel } from "@/components/mediflow/States";
import { useAuth } from "@/hooks/useAuth";
import { queueApi } from "@/services/api";
import {
  AI_DISCLAIMER,
  STATUS_TIMELINE,
  estimatedWaitMinutes,
  priorityScore,
  waitingMinutes,
  type QueueStatus,
} from "@/lib/mediflow";
import { cn } from "@/lib/utils";

export default function PatientDashboard() {
  const auth = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["patient-dashboard", auth.patientId],
    enabled: Boolean(auth.patientId),
    refetchInterval: 8000,
    queryFn: () => queueApi.myStatus(),
  });

  const current = data?.current;
  const now = Date.now();
  const position = current
    ? (data?.waiting ?? []).filter(
        (row) =>
          priorityScore(row.urgency, row.created_at, now) >
          priorityScore(current.urgency, current.created_at, now),
      ).length + 1
    : 0;
  const availableDoctors = (data?.doctors ?? []).filter((d) => d.availability === "AVAILABLE").length;
  const department = data?.departments.find((d) => d.id === current?.department_id)?.name ?? "—";
  const eta = current ? estimatedWaitMinutes(position - 1, availableDoctors) : 0;

  return (
    <DashboardLayout
      nav={patientNav}
      roleLabel="Patient"
      title={`Hello, ${auth.name || "there"}`}
      subtitle="Your live position in the hospital queue"
      actions={
        <Link
          to="/patient/join"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Join Queue
        </Link>
      }
    >
      {isLoading ? (
        <LoadingPanel label="Loading your queue status…" />
      ) : !current ? (
        <EmptyState
          icon={ClipboardList}
          title="You are not in the queue"
          description="Describe your symptoms and MediFlow will recommend an urgency level and department, then place you in the optimized queue."
          action={
            <Link
              to="/patient/join"
              className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Start symptom check
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Your Queue Number" value={current.queue_number} icon={Hash} />
            <StatCard label="Position" value={position} hint="in the optimized queue" icon={ListOrdered} />
            <StatCard
              label="Estimated Waiting Time"
              value={`${eta} min`}
              hint={`${availableDoctors} doctor(s) available`}
              icon={Clock}
              tone={eta > 30 ? "high" : "low"}
            />
            <StatCard label="Department" value={department} icon={Stethoscope} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="panel space-y-4 p-6 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Status timeline</h2>
                <UrgencyBadge urgency={current.urgency} />
              </div>
              <Timeline status={current.status} />
              <p className="text-xs text-muted-foreground">{AI_DISCLAIMER}</p>
            </div>

            <div className="panel space-y-3 p-6">
              <h2 className="text-lg font-semibold">Your submission</h2>
              <Detail label="Waiting for" value={`${waitingMinutes(current.created_at)} min`} />
              <Detail label="Urgency" value={current.urgency} />
              <Detail label="Priority score" value={priorityScore(current.urgency, current.created_at).toString()} />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Symptoms
                </p>
                <p className="mt-1 text-sm">{current.symptoms}</p>
              </div>
              {current.ai_reason && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    AI note
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{current.ai_reason}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

const timelineLabels: Record<string, string> = {
  WAITING: "Waiting",
  CALLED: "Doctor called",
  IN_CONSULTATION: "Consultation",
  COMPLETED: "Completed",
};

function Timeline({ status }: { status: QueueStatus }) {
  const activeIndex = STATUS_TIMELINE.indexOf(status);
  const stages = ["Registered", "AI Assessment", ...STATUS_TIMELINE.map((s) => timelineLabels[s])];
  const reached = activeIndex + 2;

  return (
    <ol className="space-y-0">
      {stages.map((stage, index) => {
        const done = index <= reached;
        const current = index === reached;
        return (
          <li key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full border text-xs font-semibold transition-colors",
                  current
                    ? "border-primary bg-primary text-primary-foreground"
                    : done
                      ? "border-low bg-low-soft text-low"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {done && !current ? <Check className="size-3.5" /> : index + 1}
              </span>
              {index < stages.length - 1 && (
                <span className={cn("w-px flex-1", done ? "bg-low/40" : "bg-border")} />
              )}
            </div>
            <div className="pb-5">
              <p className={cn("text-sm font-medium", !done && "text-muted-foreground")}>{stage}</p>
              {current && <p className="text-xs text-primary">Current stage</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
