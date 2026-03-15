import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ activeTab, setActiveTab, navItems = [], role }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleTabClick = (id) => {
    // ONLY switch tab — never navigate away
    if (typeof setActiveTab === "function") setActiveTab(id);
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <aside style={{
      width: 220, background: "#111827",
      position: "fixed", top: 0, left: 0, height: "100vh",
      display: "flex", flexDirection: "column",
      zIndex: 40, overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 16px", borderBottom: "1px solid #1f2937" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🚀</span>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>OpenGig</p>
            <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>
              {role === "admin" ? "Admin Panel" : role === "trainer" ? "Trainer Portal" : "Learning Platform"}
            </p>
          </div>
        </div>
      </div>

      {/* User badge */}
      {user && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #0d9488, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 14, fontWeight: 700,
          }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#e5e7eb", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name}
            </p>
            <p style={{ fontSize: 10, color: "#6b7280", margin: 0, textTransform: "capitalize" }}>{user.role}</p>
          </div>
        </div>
      )}

      {/* Nav — ONLY onClick, NEVER <Link> or navigate */}
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8, border: "none",
                cursor: "pointer", marginBottom: 2, fontSize: 13,
                fontWeight: active ? 700 : 400, textAlign: "left",
                background: active ? "#0d9488" : "transparent",
                color:      active ? "#fff"    : "#9ca3af",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#1f2937"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 999, flexShrink: 0 }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "10px 8px", borderTop: "1px solid #1f2937" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 8, border: "none",
            cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: "transparent", color: "#ef4444", transition: "background 0.15s",
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