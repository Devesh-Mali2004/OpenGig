import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ activeTab, setActiveTab, navItems, role }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <aside style={{
      width: 220,
      background: "#111827",
      position: "fixed",
      top: 0, left: 0,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      zIndex: 40,
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid #1f2937" }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>🚀 OpenGig</p>
        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
          {role === "admin" ? "Admin Panel" : role === "trainer" ? "Trainer Portal" : "Knowledge Marketplace"}
        </p>
      </div>

      {/* User info */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, #0d9488, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.name}
          </p>
          <p style={{ fontSize: 10, color: "#6b7280", margin: 0, textTransform: "capitalize" }}>{user?.role}</p>
        </div>
      </div>

      {/* Nav Items — onClick ONLY, no <Link>, no navigation */}
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {(navItems || []).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab(item.id);   // just switch tab — never navigate
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                marginBottom: 2,
                fontSize: 13,
                fontWeight: isActive ? 700 : 400,
                textAlign: "left",
                background: isActive ? "#0d9488" : "transparent",
                color: isActive ? "#fff" : "#9ca3af",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#1f2937"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid #1f2937" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 8, border: "none",
            cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: "transparent", color: "#ef4444",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#1f2937"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ fontSize: 16 }}>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}