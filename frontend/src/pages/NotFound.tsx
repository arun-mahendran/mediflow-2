import { Link } from "react-router-dom";
import { Home } from "lucide-react";

import { Brand } from "@/components/mediflow/Brand";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <Brand />
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold">404</h1>
        <p className="text-muted-foreground">This page does not exist.</p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Home className="size-4" />
        Back to home
      </Link>
    </div>
  );
}
