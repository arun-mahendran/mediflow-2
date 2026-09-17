import { Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminDepartments from "@/pages/AdminDepartments";
import AdminDoctorRequests from "@/pages/AdminDoctorRequests";
import AdminDoctors from "@/pages/AdminDoctors";
import AdminQueue from "@/pages/AdminQueue";
import Auth from "@/pages/Auth";
import DoctorConsultation from "@/pages/DoctorConsultation";
import DoctorConsultations from "@/pages/DoctorConsultations";
import DoctorDashboard from "@/pages/DoctorDashboard";
import DoctorProfile from "@/pages/DoctorProfile";
import DoctorQueue from "@/pages/DoctorQueue";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";
import PatientDashboard from "@/pages/PatientDashboard";
import PatientHistory from "@/pages/PatientHistory";
import PatientJoin from "@/pages/PatientJoin";
import PatientProfile from "@/pages/PatientProfile";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute role="PATIENT">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/join"
        element={
          <ProtectedRoute role="PATIENT">
            <PatientJoin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/history"
        element={
          <ProtectedRoute role="PATIENT">
            <PatientHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute role="PATIENT">
            <PatientProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute role="DOCTOR">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/queue"
        element={
          <ProtectedRoute role="DOCTOR">
            <DoctorQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/consultation/:queueId"
        element={
          <ProtectedRoute role="DOCTOR">
            <DoctorConsultation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/consultations"
        element={
          <ProtectedRoute role="DOCTOR">
            <DoctorConsultations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute role="DOCTOR">
            <DoctorProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/queue"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDoctors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctor-requests"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDoctorRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDepartments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
