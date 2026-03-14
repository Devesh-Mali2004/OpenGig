import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import TraineeDashboard from "./pages/TraineeDashboard";
import TrainerDashboard from "./pages/TrainerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Spinner from "./components/Spinner";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "trainer") return <Navigate to="/trainer/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

const Unauthorized = () => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0f0f1a", color:"#fff" }}>
    <h1 style={{ color:"#ef4444" }}>403 — Unauthorized</h1>
    <p style={{ color:"#64748b" }}>You don't have permission to view this page.</p>
    <a href="/" style={{ marginTop:"1rem", color:"#818cf8" }}>Go Home</a>
  </div>
);

const NotFound = () => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0f0f1a", color:"#fff" }}>
    <h1 style={{ color:"#facc15" }}>404 — Page Not Found</h1>
    <p style={{ color:"#64748b" }}>This page doesn't exist.</p>
    <a href="/" style={{ marginTop:"1rem", color:"#818cf8" }}>Go Home</a>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/redirect" element={<RoleRedirect />} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["trainee"]}><TraineeDashboard /></ProtectedRoute>} />
        <Route path="/trainer/dashboard" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;