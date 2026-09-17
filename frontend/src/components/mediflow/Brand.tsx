import { Activity } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
        <Activity className="size-5" strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-bold tracking-tight">MediFlow</span>
          <span className="text-[11px] font-medium text-muted-foreground">Patient Flow OS</span>
        </span>
      )}
    </span>
  );
}
