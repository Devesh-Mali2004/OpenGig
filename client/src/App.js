import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import TraineeDashboard from "./pages/TraineeDashboard";
import TrainerDashboard from "./pages/TrainerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Spinner from "./components/Spinner";

// ─── Protected Route Wrapper ──────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

// ─── Role-based redirect after login ─────────────────────────────────────────
const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "trainer") return <Navigate to="/trainer/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

// ─── Unauthorized Page ────────────────────────────────────────────────────────
const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white">
    <h1 className="text-4xl font-bold text-red-500 mb-4">403 — Unauthorized</h1>
    <p className="text-gray-400 mb-6">You don't have permission to access this page.</p>
    <a href="/" className="px-5 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
      Go Home
    </a>
  </div>
);

// ─── Not Found Page ───────────────────────────────────────────────────────────
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white">
    <h1 className="text-4xl font-bold text-yellow-400 mb-4">404 — Page Not Found</h1>
    <p className="text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
    <a href="/" className="px-5 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
      Go Home
    </a>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Auto-redirect based on role */}
        <Route path="/redirect" element={<RoleRedirect />} />

        {/* Trainee Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["trainee"]}>
              <TraineeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Trainer Routes */}
        <Route
          path="/trainer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["trainer"]}>
              <TrainerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;