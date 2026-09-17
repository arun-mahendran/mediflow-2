import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Brain, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { UrgencyBadge } from "@/components/mediflow/Badges";
import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { patientNav } from "@/components/mediflow/navs";
import { useAuth } from "@/hooks/useAuth";
import { AI_DISCLAIMER } from "@/lib/mediflow";
import { aiApi, departmentApi, queueApi, type TriageResult } from "@/services/api";

export default function JoinQueuePage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Female");
  const [symptoms, setSymptoms] = useState("");
  const [preferred, setPreferred] = useState("");
  const [assessing, setAssessing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentApi.list(),
  });

  async function handleAnalyze(event: React.FormEvent) {
    event.preventDefault();
    setAssessing(true);
    setResult(null);
    try {
      const assessment = await aiApi.analyzeSymptoms({ symptoms, age: Number(age), gender });
      setResult(assessment);
      if (assessment.source === "fallback") {
        toast.warning("AI service unavailable — using the safe rule-based assessment.");
      } else {
        toast.success("AI assessment complete.");
      }
    } catch {
      toast.error("AI assessment failed. Please try again.");
    } finally {
      setAssessing(false);
    }
  }

  async function handleJoin() {
    if (!result || !auth.patientId) return;
    setJoining(true);
    try {
      const chosen = preferred || result.department;
      const departmentId = departments.find((d) => d.name === chosen)?.id ?? null;

      await queueApi.join({
        patientId: auth.patientId,
        departmentId,
        symptoms,
        urgency: result.urgency,
        reason: result.reason,
      });
      toast.success("Patient successfully added to queue.");
      navigate("/patient/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join the queue.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <DashboardLayout
      nav={patientNav}
      roleLabel="Patient"
      title="Join the queue"
      subtitle="Describe what you are experiencing — MediFlow does the rest"
    >
      <div className="grid gap-4 lg:grid-cols-5">
        <form onSubmit={handleAnalyze} className="panel space-y-5 p-6 lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Age</span>
              <input
                required
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="34"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Gender</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Symptoms</span>
            <textarea
              required
              minLength={5}
              rows={7}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Describe your symptoms, duration, severity, and any important details."
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              Preferred department <span className="text-muted-foreground">(optional)</span>
            </span>
            <select
              value={preferred}
              onChange={(e) => setPreferred(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Let MediFlow decide</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={assessing}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {assessing ? <Loader2 className="size-4 animate-spin" /> : <Brain className="size-4" />}
            {assessing ? "Assessing symptoms…" : "Run AI assessment"}
          </button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          <div className="panel p-6">
            <h2 className="text-lg font-semibold">AI assessment result</h2>
            {assessing ? (
              <div className="mt-6 space-y-3">
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ) : !result ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Submit your symptoms to receive an urgency level and a recommended department.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Urgency</span>
                  <UrgencyBadge urgency={result.urgency} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recommended department</span>
                  <span className="text-sm font-semibold">{result.department}</span>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Reason
                  </p>
                  <p className="mt-1 text-sm">{result.reason}</p>
                </div>
                <button
                  onClick={() => void handleJoin()}
                  disabled={joining}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {joining && <Loader2 className="size-4 animate-spin" />}
                  Join Queue
                </button>
              </div>
            )}
          </div>

          <div className="panel flex gap-3 border-medium/30 bg-medium-soft p-4 text-xs text-medium-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>{AI_DISCLAIMER}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
