import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardLayout } from "@/components/mediflow/DashboardLayout";
import { adminNav } from "@/components/mediflow/navs";
import { LoadingPanel } from "@/components/mediflow/States";
import { useRequireRole } from "@/hooks/useAuth";
import { useAdminData } from "@/lib/admin-data";

const URGENCY_COLORS = [
  "var(--color-emergency)",
  "var(--color-high)",
  "var(--color-medium)",
  "var(--color-low)",
];

export default function AdminAnalytics() {
  useRequireRole("ADMIN");
  const { data, isLoading } = useAdminData();

  return (
    <DashboardLayout
      nav={adminNav}
      roleLabel="Administrator"
      title="Analytics"
      subtitle="How patients are flowing through the hospital"
    >
      {isLoading ? (
        <LoadingPanel label="Crunching the numbers…" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Patients per hour (last 12h)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data!.charts.hours}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Urgency distribution">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data!.charts.byUrgency}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {data!.charts.byUrgency.map((_, index) => (
                    <Cell key={index} fill={URGENCY_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              {data!.charts.byUrgency.map((item, index) => (
                <span key={item.name} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: URGENCY_COLORS[index] }}
                  />
                  {item.name} ({item.value})
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Department load" className="xl:col-span-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data!.charts.byDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="patients" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}
    </DashboardLayout>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`panel space-y-4 p-6 ${className}`}>
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </div>
  );
}
