import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";
import { getStatsAPI, getAllUsersAPI, blockUserAPI, unblockUserAPI } from '../api/api';

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(null); // userId being acted on
  const [filterRole, setFilterRole] = useState("all");
  const [search, setSearch]     = useState("");
  const [toast, setToast]       = useState(null);

  // ── Fetch Stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminStats();
      setStats(res.data);
    } catch (err) {
      showToast("Failed to load stats", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch Users ────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (err) {
      showToast("Failed to load users", "error");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [fetchStats, fetchUsers]);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Block / Unblock ────────────────────────────────────────────────────────
  const handleToggleBlock = async (user) => {
    setActionLoading(user._id);
    try {
      if (user.isBlocked) {
        await unblockUser(user._id);
        showToast(`${user.name} has been unblocked`);
      } else {
        await blockUser(user._id);
        showToast(`${user.name} has been blocked`, "warning");
      }
      fetchUsers();
      fetchStats();
    } catch {
      showToast("Action failed. Try again.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filtered Users ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  // ── Sidebar Links ──────────────────────────────────────────────────────────
  const sidebarLinks = [
    { label: "Overview", icon: "📊", tab: "overview" },
    { label: "Users",    icon: "👥", tab: "users"    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f1a", color: "#fff" }}>
      {/* Sidebar */}
      <Sidebar role="admin" />

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Admin Dashboard</h1>
          <p style={{ color: "#64748b", marginTop: "0.3rem" }}>Manage users, monitor activity, and keep the platform healthy.</p>
        </div>

        {/* Tab Nav */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", borderBottom: "1px solid #1e1e2e", paddingBottom: "0.5rem" }}>
          {sidebarLinks.map((l) => (
            <button
              key={l.tab}
              onClick={() => setActiveTab(l.tab)}
              style={{
                padding: "0.5rem 1.2rem", borderRadius: "8px", border: "none",
                cursor: "pointer", fontWeight: 600, fontSize: "0.9rem",
                background: activeTab === l.tab ? "#4338ca" : "transparent",
                color: activeTab === l.tab ? "#fff" : "#64748b",
                transition: "all 0.2s",
              }}
            >
              {l.icon} {l.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            {loading ? (
              <Spinner />
            ) : (
              <>
                {/* Stat Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.2rem", marginBottom: "2.5rem" }}>
                  <StatCard title="Total Users"     value={stats?.totalUsers     ?? 0} icon="👥" color="#6d28d9" />
                  <StatCard title="Trainers"        value={stats?.totalTrainers  ?? 0} icon="🎓" color="#0891b2" />
                  <StatCard title="Trainees"        value={stats?.totalTrainees  ?? 0} icon="📚" color="#059669" />
                  <StatCard title="Total Courses"   value={stats?.totalCourses   ?? 0} icon="📋" color="#d97706" />
                  <StatCard title="Enrollments"     value={stats?.totalEnrollments ?? 0} icon="✅" color="#db2777" />
                  <StatCard title="Blocked Users"   value={stats?.blockedUsers   ?? 0} icon="🚫" color="#dc2626" />
                </div>

                {/* Recent Users Preview */}
                <div style={cardStyle}>
                  <h2 style={{ fontWeight: 700, marginBottom: "1.2rem", fontSize: "1.1rem" }}>
                    👥 Recent Users
                  </h2>
                  {usersLoading ? <Spinner /> : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1e1e2e", color: "#64748b" }}>
                          <th style={thStyle}>Name</th>
                          <th style={thStyle}>Email</th>
                          <th style={thStyle}>Role</th>
                          <th style={thStyle}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.slice(0, 5).map((u) => (
                          <tr key={u._id} style={{ borderBottom: "1px solid #1e1e2e" }}>
                            <td style={tdStyle}>{u.name}</td>
                            <td style={{ ...tdStyle, color: "#64748b" }}>{u.email}</td>
                            <td style={tdStyle}><RoleBadge role={u.role} /></td>
                            <td style={tdStyle}>
                              <span style={{
                                padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600,
                                background: u.isBlocked ? "#450a0a" : "#052e16",
                                color: u.isBlocked ? "#fca5a5" : "#86efac",
                              }}>
                                {u.isBlocked ? "Blocked" : "Active"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ─── USERS TAB ────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>👥 All Users</h2>
              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: "8px",
                    border: "1px solid #1e1e2e", background: "#1a1a2e",
                    color: "#fff", fontSize: "0.9rem", width: "220px",
                    outline: "none",
                  }}
                />
                {/* Role Filter */}
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: "8px",
                    border: "1px solid #1e1e2e", background: "#1a1a2e",
                    color: "#fff", fontSize: "0.9rem", cursor: "pointer",
                  }}
                >
                  <option value="all">All Roles</option>
                  <option value="trainee">Trainee</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {usersLoading ? <Spinner /> : (
              <>
                <div style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  Showing {filteredUsers.length} of {users.length} users
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1e1e2e", color: "#64748b" }}>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Role</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u, i) => (
                          <tr
                            key={u._id}
                            style={{ borderBottom: "1px solid #1e1e2e", transition: "background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#13131f"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <td style={{ ...tdStyle, color: "#64748b" }}>{i + 1}</td>
                            <td style={tdStyle}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <div style={{
                                  width: "32px", height: "32px", borderRadius: "50%",
                                  background: "linear-gradient(135deg, #4338ca, #7c3aed)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
                                }}>
                                  {u.name?.[0]?.toUpperCase()}
                                </div>
                                {u.name}
                              </div>
                            </td>
                            <td style={{ ...tdStyle, color: "#64748b" }}>{u.email}</td>
                            <td style={tdStyle}><RoleBadge role={u.role} /></td>
                            <td style={tdStyle}>
                              <span style={{
                                padding: "0.2rem 0.7rem", borderRadius: "999px",
                                fontSize: "0.75rem", fontWeight: 600,
                                background: u.isBlocked ? "#450a0a" : "#052e16",
                                color: u.isBlocked ? "#fca5a5" : "#86efac",
                              }}>
                                {u.isBlocked ? "🚫 Blocked" : "✅ Active"}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              {u.role !== "admin" && (
                                <button
                                  onClick={() => handleToggleBlock(u)}
                                  disabled={actionLoading === u._id}
                                  style={{
                                    padding: "0.35rem 0.9rem", borderRadius: "6px", border: "none",
                                    cursor: actionLoading === u._id ? "not-allowed" : "pointer",
                                    fontWeight: 600, fontSize: "0.8rem",
                                    background: u.isBlocked ? "#065f46" : "#450a0a",
                                    color: u.isBlocked ? "#6ee7b7" : "#fca5a5",
                                    opacity: actionLoading === u._id ? 0.6 : 1,
                                    transition: "opacity 0.2s",
                                  }}
                                >
                                  {actionLoading === u._id ? "..." : u.isBlocked ? "Unblock" : "Block"}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", right: "2rem",
          padding: "0.8rem 1.5rem", borderRadius: "10px",
          background: toast.type === "error" ? "#450a0a" : toast.type === "warning" ? "#422006" : "#052e16",
          color: toast.type === "error" ? "#fca5a5" : toast.type === "warning" ? "#fcd34d" : "#86efac",
          fontWeight: 600, fontSize: "0.9rem", zIndex: 9999,
          border: `1px solid ${toast.type === "error" ? "#dc2626" : toast.type === "warning" ? "#d97706" : "#16a34a"}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          animation: "fadeIn 0.3s ease",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    admin:   { bg: "#1e1b4b", color: "#a78bfa", label: "Admin" },
    trainer: { bg: "#0c2335", color: "#38bdf8", label: "Trainer" },
    trainee: { bg: "#052e16", color: "#86efac", label: "Trainee" },
  };
  const s = map[role] || { bg: "#1e1e2e", color: "#94a3b8", label: role };
  return (
    <span style={{ padding: "0.2rem 0.7rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const cardStyle = {
  background: "#13131f", border: "1px solid #1e1e2e",
  borderRadius: "14px", padding: "1.8rem",
};
const thStyle = { textAlign: "left", padding: "0.6rem 0.8rem", fontWeight: 600, fontSize: "0.85rem" };
const tdStyle = { padding: "0.75rem 0.8rem" };