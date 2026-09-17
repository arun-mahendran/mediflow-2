import {
  BarChart3,
  Building2,
  ClipboardList,
  History,
  LayoutDashboard,
  ListOrdered,
  Monitor,
  Stethoscope,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";

import type { NavItem } from "./DashboardLayout";

export const patientNav: NavItem[] = [
  { label: "Dashboard", to: "/patient/dashboard", icon: LayoutDashboard },
  { label: "Join Queue", to: "/patient/join", icon: ClipboardList },
  { label: "History", to: "/patient/history", icon: History },
  { label: "Profile", to: "/patient/profile", icon: UserRound },
];

export const doctorNav: NavItem[] = [
  { label: "Dashboard", to: "/doctor/dashboard", icon: LayoutDashboard },
  { label: "My Queue", to: "/doctor/queue", icon: ListOrdered },
  { label: "Consultations", to: "/doctor/consultations", icon: Stethoscope },
  { label: "Profile", to: "/doctor/profile", icon: UserRound },
];

export const adminNav: NavItem[] = [
  { label: "Overview", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Queue Monitor", to: "/admin/queue", icon: Monitor },
  { label: "Doctors", to: "/admin/doctors", icon: Users },
  { label: "Doctor Requests", to: "/admin/doctor-requests", icon: UserCheck },
  { label: "Departments", to: "/admin/departments", icon: Building2 },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
];
