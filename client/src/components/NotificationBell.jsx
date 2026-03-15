import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getNotificationsAPI, markReadAPI, markAllReadAPI } from "../api/api";

export default function NotificationBell() {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [loading,       setLoading]       = useState(false);
  const navigate  = useNavigate();
  const dropRef   = useRef(null);
  const pollRef   = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotificationsAPI();
      const list = Array.isArray(res.data) ? res.data : [];
      setNotifications(list);
      setUnread(list.filter(n => !n.read).length);
    } catch { }
  }, []);

  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications]);

  // Close dropdown on outside click — without affecting page layout
  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    // Use capture phase so it fires before bubbling messes with layout
    document.addEventListener("mousedown", handleClick, true);
    return () => document.removeEventListener("mousedown", handleClick, true);
  }, []);

  // ── Handle click — FIXED: no layout shift ─────────────────────────────────
  const handleNotifClick = async (notif) => {
    // 1. Mark read
    if (!notif.read) {
      try { await markReadAPI(notif._id); } catch { }
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    }

    // 2. Close dropdown BEFORE navigating — prevents layout shift
    setOpen(false);

    // 3. Small delay so dropdown closes cleanly before route change
    setTimeout(() => {
      if (notif.type === "live_session" && notif.data?.zoomLink) {
        // Open Zoom in new tab — never navigate away from dashboard
        window.open(notif.data.zoomLink, "_blank", "noopener,noreferrer");
        return;
      }
      if (notif.link && notif.link !== window.location.pathname) {
        navigate(notif.link);
      }
    }, 50);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await markAllReadAPI();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch { }
    finally { setLoading(false); }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const typeIcon = (type) => ({ live_session:"🔴", enrollment:"✅", message:"💬" })[type] || "🔔";

  return (
    // Use inline-flex to avoid affecting surrounding layout
    <div ref={dropRef} style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
      {/* Bell */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ position:"relative", background:"transparent", border:"none", cursor:"pointer", padding:"6px 8px", borderRadius:8, fontSize:20, lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center" }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position:"absolute", top:2, right:2,
            background:"#ef4444", color:"#fff",
            fontSize:9, fontWeight:800,
            minWidth:16, height:16, borderRadius:"999px",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"0 3px", lineHeight:1,
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown — fixed position to avoid layout shift */}
      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position:"fixed",
            // We'll calculate position in JS, but for now use a reasonable default
            top:60, right:20,
            width:340, maxHeight:480,
            background:"#fff", borderRadius:14,
            border:"1px solid #e5e7eb",
            boxShadow:"0 8px 40px rgba(0,0,0,0.15)",
            zIndex:99999,
            display:"flex", flexDirection:"column",
            overflow:"hidden",
          }}
        >
          {/* Header */}
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#f9fafb", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:15, fontWeight:700, color:"#111827" }}>🔔 Notifications</span>
              {unread > 0 && (
                <span style={{ background:"#ef4444", color:"#fff", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:999 }}>{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={handleMarkAllRead} disabled={loading}
                style={{ fontSize:11, color:"#0d9488", background:"transparent", border:"none", cursor:"pointer", fontWeight:600, padding:0 }}>
                {loading ? "..." : "Mark all read"}
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ overflowY:"auto", flex:1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding:32, textAlign:"center" }}>
                <p style={{ fontSize:28, marginBottom:8 }}>🔔</p>
                <p style={{ fontSize:13, color:"#9ca3af", margin:0 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    padding:"12px 16px", cursor:"pointer",
                    borderBottom:"1px solid #f9fafb",
                    background: notif.read ? "#fff" : "#f0fdf9",
                    display:"flex", gap:10, alignItems:"flex-start",
                    transition:"background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = notif.read ? "#f9fafb" : "#dcfce7"}
                  onMouseLeave={e => e.currentTarget.style.background = notif.read ? "#fff" : "#f0fdf9"}
                >
                  <span style={{ fontSize:18, flexShrink:0, marginTop:2 }}>{typeIcon(notif.type)}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight: notif.read ? 500 : 700, color:"#111827", margin:"0 0 2px", lineHeight:1.4 }}>
                      {notif.title}
                    </p>
                    <p style={{ fontSize:11, color:"#6b7280", margin:"0 0 4px", lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {notif.message}
                    </p>
                    {notif.type === "live_session" && (
                      <span style={{ fontSize:11, color:"#0d9488", fontWeight:600 }}>👆 Tap to join session</span>
                    )}
                    <p style={{ fontSize:10, color:"#9ca3af", margin:"2px 0 0" }}>{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#0d9488", flexShrink:0, marginTop:5 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}