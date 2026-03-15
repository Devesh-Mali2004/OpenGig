import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

const BASE = "http://localhost:5000/api";
const H = () => { const t = localStorage.getItem("opengig_token"); return { "Content-Type":"application/json", ...(t?{Authorization:`Bearer ${t}`}:{}) }; };

export default function NotificationBell() {
  const [open,   setOpen]   = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [busy,   setBusy]   = useState(false);
  const { socket } = useSocket() || {};
  const navigate   = useNavigate();
  const ref        = useRef(null);
  const poll       = useRef(null);

  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/notifications`, { headers: H() });
      const d = await r.json();
      if (Array.isArray(d)) { setNotifs(d); setUnread(d.filter(n=>!n.read).length); }
    } catch {}
  }, []);

  useEffect(() => { fetch_(); poll.current = setInterval(fetch_, 15000); return ()=>clearInterval(poll.current); }, [fetch_]);

  useEffect(() => {
    if (!socket) return;
    const h = (n) => { setNotifs(p=>[{...n,_id:Date.now(),read:false,createdAt:new Date()},...p]); setUnread(p=>p+1); };
    socket.on("notification:new", h);
    return () => socket.off("notification:new", h);
  }, [socket]);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn, true);
    return () => document.removeEventListener("mousedown", fn, true);
  }, []);

  const click = async (n) => {
    if (!n.read && typeof n._id === "string") {
      try { await fetch(`${BASE}/notifications/${n._id}/read`, { method:"PUT", headers:H() }); } catch {}
      setNotifs(p=>p.map(x=>x._id===n._id?{...x,read:true}:x));
      setUnread(p=>Math.max(0,p-1));
    }
    setOpen(false);
    setTimeout(() => {
      if (n.type==="live_session" && n.data?.zoomLink) window.open(n.data.zoomLink,"_blank","noopener,noreferrer");
      else if (n.link) navigate(n.link);
    }, 60);
  };

  const markAll = async e => {
    e.stopPropagation(); setBusy(true);
    try { await fetch(`${BASE}/notifications/read-all`,{method:"PUT",headers:H()}); setNotifs(p=>p.map(n=>({...n,read:true}))); setUnread(0); } catch {}
    setBusy(false);
  };

  const ago = d => { const m=Math.floor((Date.now()-new Date(d))/60000); if(m<1)return"Just now"; if(m<60)return`${m}m ago`; const h=Math.floor(m/60); return h<24?`${h}h ago`:`${Math.floor(h/24)}d ago`; };
  const ico = t => ({live_session:"🔴",enrollment:"✅",message:"💬",general:"📢"})[t]||"🔔";

  return (
    <div ref={ref} style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{position:"relative",background:"transparent",border:"none",cursor:"pointer",padding:"6px 8px",borderRadius:8,fontSize:20,lineHeight:1,display:"flex",alignItems:"center"}}>
        🔔
        {unread>0&&<span style={{position:"absolute",top:2,right:2,background:"#ef4444",color:"#fff",fontSize:9,fontWeight:800,minWidth:16,height:16,borderRadius:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>{unread>99?"99+":unread}</span>}
      </button>
      {open&&(
        <div style={{position:"fixed",top:60,right:20,width:340,maxHeight:480,background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",boxShadow:"0 8px 40px rgba(0,0,0,0.15)",zIndex:99999,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #f3f4f6",background:"#f9fafb",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <span style={{fontSize:14,fontWeight:700,color:"#111827"}}>🔔 Notifications {unread>0&&<span style={{background:"#ef4444",color:"#fff",fontSize:10,padding:"1px 6px",borderRadius:999,marginLeft:6}}>{unread}</span>}</span>
            {unread>0&&<button onClick={markAll} disabled={busy} style={{fontSize:11,color:"#0d9488",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>{busy?"...":"Mark all read"}</button>}
          </div>
          <div style={{overflowY:"auto",flex:1}}>
            {notifs.length===0?(
              <div style={{padding:32,textAlign:"center"}}><p style={{fontSize:28}}>🔔</p><p style={{fontSize:13,color:"#9ca3af"}}>No notifications yet</p></div>
            ):notifs.map((n,i)=>(
              <div key={n._id||i} onClick={()=>click(n)}
                style={{padding:"12px 16px",cursor:"pointer",borderBottom:"1px solid #f9fafb",background:n.read?"#fff":"#f0fdf9",display:"flex",gap:10,alignItems:"flex-start",transition:"background 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.background=n.read?"#f9fafb":"#dcfce7"}
                onMouseLeave={e=>e.currentTarget.style.background=n.read?"#fff":"#f0fdf9"}>
                <span style={{fontSize:20,flexShrink:0,marginTop:2}}>{ico(n.type)}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:n.read?500:700,color:"#111827",margin:"0 0 2px",lineHeight:1.4}}>{n.title}</p>
                  <p style={{fontSize:11,color:"#6b7280",margin:"0 0 4px",lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.message}</p>
                  {n.type==="live_session"&&<span style={{fontSize:11,color:"#0d9488",fontWeight:600}}>👆 Click to join</span>}
                  <p style={{fontSize:10,color:"#9ca3af",margin:"2px 0 0"}}>{ago(n.createdAt)}</p>
                </div>
                {!n.read&&<div style={{width:8,height:8,borderRadius:"50%",background:"#0d9488",flexShrink:0,marginTop:5}}/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}