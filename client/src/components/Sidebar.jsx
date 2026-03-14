import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";

export default function Sidebar({ activeTab, setActiveTab, navItems }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <aside style={{ width: 220, background: "#111827", color: "#fff", display: "flex", flexDirection: "column", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 40 }}>
      {/* Logo */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #374151" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#2dd4bf", margin: 0 }}>OpenGig</h1>
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Knowledge Marketplace</p>
      </div>

      {/* User */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #374151", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#0d9488", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {getInitials(user?.name)}
        </div>
        <div style={{ overflow: "hidden" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</p>
          <p style={{ fontSize: 10, color: "#9ca3af", margin: 0, textTransform: "capitalize" }}>{user?.role}</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 8, fontSize: 12, fontWeight: activeTab === item.id ? 600 : 500,
              color: activeTab === item.id ? "#fff" : "#d1d5db",
              background: activeTab === item.id ? "#0d9488" : "transparent",
              border: "none", cursor: "pointer", textAlign: "left",
            }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: 10, borderTop: "1px solid #374151" }}>
        <button onClick={handleLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, fontSize: 12, color: "#f87171", background: "transparent", border: "none", cursor: "pointer" }}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}