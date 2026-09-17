import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { authApi, clearToken, getToken, setToken } from "@/services/api";
import type { AppRole } from "@/lib/mediflow";

interface AuthState {
  userId: string | null;
  name: string;
  email: string;
  role: AppRole | null;
  patientId: string | null;
  doctorId: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: "PATIENT" | "DOCTOR";
    specialization?: string;
    departmentId?: string | null;
    licenseNumber?: string;
  }) => Promise<"CREATED" | "PENDING_APPROVAL">;
}

const AuthContext = createContext<AuthState | null>(null);

export const roleHome: Record<AppRole, string> = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin/dashboard",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadContext() {
    if (!getToken()) {
      setUserId(null);
      setName("");
      setEmail("");
      setRole(null);
      setPatientId(null);
      setDoctorId(null);
      setLoading(false);
      return;
    }
    try {
      const user = await authApi.me();
      setUserId(user.id);
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setPatientId(user.patientId);
      setDoctorId(user.doctorId);
    } catch {
      clearToken();
      setUserId(null);
      setRole(null);
      setPatientId(null);
      setDoctorId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      userId,
      name,
      email,
      role,
      patientId,
      doctorId,
      loading,
      refresh: loadContext,
      signOut: async () => {
        clearToken();
        await loadContext();
      },
      login: async (emailValue: string, password: string) => {
        const { access_token } = await authApi.login({ email: emailValue, password });
        setToken(access_token);
        await loadContext();
      },
      register: async (payload) => {
        const res = await authApi.register(payload);
        return res.status;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, name, email, role, patientId, doctorId, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Redirects unauthenticated users to /auth and wrong-role users to their own dashboard. */
export function useRequireRole(allowed: AppRole) {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.userId) {
      navigate("/auth");
      return;
    }
    if (auth.role && auth.role !== allowed) {
      navigate(roleHome[auth.role]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, auth.userId, auth.role, allowed]);

  return auth;
}
