import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, ClipboardList, Clock, Hash, ListOrdered, Stethoscope } from "lucide-react";

import { UrgencyBadge } from "@/components/mediflow/Badges";
import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { patientNav } from "@/components/mediflow/navs";
import { EmptyState, LoadingPanel } from "@/components/mediflow/States";
import { useAuth } from "@/hooks/useAuth";
import { queueApi } from "@/services/api";
import {
  AI_DISCLAIMER,
  STATUS_TIMELINE,
  estimatedWaitMinutes,
  priorityScore,
  type QueueStatus,
} from "@/lib/mediflow";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Presentation-only styles (scoped to .pd-root)                       */
/* ------------------------------------------------------------------ */

const styles = `
@keyframes pdRise{ from{ opacity:0; transform:translateY(14px); } to{ opacity:1; transform:translateY(0); } }
@keyframes pdFade{ from{ opacity:0; } to{ opacity:1; } }
@keyframes pdPulse{ 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:.35; transform:scale(.8); } }
@keyframes pdHalo{ 0%{ box-shadow:0 0 0 0 currentColor; opacity:.5; } 70%{ box-shadow:0 0 0 9px currentColor; opacity:0; } 100%{ box-shadow:0 0 0 0 currentColor; opacity:0; } }
@keyframes pdGrow{ from{ transform:scaleY(0); } to{ transform:scaleY(1); } }
@keyframes pdSweep{ from{ stroke-dashoffset:var(--pd-circ); } to{ stroke-dashoffset:var(--pd-offset); } }
@keyframes pdShimmer{ from{ background-position:-160% 0; } to{ background-position:260% 0; } }

.pd-root .pd-rise{
  opacity:0;
  animation:pdRise .55s cubic-bezier(.16,1,.3,1) forwards;
}

/* metric cards */
.pd-root .pd-card{
  position:relative;
  overflow:hidden;
  transition:transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease;
}
.pd-root .pd-card:hover{ transform:translateY(-3px); }
.pd-root .pd-card::before{
  content:"";
  position:absolute;
  inset:0 auto 0 0;
  width:3px;
  background:currentColor;
  opacity:.5;
  transform:scaleY(0);
  transform-origin:top;
  animation:pdGrow .5s cubic-bezier(.16,1,.3,1) .25s forwards;
}
.pd-root .pd-card-value{
  font-variant-numeric:tabular-nums;
  letter-spacing:-0.02em;
}

/* icon chip */
.pd-root .pd-chip{
  transition:transform .3s cubic-bezier(.16,1,.3,1);
}
.pd-root .pd-card:hover .pd-chip{ transform:scale(1.08) rotate(-4deg); }

/* live indicator */
.pd-root .pd-live-dot{ animation:pdPulse 2s ease-in-out infinite; }

/* ETA ring */
.pd-root .pd-ring-track{ opacity:.14; }
.pd-root .pd-ring-fill{
  stroke-dasharray:var(--pd-circ);
  stroke-dashoffset:var(--pd-circ);
  animation:pdSweep 1.1s cubic-bezier(.16,1,.3,1) .35s forwards;
}

/* timeline */
.pd-root .pd-node{ position:relative; }
.pd-root .pd-node-current::after{
  content:"";
  position:absolute;
  inset:0;
  border-radius:9999px;
  animation:pdHalo 2.2s ease-out infinite;
}
.pd-root .pd-connector{
  transform-origin:top;
  animation:pdGrow .45s cubic-bezier(.16,1,.3,1) forwards;
}
.pd-root .pd-stage{ opacity:0; animation:pdFade .45s ease forwards; }

/* symptom / ai note blocks */
.pd-root .pd-note{
  transition:border-color .25s ease, background .25s ease;
}
.pd-root .pd-note:hover{ border-color:currentColor; }

/* shimmering top accent on the hero panel */
.pd-root .pd-accent-line{
  background-image:linear-gradient(90deg, transparent 0%, currentColor 45%, transparent 90%);
  background-size:200% 100%;
  animation:pdShimmer 4.5s linear infinite;
  opacity:.45;
}

@media (prefers-reduced-motion:reduce){
  .pd-root *, .pd-root *::before, .pd-root *::after{
    animation:none !important;
    transition:none !important;
  }
  .pd-root .pd-rise, .pd-root .pd-stage{ opacity:1; transform:none; }
  .pd-root .pd-card::before, .pd-root .pd-connector{ transform:scaleY(1); }
  .pd-root .pd-ring-fill{ stroke-dashoffset:var(--pd-offset); }
}
`;

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
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md active:translate-y-0"
        >
          Join Queue
        </Link>
      }
    >
      <div className="pd-root space-y-4">
        <style>{styles}</style>

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
                className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90"
              >
                Start symptom check
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Your Queue Number"
                value={current.queue_number}
                icon={Hash}
                delay={0}
              />
              <MetricCard
                label="Position"
                value={position}
                hint="in the optimized queue"
                icon={ListOrdered}
                delay={0.08}
              />
              <EtaCard minutes={eta} doctors={availableDoctors} delay={0.16} />
              <MetricCard label="Department" value={department} icon={Stethoscope} delay={0.24} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div
                className="panel pd-rise relative overflow-hidden lg:col-span-2"
                style={{ animationDelay: "0.3s" }}
              >
                <span className="pd-accent-line absolute inset-x-0 top-0 h-px text-primary" />

                <div className="space-y-4 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-semibold">Status timeline</h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        <span className="pd-live-dot size-1.5 rounded-full bg-primary" />
                        Live
                      </span>
                    </div>
                    <UrgencyBadge urgency={current.urgency} />
                  </div>

                  <Timeline status={current.status} />

                  <p className="border-t border-dashed border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                    {AI_DISCLAIMER}
                  </p>
                </div>
              </div>

              <div className="panel pd-rise space-y-3 p-6" style={{ animationDelay: "0.38s" }}>
                <h2 className="text-lg font-semibold">Your submission</h2>

                <Detail label="Estimated wait" value={`${eta} min`} />
                <Detail label="Urgency" value={current.urgency} />
                <Detail
                  label="Priority score"
                  value={priorityScore(current.urgency, current.created_at).toString()}
                />

                <div className="pd-note rounded-xl border border-border bg-muted/30 p-3 text-primary">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Symptoms
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground">{current.symptoms}</p>
                </div>

                {current.ai_reason && (
                  <div className="pd-note rounded-xl border border-border bg-muted/30 p-3 text-primary">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      AI note
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {current.ai_reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  Presentation components                                             */
/* ------------------------------------------------------------------ */

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  delay,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
  delay: number;
  tone?: "primary" | "high" | "low";
}) {
  const toneClass =
    tone === "high" ? "text-emergency" : tone === "low" ? "text-low" : "text-primary";

  return (
    <div
      className={cn("panel pd-rise pd-card p-5", toneClass)}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="pd-chip grid size-9 shrink-0 place-items-center rounded-xl bg-current/10">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="pd-card-value mt-3 text-3xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EtaCard({
  minutes,
  doctors,
  delay,
}: {
  minutes: number;
  doctors: number;
  delay: number;
}) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  // display-only: how full the ring looks, capped at a 60-minute window
  const fraction = Math.max(0, Math.min(1, minutes / 60));
  const offset = circumference - circumference * fraction;
  const toneClass = minutes > 30 ? "text-emergency" : "text-low";

  return (
    <div
      className={cn("panel pd-rise pd-card p-5", toneClass)}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Estimated Waiting Time
          </p>
          <p className="pd-card-value mt-3 text-3xl font-bold text-foreground">{minutes} min</p>
          <p className="mt-1 text-xs text-muted-foreground">{doctors} doctor(s) available</p>
        </div>

        <div className="relative grid size-16 shrink-0 place-items-center">
          <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
            <circle
              className="pd-ring-track"
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
            />
            <circle
              className="pd-ring-fill"
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              style={
                {
                  "--pd-circ": circumference,
                  "--pd-offset": offset,
                } as React.CSSProperties
              }
            />
          </svg>
          <Clock className="absolute size-5" />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
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
          <li
            key={stage}
            className="pd-stage flex gap-3"
            style={{ animationDelay: `${0.35 + index * 0.07}s` }}
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "pd-node grid size-7 place-items-center rounded-full border text-xs font-semibold transition-colors duration-300",
                  current
                    ? "pd-node-current border-primary bg-primary text-primary-foreground"
                    : done
                      ? "border-low bg-low-soft text-low"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {done && !current ? <Check className="size-3.5" /> : index + 1}
              </span>
              {index < stages.length - 1 && (
                <span
                  className={cn("pd-connector w-px flex-1", done ? "bg-low/40" : "bg-border")}
                  style={{ animationDelay: `${0.4 + index * 0.07}s` }}
                />
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