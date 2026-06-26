import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import Spinner from "../components/Spinner";
import {
  getAdminStats, getAllUsers, blockUser, unblockUser, deleteUserAdmin,
  getAdminCourses, deleteAdminCourse, getAllSessionsAPI,
  sendAnnouncementAPI, getAllNotifsAdminAPI,
} from "../api/api";

const NAV = [
  { id:"overview",      label:"Overview",      icon:"📊" },
  { id:"users",         label:"Users",         icon:"👥" },
  { id:"courses",       label:"Courses",       icon:"📚" },
  { id:"live",          label:"Live Sessions", icon:"🔴" },
  { id:"notifications", label:"Notifications", icon:"🔔" },
];

// ── Donut Chart (pure SVG — no library needed, no errors) ─────────────────────
function DonutChart({ data, title }) {
  const total  = data.reduce((s, d) => s + d.value, 0);
  let cumAngle = -90;
  const r = 60, cx = 80, cy = 80, strokeW = 22;

  const slices = data.map((d) => {
    const angle  = total > 0 ? (d.value / total) * 360 : 0;
    const start  = cumAngle;
    cumAngle    += angle;
    const startR = (start * Math.PI) / 180;
    const endR   = ((start + angle) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startR);
    const y1 = cy + r * Math.sin(startR);
    const x2 = cx + r * Math.cos(endR);
    const y2 = cy + r * Math.sin(endR);
    const large = angle > 180 ? 1 : 0;
    return { ...d, path: angle > 0 ? `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}` : null };
  });

  return (
    <div style={{ display:"flex", alignItems:"center", gap:20 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeW} />
        {slices.map((s, i) => s.path && (
          <path key={i} d={s.path} fill="none" stroke={s.color} strokeWidth={strokeW} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy-6} textAnchor="middle" fontSize="20" fontWeight="800" fill="#111827">{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontSize="10" fill="#9ca3af">Total</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:d.color, flexShrink:0 }} />
            <span style={{ fontSize:12, color:"#374151" }}>{d.label}</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#111827", marginLeft:"auto" }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart (pure SVG) ──────────────────────────────────────────────────────
function BarChart({ data, title, color = "#1d4ed8" }) {
  const max     = Math.max(...data.map(d => d.value), 1);
  const W       = 300, H = 140, padL = 30, padB = 30, padT = 10;
  const chartW  = W - padL;
  const chartH  = H - padB - padT;
  const barW    = Math.floor((chartW / data.length) * 0.6);
  const gap     = chartW / data.length;

  return (
    <div>
      {title && <p style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:8, marginTop:0 }}>{title}</p>}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Y axis lines */}
        {[0,0.25,0.5,0.75,1].map((pct, i) => {
          const y = padT + chartH * (1 - pct);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={padL-4} y={y+4} textAnchor="end" fontSize="9" fill="#9ca3af">{Math.round(max*pct)}</text>
            </g>
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const barH  = max > 0 ? (d.value / max) * chartH : 0;
          const x     = padL + i * gap + (gap - barW) / 2;
          const y     = padT + chartH - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} opacity={0.85} />
              <text x={x + barW/2} y={padT + chartH + 16} textAnchor="middle" fontSize="9" fill="#6b7280">{d.label}</text>
              {d.value > 0 && <text x={x + barW/2} y={y-3} textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>{d.value}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatBox({ label, value, icon, bg, color, trend }) {
  return (
    <div style={{ background:bg, borderRadius:14, padding:"18px 20px", border:`1px solid ${color}22`, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-10, right:-10, fontSize:48, opacity:0.08 }}>{icon}</div>
      <p style={{ fontSize:11, color:"#6b7280", fontWeight:600, margin:"0 0 6px", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</p>
      <p style={{ fontSize:28, fontWeight:800, color, margin:0 }}>{value ?? 0}</p>
      {trend && <p style={{ fontSize:11, color:"#6b7280", margin:"4px 0 0" }}>{trend}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab,    setActiveTab]    = useState("overview");
  const [stats,        setStats]        = useState(null);
  const [users,        setUsers]        = useState([]);
  const [courses,      setCourses]      = useState([]);
  const [sessions,     setSessions]     = useState([]);
  const [allNotifs,    setAllNotifs]    = useState([]);
  const [loading,      setLoading]      = useState({});
  const [toast,        setToast]        = useState(null);
  const [actionId,     setActionId]     = useState(null);
  const [searchUser,   setSearchUser]   = useState("");
  const [filterRole,   setFilterRole]   = useState("all");
  const [announcement, setAnnouncement] = useState({ title:"", message:"", targetRole:"all" });
  const [sending,      setSending]      = useState(false);
  const { user } = useAuth();

  useEffect(() => { document.title = `${NAV.find(n=>n.id===activeTab)?.label||""} — Admin`; }, [activeTab]);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };
  const setLoad = (k,v) => setLoading(p=>({...p,[k]:v}));

  const fetchAll = useCallback(async () => {
    setLoad("stats",true);
    try { const r = await getAdminStats(); setStats(r.data); } catch(e){console.error(e);} finally { setLoad("stats",false); }
    setLoad("users",true);
    try { const r = await getAllUsers(); setUsers(Array.isArray(r.data)?r.data:[]); } catch(e){console.error(e);} finally { setLoad("users",false); }
    setLoad("courses",true);
    try { const r = await getAdminCourses(); setCourses(Array.isArray(r.data)?r.data:[]); } catch(e){console.error(e);} finally { setLoad("courses",false); }
    setLoad("sessions",true);
    try { const r = await getAllSessionsAPI(); setSessions(Array.isArray(r.data)?r.data:[]); } catch(e){console.error(e);} finally { setLoad("sessions",false); }
    setLoad("notifs",true);
    try { const r = await getAllNotifsAdminAPI(); setAllNotifs(Array.isArray(r.data)?r.data:[]); } catch(e){console.error(e);} finally { setLoad("notifs",false); }
  }, []);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 30000); return ()=>clearInterval(t); }, [fetchAll]);

  const handleToggleBlock = async (u) => {
    setActionId(u._id);
    try {
      if (u.isBlocked) { await unblockUser(u._id); showToast(`${u.name} unblocked`); }
      else             { await blockUser(u._id);   showToast(`${u.name} blocked`,"warning"); }
      fetchAll();
    } catch { showToast("Action failed.","error"); } finally { setActionId(null); }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.name}? Cannot be undone.`)) return;
    setActionId(u._id);
    try { await deleteUserAdmin(u._id); fetchAll(); showToast("User deleted."); }
    catch { showToast("Delete failed.","error"); } finally { setActionId(null); }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try { await deleteAdminCourse(id); fetchAll(); showToast("Course deleted."); }
    catch { showToast("Failed.","error"); }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.title||!announcement.message) { showToast("Fill all fields.","error"); return; }
    setSending(true);
    try { const r = await sendAnnouncementAPI(announcement); showToast(r.data.message); setAnnouncement({title:"",message:"",targetRole:"all"}); fetchAll(); }
    catch { showToast("Failed to send.","error"); } finally { setSending(false); }
  };

  const filteredUsers = users.filter(u => {
    const matchRole   = filterRole==="all" || u.role===filterRole;
    const matchSearch = !searchUser || u.name?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase());
    return matchRole && matchSearch;
  });

  // ── Chart data ─────────────────────────────────────────────────────────────
  const userDonut = [
    { label:"Learners", value: stats?.totalLearners||0,  color:"#7c3aed" },
    { label:"Mentors", value: stats?.totalMentors||0,  color:"#16a34a" },
    { label:"Admins",   value: Math.max(0,(stats?.totalUsers||0)-(stats?.totalLearners||0)-(stats?.totalMentors||0)), color:"#1d4ed8" },
  ];

  // Group courses by category for bar chart
  const categoryMap = {};
  courses.forEach(c => { const cat = c.category||"Other"; categoryMap[cat] = (categoryMap[cat]||0)+1; });
  const courseBarData = Object.entries(categoryMap).slice(0,6).map(([label,value])=>({label:label.slice(0,8),value}));

  // Sessions per day (last 7 days)
  const sessionDays = {};
  const now = new Date();
  for (let i=6; i>=0; i--) {
    const d = new Date(now); d.setDate(d.getDate()-i);
    const key = d.toLocaleDateString("en",{weekday:"short"});
    sessionDays[key] = 0;
  }
  sessions.forEach(s => {
    const d = new Date(s.createdAt);
    const key = d.toLocaleDateString("en",{weekday:"short"});
    if (sessionDays[key] !== undefined) sessionDays[key]++;
  });
  const sessionBarData = Object.entries(sessionDays).map(([label,value])=>({label,value}));

  const S = {
    card: { background:"#fff", borderRadius:14, border:"1px solid #f3f4f6", padding:"20px 24px" },
    th:   { padding:"10px 14px", fontSize:11, fontWeight:700, color:"#6b7280", textAlign:"left", borderBottom:"1px solid #f3f4f6", whiteSpace:"nowrap" },
    td:   { padding:"11px 14px", color:"#374151", fontSize:13 },
    lbl:  { fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 },
    inp:  { width:"100%", padding:"9px 12px", fontSize:13, border:"1px solid #e5e7eb", borderRadius:8, outline:"none", color:"#111827", boxSizing:"border-box" },
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8fafc", fontFamily:"ui-sans-serif,system-ui,sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width:220, background:"#0f172a", position:"fixed", top:0, left:0, height:"100vh", display:"flex", flexDirection:"column", zIndex:40 }}>
        <div style={{ padding:"20px 16px", borderBottom:"1px solid #1e293b" }}>
          <p style={{ fontSize:18, fontWeight:800, color:"#fff", margin:0 }}>🚀 OpenGig</p>
          <p style={{ fontSize:11, color:"#475569", marginTop:2 }}>Admin Panel</p>
        </div>
        <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={()=>setActiveTab(n.id)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, border:"none", cursor:"pointer", marginBottom:2, fontSize:13, fontWeight:activeTab===n.id?700:500, textAlign:"left",
                background: activeTab===n.id?"#1d4ed8":"transparent",
                color:      activeTab===n.id?"#fff":"#94a3b8" }}>
              <span style={{ fontSize:16 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"14px 16px", borderTop:"1px solid #1e293b" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, flexShrink:0 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize:12, color:"#e2e8f0", margin:0, fontWeight:600 }}>{user?.name}</p>
              <p style={{ fontSize:10, color:"#475569", margin:0 }}>Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ marginLeft:220, flex:1, display:"flex", flexDirection:"column" }}>
        {/* Topbar */}
        <header style={{ background:"#fff", borderBottom:"1px solid #f1f5f9", padding:"12px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:30 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, color:"#111827", margin:0 }}>{NAV.find(n=>n.id===activeTab)?.icon} {NAV.find(n=>n.id===activeTab)?.label}</h2>
            <p style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Real-time platform overview</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {stats && (
              <div style={{ display:"flex", gap:6 }}>
                <span style={{ fontSize:11, background:"#f0fdf4", color:"#16a34a", padding:"4px 10px", borderRadius:999, fontWeight:600 }}>👥 {stats.totalUsers} Users</span>
                {stats.activeSessions > 0 && <span style={{ fontSize:11, background:"#fef2f2", color:"#dc2626", padding:"4px 10px", borderRadius:999, fontWeight:700 }}>🔴 {stats.activeSessions} Live</span>}
              </div>
            )}
            <button onClick={fetchAll} style={{ fontSize:12, color:"#0d9488", background:"transparent", border:"1px solid #0d9488", borderRadius:6, padding:"5px 12px", cursor:"pointer" }}>🔄 Refresh</button>
            <NotificationBell />
          </div>
        </header>

        {/* Toast */}
        {toast && (
          <div style={{ position:"fixed", bottom:"2rem", right:"2rem", zIndex:9999, padding:"0.75rem 1.5rem", borderRadius:10, fontWeight:600, fontSize:14,
            background: toast.type==="error"?"#fef2f2":toast.type==="warning"?"#fffbeb":"#f0fdf4",
            color:      toast.type==="error"?"#dc2626":toast.type==="warning"?"#d97706":"#16a34a",
            border:    `1px solid ${toast.type==="error"?"#fca5a5":toast.type==="warning"?"#fcd34d":"#86efac"}`,
            boxShadow:"0 4px 24px rgba(0,0,0,0.12)" }}>
            {toast.msg}
          </div>
        )}

        <div style={{ padding:"24px 28px" }}>

          {/* ── OVERVIEW ── */}
          {activeTab==="overview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {loading.stats ? <Spinner /> : stats && (
                <>
                  {/* Stat cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                    <StatBox label="Total Users"    value={stats.totalUsers}       icon="👥" bg="#eff6ff" color="#1d4ed8" trend={`${stats.totalMentors} Mentors · ${stats.totalLearners} Learners`} />
                    <StatBox label="Total Courses"  value={stats.totalCourses}     icon="📚" bg="#f0fdf4" color="#16a34a" trend="Published on platform" />
                    <StatBox label="Enrollments"    value={stats.totalEnrollments} icon="✅" bg="#fdf4ff" color="#7c3aed" trend="Across all courses" />
                    <StatBox label="Live Sessions"  value={stats.activeSessions}   icon="🔴" bg={stats.activeSessions>0?"#fef2f2":"#f8fafc"} color={stats.activeSessions>0?"#dc2626":"#94a3b8"} trend={stats.activeSessions>0?"Active right now":"No active sessions"} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                    <StatBox label="Mentors"       value={stats.totalMentors}    icon="🎓" bg="#fff7ed" color="#ea580c" />
                    <StatBox label="Learners"       value={stats.totalLearners}    icon="📖" bg="#fdf4ff" color="#7c3aed" />
                    <StatBox label="Blocked Users"  value={stats.blockedUsers}     icon="🚫" bg="#fef2f2" color="#dc2626" />
                    <StatBox label="Total Sessions" value={stats.totalSessions}    icon="🎥" bg="#eff6ff" color="#1d4ed8" />
                  </div>

                  {/* Charts row */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>

                    {/* Donut — User distribution */}
                    <div style={S.card}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 16px" }}>👥 User Distribution</p>
                      <DonutChart data={userDonut} />
                    </div>

                    {/* Bar — Courses by category */}
                    <div style={S.card}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 8px" }}>📚 Courses by Category</p>
                      {courseBarData.length > 0
                        ? <BarChart data={courseBarData} color="#16a34a" />
                        : <p style={{ color:"#9ca3af", fontSize:13 }}>No course data yet</p>}
                    </div>

                    {/* Bar — Sessions last 7 days */}
                    <div style={S.card}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 8px" }}>🎥 Sessions (Last 7 Days)</p>
                      <BarChart data={sessionBarData} color="#7c3aed" />
                    </div>
                  </div>

                  {/* Summary tables */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div style={S.card}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 14px" }}>👥 Recent Users</p>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                        <thead><tr>{["Name","Role","Status"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {users.slice(0,5).map(u=>(
                            <tr key={u._id} style={{ borderBottom:"1px solid #f8fafc" }}>
                              <td style={{ ...S.td, fontWeight:600 }}>{u.name}</td>
                              <td style={S.td}><RoleBadge role={u.role}/></td>
                              <td style={S.td}><span style={{ color:u.isBlocked?"#dc2626":"#16a34a", fontWeight:600, fontSize:11 }}>{u.isBlocked?"Blocked":"Active"}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={S.card}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 14px" }}>📚 Recent Courses</p>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                        <thead><tr>{["Title","Mentor","Students"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {courses.slice(0,5).map(c=>(
                            <tr key={c._id} style={{ borderBottom:"1px solid #f8fafc" }}>
                              <td style={{ ...S.td, fontWeight:600, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</td>
                              <td style={S.td}>{c.Mentor?.name||"—"}</td>
                              <td style={{ ...S.td, textAlign:"center" }}>{c.enrollmentCount||0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab==="users" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <h2 style={{ fontSize:18, fontWeight:700, color:"#111827", margin:0 }}>All Users <span style={{ fontSize:13, color:"#9ca3af", fontWeight:400 }}>({filteredUsers.length})</span></h2>
                <div style={{ display:"flex", gap:8 }}>
                  <input type="text" placeholder="Search name or email..." value={searchUser} onChange={e=>setSearchUser(e.target.value)}
                    style={{ padding:"8px 12px", fontSize:12, border:"1px solid #e5e7eb", borderRadius:8, outline:"none", width:220 }} />
                  <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
                    style={{ padding:"8px 12px", fontSize:12, border:"1px solid #e5e7eb", borderRadius:8, outline:"none", background:"#fff" }}>
                    <option value="all">All Roles</option>
                    <option value="Learner">Learner</option>
                    <option value="Mentor">Mentor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {loading.users ? <Spinner /> : (
                <div style={S.card}>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead><tr style={{ background:"#f8fafc" }}>{["#","Name","Email","Role","Phone","Status","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {filteredUsers.length===0 ? (
                          <tr><td colSpan={7} style={{ padding:"32px", textAlign:"center", color:"#9ca3af" }}>No users found</td></tr>
                        ) : filteredUsers.map((u,i)=>(
                          <tr key={u._id} style={{ borderBottom:"1px solid #f8fafc" }}
                            onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                            <td style={{ ...S.td, color:"#9ca3af" }}>{i+1}</td>
                            <td style={S.td}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>
                                  {u.name?.[0]?.toUpperCase()}
                                </div>
                                <span style={{ fontWeight:600 }}>{u.name}</span>
                              </div>
                            </td>
                            <td style={{ ...S.td, color:"#6b7280" }}>{u.email}</td>
                            <td style={S.td}><RoleBadge role={u.role}/></td>
                            <td style={{ ...S.td, color:"#6b7280" }}>{u.phone||"—"}</td>
                            <td style={S.td}>
                              <span style={{ padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:600,
                                background:u.isBlocked?"#fef2f2":"#f0fdf4",
                                color:u.isBlocked?"#dc2626":"#16a34a" }}>
                                {u.isBlocked?"🚫 Blocked":"✅ Active"}
                              </span>
                            </td>
                            <td style={S.td}>
                              {u.role!=="admin" && (
                                <div style={{ display:"flex", gap:6 }}>
                                  <button onClick={()=>handleToggleBlock(u)} disabled={actionId===u._id}
                                    style={{ padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer", fontWeight:600, fontSize:11,
                                      background:u.isBlocked?"#f0fdf4":"#fef2f2",
                                      color:u.isBlocked?"#16a34a":"#dc2626",
                                      opacity:actionId===u._id?0.6:1 }}>
                                    {actionId===u._id?"...":u.isBlocked?"Unblock":"Block"}
                                  </button>
                                  <button onClick={()=>handleDeleteUser(u)} disabled={actionId===u._id}
                                    style={{ padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer", fontWeight:600, fontSize:11, background:"#fef2f2", color:"#dc2626" }}>
                                    🗑
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── COURSES ── */}
          {activeTab==="courses" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontSize:18, fontWeight:700, color:"#111827", margin:0 }}>All Courses <span style={{ fontSize:13, color:"#9ca3af", fontWeight:400 }}>({courses.length})</span></h2>
                {/* Mini bar chart */}
                {courseBarData.length > 0 && (
                  <div style={{ ...S.card, padding:"12px 16px" }}>
                    <BarChart data={courseBarData} color="#16a34a" />
                  </div>
                )}
              </div>
              {loading.courses ? <Spinner /> : (
                <div style={S.card}>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead><tr style={{ background:"#f8fafc" }}>{["Title","Mentor","Category","Level","Price","Students","Zoom","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {courses.length===0 ? (
                          <tr><td colSpan={8} style={{ padding:"32px", textAlign:"center", color:"#9ca3af" }}>No courses yet</td></tr>
                        ) : courses.map(c=>(
                          <tr key={c._id} style={{ borderBottom:"1px solid #f8fafc" }}
                            onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                            <td style={{ ...S.td, fontWeight:600, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</td>
                            <td style={S.td}>{c.Mentor?.name||"—"}</td>
                            <td style={S.td}><span style={{ background:"#f0fdf4", color:"#16a34a", padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:600 }}>{c.category}</span></td>
                            <td style={S.td}>{c.level}</td>
                            <td style={S.td}>{!c.price||c.price===0?"🆓 Free":`₹${c.price}`}</td>
                            <td style={{ ...S.td, textAlign:"center", fontWeight:600, color:"#7c3aed" }}>{c.enrollmentCount||0}</td>
                            <td style={S.td}>
                              {c.zoomLink
                                ? <a href={c.zoomLink} target="_blank" rel="noreferrer" style={{ color:"#2563eb", fontWeight:600, fontSize:11 }}>Join ↗</a>
                                : <span style={{ color:"#9ca3af", fontSize:11 }}>—</span>}
                            </td>
                            <td style={S.td}>
                              <button onClick={()=>handleDeleteCourse(c._id)}
                                style={{ padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer", fontWeight:600, fontSize:11, background:"#fef2f2", color:"#dc2626" }}>
                                🗑
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── LIVE SESSIONS ── */}
          {activeTab==="live" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <h2 style={{ fontSize:18, fontWeight:700, color:"#111827", margin:0 }}>Live Session Monitor</h2>
                <div style={{ display:"flex", gap:10 }}>
                  <StatBox label="Active Now"   value={sessions.filter(s=>s.isLive).length}  icon="🔴" bg="#fef2f2" color="#dc2626" />
                  <StatBox label="Total"        value={sessions.length}                       icon="🎥" bg="#eff6ff" color="#1d4ed8" />
                </div>
              </div>

              {/* Sessions bar chart */}
              <div style={S.card}>
                <p style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 8px" }}>📅 Sessions Activity (Last 7 Days)</p>
                <BarChart data={sessionBarData} color="#7c3aed" />
              </div>

              {loading.sessions ? <Spinner /> : (
                <>
                  {sessions.filter(s=>s.isLive).length > 0 && (
                    <div style={{ ...S.card, border:"2px solid #fca5a5", background:"#fef2f2" }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#dc2626", margin:"0 0 14px", display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:10, height:10, borderRadius:"50%", background:"#dc2626", display:"inline-block" }} />
                        {sessions.filter(s=>s.isLive).length} Active Live Session(s)
                      </p>
                      {sessions.filter(s=>s.isLive).map(s=>(
                        <div key={s._id} style={{ background:"#fff", borderRadius:10, padding:"12px 16px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <p style={{ fontSize:14, fontWeight:700, color:"#111827", margin:0 }}>{s.title}</p>
                            <p style={{ fontSize:12, color:"#6b7280", margin:"4px 0 0" }}>by {s.Mentor?.name||"—"} {s.course?.title?`· ${s.course.title}`:""}</p>
                            <p style={{ fontSize:11, color:"#9ca3af", margin:"2px 0 0" }}>Started {new Date(s.createdAt).toLocaleTimeString()}</p>
                          </div>
                          {/* Fixed: opens meeting in new tab */}
                          <a href={s.zoomLink} target="_blank" rel="noreferrer"
                            onClick={e => { e.preventDefault(); window.open(s.zoomLink, "_blank", "noopener,noreferrer"); }}
                            style={{ background:"#dc2626", color:"#fff", fontSize:12, fontWeight:700, padding:"8px 18px", borderRadius:8, textDecoration:"none", cursor:"pointer" }}>
                            🎥 Join Meeting →
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={S.card}>
                    <p style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 14px" }}>📅 All Sessions</p>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead><tr style={{ background:"#f8fafc" }}>{["Title","Mentor","Course","Date","Duration","Status","Meeting"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {sessions.length===0 ? (
                          <tr><td colSpan={7} style={{ padding:"24px", textAlign:"center", color:"#9ca3af" }}>No sessions yet</td></tr>
                        ) : sessions.map(s=>(
                          <tr key={s._id} style={{ borderBottom:"1px solid #f8fafc" }}>
                            <td style={{ ...S.td, fontWeight:600 }}>{s.title}</td>
                            <td style={S.td}>{s.Mentor?.name||"—"}</td>
                            <td style={S.td}>{s.course?.title||"General"}</td>
                            <td style={S.td}>{new Date(s.createdAt).toLocaleDateString()}</td>
                            <td style={S.td}>
                              {s.isLive ? "Ongoing" : s.endedAt
                                ? `${Math.round((new Date(s.endedAt)-new Date(s.createdAt))/60000)} min`
                                : "—"}
                            </td>
                            <td style={S.td}>
                              <span style={{ padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700,
                                background:s.isLive?"#fef2f2":"#f3f4f6",
                                color:s.isLive?"#dc2626":"#6b7280" }}>
                                {s.isLive?"🔴 LIVE":"⏹ Ended"}
                              </span>
                            </td>
                            <td style={S.td}>
                              <button onClick={()=>window.open(s.zoomLink,"_blank","noopener,noreferrer")}
                                style={{ background:"none", border:"none", color:"#2563eb", fontSize:12, cursor:"pointer", fontWeight:600, padding:0 }}>
                                Open ↗
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab==="notifications" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:"#111827", margin:0 }}>Notification Management</h2>

              <div style={S.card}>
                <p style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 16px" }}>📢 Send Announcement</p>
                <form onSubmit={handleSendAnnouncement}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                    <div>
                      <label style={S.lbl}>Title</label>
                      <input type="text" value={announcement.title} onChange={e=>setAnnouncement({...announcement,title:e.target.value})} placeholder="Announcement title" style={S.inp} />
                    </div>
                    <div>
                      <label style={S.lbl}>Send To</label>
                      <select value={announcement.targetRole} onChange={e=>setAnnouncement({...announcement,targetRole:e.target.value})} style={{ ...S.inp, background:"#fff" }}>
                        <option value="all">All Users</option>
                        <option value="Learner">All Learners Only</option>
                        <option value="Mentor">All Mentors Only</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Message</label>
                    <textarea value={announcement.message} onChange={e=>setAnnouncement({...announcement,message:e.target.value})} placeholder="Write your announcement here..."
                      style={{ ...S.inp, minHeight:90, resize:"vertical", fontFamily:"inherit" }} />
                  </div>
                  <button type="submit" disabled={sending}
                    style={{ background:sending?"#93c5fd":"#1d4ed8", color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:sending?"not-allowed":"pointer" }}>
                    {sending ? "Sending..." : "📢 Send Announcement"}
                  </button>
                </form>
              </div>

              {/* Notification stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                <StatBox label="Total Sent" value={allNotifs.length} icon="🔔" bg="#eff6ff" color="#1d4ed8" />
                <StatBox label="Unread"     value={allNotifs.filter(n=>!n.read).length} icon="📬" bg="#fffbeb" color="#d97706" />
                <StatBox label="Live Alerts" value={allNotifs.filter(n=>n.type==="live_session").length} icon="🔴" bg="#fef2f2" color="#dc2626" />
              </div>

              <div style={S.card}>
                <p style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 14px" }}>🔔 Recent Notifications</p>
                {loading.notifs ? <Spinner /> : (
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead><tr style={{ background:"#f8fafc" }}>{["Type","Title","Recipient","Sender","Time","Status"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {allNotifs.length===0 ? (
                        <tr><td colSpan={6} style={{ padding:"24px", textAlign:"center", color:"#9ca3af" }}>No notifications yet</td></tr>
                      ) : allNotifs.slice(0,40).map(n=>(
                        <tr key={n._id} style={{ borderBottom:"1px solid #f8fafc" }}>
                          <td style={S.td}><span style={{ fontSize:18 }}>{n.type==="live_session"?"🔴":n.type==="enrollment"?"✅":n.type==="message"?"💬":"🔔"}</span></td>
                          <td style={{ ...S.td, fontWeight:600, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.title}</td>
                          <td style={S.td}>{n.recipient?.name||"—"}</td>
                          <td style={S.td}>{n.sender?.name||"System"}</td>
                          <td style={{ ...S.td, color:"#9ca3af", fontSize:11 }}>{new Date(n.createdAt).toLocaleString()}</td>
                          <td style={S.td}><span style={{ padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:600, background:n.read?"#f0fdf4":"#fffbeb", color:n.read?"#16a34a":"#d97706" }}>{n.read?"Read":"Unread"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function RoleBadge({ role }) {
  const m = { admin:{ bg:"#eff6ff", c:"#1d4ed8" }, Mentor:{ bg:"#f0fdf4", c:"#16a34a" }, Learner:{ bg:"#fdf4ff", c:"#7c3aed" } };
  const s = m[role]||{ bg:"#f3f4f6", c:"#6b7280" };
  return <span style={{ background:s.bg, color:s.c, padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{role}</span>;
}