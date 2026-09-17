import axios from "axios";

import type { AppRole, Availability, DepartmentName, QueueStatus, Urgency } from "@/lib/mediflow";

const TOKEN_KEY = "mediflow_token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (typeof window !== "undefined" && window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  },
);

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/* ------------------------------- Shared row shapes ------------------------------- */

export interface QueueRow {
  id: string;
  queue_number: string;
  patient_id: string;
  doctor_id: string | null;
  department_id: string | null;
  symptoms: string;
  urgency: Urgency;
  ai_reason: string;
  priority_score: number;
  status: QueueStatus;
  created_at: string;
  called_at: string | null;
  completed_at: string | null;
}

export interface DepartmentRow {
  id: string;
  name: DepartmentName | string;
  description?: string;
}

export interface DoctorRow {
  id: string;
  user_id: string;
  specialization: string;
  department_id: string | null;
  availability: Availability;
}

export interface PatientRow {
  id: string;
  user_id: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
}

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
}

export interface ConsultationRow {
  id: string;
  queue_id: string;
  doctor_id: string;
  patient_id: string;
  notes: string;
  diagnosis: string;
  prescription: string;
  started_at: string;
  completed_at: string | null;
}

export interface DoctorApplicationRow {
  id: string;
  full_name: string;
  email: string;
  specialization: string;
  license_number: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  department_id: string | null;
  created_at: string;
  review_note: string;
}

/* ---------------------------------- Auth API ---------------------------------- */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  patientId: string | null;
  doctorId: string | null;
}

export const authApi = {
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: "PATIENT" | "DOCTOR";
    specialization?: string;
    departmentId?: string | null;
    licenseNumber?: string;
  }) => api.post<{ status: "CREATED" | "PENDING_APPROVAL" }>("/auth/register", payload).then((r) => r.data),
  login: (payload: { email: string; password: string }) =>
    api.post<{ access_token: string; token_type: string }>("/auth/login", payload).then((r) => r.data),
  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),
};

/* ----------------------------------- AI API ------------------------------------ */

export interface TriageResult {
  urgency: Urgency;
  department: DepartmentName;
  reason: string;
  source: "ai" | "fallback";
}

export const aiApi = {
  analyzeSymptoms: (payload: { symptoms: string; age: number; gender: string }) =>
    api.post<TriageResult>("/ai/analyze-symptoms", payload).then((r) => r.data),
};

/* ---------------------------------- Queue API ----------------------------------- */

export const queueApi = {
  join: (payload: {
    patientId: string;
    departmentId: string | null;
    symptoms: string;
    urgency: Urgency;
    reason: string;
  }) => api.post<QueueRow>("/queue/join", payload).then((r) => r.data),
  myStatus: () =>
    api
      .get<{
        current: QueueRow | null;
        waiting: Array<Pick<QueueRow, "id" | "urgency" | "created_at" | "department_id">>;
        departments: DepartmentRow[];
        doctors: Array<Pick<DoctorRow, "id" | "specialization" | "availability" | "user_id">>;
      }>("/queue/my-status")
      .then((r) => r.data),
  list: () => api.get<QueueRow[]>("/queue").then((r) => r.data),
};

/* --------------------------------- Doctor API ----------------------------------- */

export interface EnrichedQueueRow extends QueueRow {
  department?: string;
  patientName?: string;
  patientAge?: number | null;
  patientGender?: string | null;
  consult?: ConsultationRow | null;
}

export const doctorApi = {
  dashboard: () =>
    api
      .get<{
        doctor: DoctorRow | null;
        departments: DepartmentRow[];
        patients: PatientRow[];
        profiles: ProfileRow[];
        queue: QueueRow[];
      }>("/doctors/dashboard")
      .then((r) => r.data),
  queue: () => api.get<EnrichedQueueRow[]>("/doctors/queue").then((r) => r.data),
  setAvailability: (availability: Availability) =>
    api.put<DoctorRow>("/doctors/availability", { availability }).then((r) => r.data),
  callNext: () => api.post<QueueRow | null>("/doctors/call-next").then((r) => r.data),
  getProfile: () => api.get<DoctorRow>("/doctors/profile").then((r) => r.data),
  updateProfile: (payload: { name: string; specialization: string; departmentId: string | null }) =>
    api.put<DoctorRow>("/doctors/profile", payload).then((r) => r.data),
};

/* ------------------------------ Consultation API -------------------------------- */

export const consultationApi = {
  start: (payload: { queueId: string; doctorId: string }) =>
    api.post<ConsultationRow>("/consultations", payload).then((r) => r.data),
  complete: (
    id: string,
    payload: { notes: string; diagnosis: string; prescription: string; doctorId: string },
  ) => api.put<ConsultationRow>(`/consultations/${id}/complete`, payload).then((r) => r.data),
  listForDoctor: () => api.get<ConsultationRow[]>("/consultations").then((r) => r.data),
  myHistory: () =>
    api
      .get<{ entries: QueueRow[]; consults: ConsultationRow[] }>("/consultations/mine")
      .then((r) => r.data),
};

/* ---------------------------------- Admin API ------------------------------------ */

export interface AdminDoctorRow extends DoctorRow {
  name: string;
  email: string;
  department: string;
  consultations: number;
}

export interface AdminDepartmentRow extends DepartmentRow {
  doctors: number;
  waiting: number;
}

export const adminApi = {
  dashboard: () =>
    api
      .get<{
        queue: QueueRow[];
        doctors: DoctorRow[];
        departments: DepartmentRow[];
        profiles: ProfileRow[];
        consultations: Array<Pick<ConsultationRow, "id" | "doctor_id" | "started_at" | "completed_at">>;
        patients: PatientRow[];
      }>("/admin/dashboard")
      .then((r) => r.data),
  patients: () => api.get<PatientRow[]>("/admin/patients").then((r) => r.data),
  doctors: () => api.get<AdminDoctorRow[]>("/admin/doctors").then((r) => r.data),
  updateDoctorDepartment: (doctorId: string, departmentId: string | null) =>
    api.put<DoctorRow>(`/admin/doctors/${doctorId}/department`, { departmentId }).then((r) => r.data),
  pendingDoctors: () => api.get<DoctorApplicationRow[]>("/admin/pending-doctors").then((r) => r.data),
  approveDoctor: (id: string, note: string) =>
    api.put<{ ok: true; status: "APPROVED" }>(`/admin/doctors/${id}/approve`, { note }).then((r) => r.data),
  rejectDoctor: (id: string, note: string) =>
    api.put<{ ok: true; status: "REJECTED" }>(`/admin/doctors/${id}/reject`, { note }).then((r) => r.data),
  queue: () => api.get<EnrichedQueueRow[]>("/admin/queue").then((r) => r.data),
  analytics: () =>
    api
      .get<{
        byUrgency: Array<{ name: string; value: number }>;
        byDepartment: Array<{ name: string; patients: number }>;
        hours: Array<{ name: string; patients: number }>;
      }>("/admin/analytics")
      .then((r) => r.data),
};

/* ------------------------------- Department API ---------------------------------- */

export const departmentApi = {
  list: () => api.get<DepartmentRow[]>("/departments").then((r) => r.data),
};

/* --------------------------------- Patient API ------------------------------------ */

export const patientApi = {
  getMe: () => api.get<PatientRow & { name: string; email: string }>("/patients/me").then((r) => r.data),
  updateMe: (payload: { name?: string; age?: number | null; gender?: string | null; phone?: string | null }) =>
    api.put<PatientRow & { name: string; email: string }>("/patients/me", payload).then((r) => r.data),
};
