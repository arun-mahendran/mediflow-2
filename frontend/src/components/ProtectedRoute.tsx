import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { LoadingPanel } from "@/components/mediflow/States";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/lib/mediflow";

export function ProtectedRoute({ role, children }: { role: AppRole; children: ReactNode }) {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <LoadingPanel label="Loading your workspace…" />
      </div>
    );
  }

  if (!auth.userId || (auth.role && auth.role !== role)) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
