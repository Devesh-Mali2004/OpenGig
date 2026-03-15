import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { sendMessageAPI, getMessagesAPI, getConversationsAPI } from "../api/api";
import axios from "axios";

// Fetch trainers/trainees to start new conversation with
const getChattableUsers = async (myRole) => {
  const token = localStorage.getItem("opengig_token");
  const role  = myRole === "trainer" ? "trainee" : "trainer"; // trainers talk to trainees, trainees talk to trainers
  const res   = await axios.get(`http://localhost:5000/api/users/trainers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default function Chat({ startWithUser = null }) {
  const { user } = useAuth();

  const [conversations,  setConversations]  = useState([]);
  const [activeChat,     setActiveChat]     = useState(startWithUser);
  const [messages,       setMessages]       = useState([]);
  const [inputText,      setInputText]      = useState("");
  const [sending,        setSending]        = useState(false);
  const [error,          setError]          = useState("");
  const [loadingConvs,   setLoadingConvs]   = useState(true);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [showNewChat,    setShowNewChat]    = useState(false);
  const [allUsers,       setAllUsers]       = useState([]);
  const [userSearch,     setUserSearch]     = useState("");
  const [loadingUsers,   setLoadingUsers]   = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pollRef   = useRef(null);

  // ── Load conversations ───────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await getConversationsAPI();
      if (Array.isArray(res.data)) setConversations(res.data);
    } catch (err) {
      console.error("Conversations error:", err?.response?.data || err.message);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages ────────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!activeChat?._id) return;
    try {
      const res = await getMessagesAPI(activeChat._id);
      if (Array.isArray(res.data)) setMessages(res.data);
    } catch (err) {
      console.error("Messages error:", err?.response?.data || err.message);
    }
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat) return;
    setLoadingMsgs(true);
    loadMessages().finally(() => setLoadingMsgs(false));
    clearInterval(pollRef.current);
    pollRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeChat, loadMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Load all users to start new chat ─────────────────────────────────────────
  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getChattableUsers(user?.role);
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load users error:", err?.response?.data || err.message);
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openNewChat = () => {
    setShowNewChat(true);
    setUserSearch("");
    loadAllUsers();
  };

  const startChat = (selectedUser) => {
    setActiveChat(selectedUser);
    setMessages([]);
    setShowNewChat(false);
    setError("");
    setInputText("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── SEND MESSAGE ──────────────────────────────────────────────────────────────
  const sendMsg = async () => {
    const text = inputText.trim();
    if (!text)            { setError("Please type a message."); return; }
    if (!activeChat?._id) { setError("Select a conversation first."); return; }
    if (sending)          return;

    setError("");
    setSending(true);
    setInputText("");

    try {
      const res = await sendMessageAPI({ receiverId: activeChat._id, text });
      if (res.data) {
        setMessages(prev => [...prev, res.data]);
        loadConversations();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to send. Try again.";
      setError(msg);
      setInputText(text); // restore
      console.error("Send error:", msg);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  const myId     = user?._id?.toString();
  const timeStr  = (d) => new Date(d).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  const dateStr  = (d) => {
    const t = new Date(d), today = new Date();
    if (t.toDateString() === today.toDateString()) return "Today";
    const y = new Date(); y.setDate(today.getDate()-1);
    if (t.toDateString() === y.toDateString()) return "Yesterday";
    return t.toLocaleDateString();
  };

  const filteredUsers = allUsers.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div style={{ display:"flex", height:"100%", background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", overflow:"hidden", fontFamily:"ui-sans-serif,system-ui,sans-serif" }}>

      {/* ── LEFT: Sidebar ── */}
      <div style={{ width:270, borderRight:"1px solid #f3f4f6", display:"flex", flexDirection:"column", flexShrink:0 }}>

        {/* Header */}
        <div style={{ padding:"14px 16px", borderBottom:"1px solid #f3f4f6", background:"#f9fafb" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#111827", margin:0 }}>💬 Messages</h3>
              <p style={{ fontSize:11, color:"#9ca3af", margin:"2px 0 0" }}>
                {user?.role === "trainer" ? "Chat with your students" : "Chat with your trainers"}
              </p>
            </div>
            {/* NEW CHAT button */}
            <button
              onClick={openNewChat}
              title="Start new conversation"
              style={{ width:30, height:30, borderRadius:"50%", background:"#0d9488", border:"none", color:"#fff", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              +
            </button>
          </div>
        </div>

        {/* New Chat Panel */}
        {showNewChat && (
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #f3f4f6", background:"#f0fdf4" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <p style={{ fontSize:12, fontWeight:700, color:"#0f766e", margin:0 }}>
                Start New Chat
              </p>
              <button onClick={()=>setShowNewChat(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:16 }}>✕</button>
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              value={userSearch}
              onChange={e=>setUserSearch(e.target.value)}
              style={{ width:"100%", padding:"7px 10px", fontSize:12, border:"1px solid #d1fae5", borderRadius:6, outline:"none", boxSizing:"border-box", marginBottom:8 }}
            />
            <div style={{ maxHeight:150, overflowY:"auto" }}>
              {loadingUsers ? (
                <p style={{ fontSize:12, color:"#9ca3af", textAlign:"center", padding:8 }}>Loading...</p>
              ) : filteredUsers.length === 0 ? (
                <p style={{ fontSize:12, color:"#9ca3af", textAlign:"center", padding:8 }}>No users found</p>
              ) : (
                filteredUsers.map(u => (
                  <div key={u._id} onClick={()=>startChat(u)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 8px", borderRadius:6, cursor:"pointer", marginBottom:2 }}
                    onMouseEnter={e=>e.currentTarget.style.background="#d1fae5"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#0d9488,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:700, flexShrink:0 }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize:12, fontWeight:600, color:"#111827", margin:0 }}>{u.name}</p>
                      <p style={{ fontSize:10, color:"#6b7280", margin:0 }}>{u.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Conversation list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {loadingConvs ? (
            <div style={{ padding:20, textAlign:"center", color:"#9ca3af", fontSize:13 }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding:24, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
              <p style={{ fontSize:12, color:"#9ca3af", margin:0 }}>No conversations yet</p>
              <p style={{ fontSize:11, color:"#d1d5db", margin:"4px 0 0" }}>
                Click <strong>+</strong> to start a new chat
              </p>
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = activeChat?._id === conv.user._id;
              return (
                <div key={conv.user._id} onClick={()=>startChat(conv.user)}
                  style={{ padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #f9fafb", background:isActive?"#f0fdf4":"#fff", transition:"background 0.15s" }}
                  onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="#f9fafb"; }}
                  onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="#fff"; }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#0d9488,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:700, flexShrink:0 }}>
                      {conv.user?.name?.[0]?.toUpperCase()||"?"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{conv.user?.name}</span>
                        {conv.unread > 0 && (
                          <span style={{ background:"#0d9488", color:"#fff", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:999 }}>{conv.unread}</span>
                        )}
                      </div>
                      <p style={{ fontSize:11, color:"#9ca3af", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {conv.lastMessage?.text || ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: Chat window ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {!activeChat ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
            <div style={{ fontSize:48 }}>💬</div>
            <p style={{ fontSize:15, fontWeight:600, color:"#374151", margin:0 }}>Select a conversation</p>
            <p style={{ fontSize:12, color:"#9ca3af", margin:0 }}>Or click <strong>+</strong> to start a new chat</p>
            <button onClick={openNewChat}
              style={{ background:"#0d9488", color:"#fff", border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer", marginTop:4 }}>
              + New Conversation
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #f3f4f6", background:"#f9fafb", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#0d9488,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:700 }}>
                {activeChat.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:700, color:"#111827", margin:0 }}>{activeChat.name}</p>
                <p style={{ fontSize:11, color:"#9ca3af", margin:0, textTransform:"capitalize" }}>{activeChat.role}</p>
              </div>
              <button onClick={openNewChat}
                style={{ fontSize:12, color:"#0d9488", background:"transparent", border:"1px solid #0d9488", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontWeight:600 }}>
                + New
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:2, background:"#fafafa" }}>
              {loadingMsgs ? (
                <div style={{ textAlign:"center", color:"#9ca3af", fontSize:13, marginTop:20 }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign:"center", marginTop:40 }}>
                  <div style={{ fontSize:32 }}>👋</div>
                  <p style={{ color:"#9ca3af", fontSize:13 }}>Say hello to {activeChat.name}!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const senderId = (msg.sender?._id || msg.sender)?.toString();
                  const isMe     = senderId === myId;
                  const showDate = i === 0 || dateStr(msg.createdAt) !== dateStr(messages[i-1].createdAt);
                  return (
                    <div key={msg._id || i}>
                      {showDate && (
                        <div style={{ textAlign:"center", margin:"10px 0 6px", fontSize:11, color:"#9ca3af" }}>— {dateStr(msg.createdAt)} —</div>
                      )}
                      <div style={{ display:"flex", justifyContent:isMe?"flex-end":"flex-start", marginBottom:3 }}>
                        <div style={{
                          maxWidth:"72%", padding:"9px 14px",
                          borderRadius: isMe?"14px 14px 4px 14px":"14px 14px 14px 4px",
                          background:   isMe?"#0d9488":"#ffffff",
                          color:        isMe?"#ffffff":"#111827",
                          fontSize:13, lineHeight:1.5,
                          boxShadow:"0 1px 4px rgba(0,0,0,0.08)",
                          wordBreak:"break-word",
                        }}>
                          <p style={{ margin:0 }}>{msg.text}</p>
                          <p style={{ margin:"3px 0 0", fontSize:10, opacity:0.65, textAlign:"right" }}>{timeStr(msg.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Error bar */}
            {error && (
              <div style={{ padding:"8px 16px", background:"#fef2f2", borderTop:"1px solid #fecaca", color:"#dc2626", fontSize:12, fontWeight:600, display:"flex", justifyContent:"space-between" }}>
                <span>⚠️ {error}</span>
                <button onClick={()=>setError("")} style={{ background:"none", border:"none", cursor:"pointer", color:"#dc2626" }}>✕</button>
              </div>
            )}

            {/* Input */}
            <div style={{ padding:"12px 16px", borderTop:"1px solid #f3f4f6", background:"#fff", flexShrink:0 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={e=>setInputText(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={`Message ${activeChat.name}... (Enter to send)`}
                  disabled={sending}
                  autoComplete="off"
                  style={{ flex:1, padding:"10px 16px", fontSize:13, border:"2px solid #e5e7eb", borderRadius:24, outline:"none", color:"#111827", background:sending?"#f9fafb":"#fff", transition:"border-color 0.2s" }}
                  onFocus={e=>e.target.style.borderColor="#0d9488"}
                  onBlur={e=>e.target.style.borderColor="#e5e7eb"}
                />
                <button
                  onClick={sendMsg}
                  disabled={sending || !inputText.trim()}
                  style={{
                    padding:"10px 22px",
                    background: (sending||!inputText.trim()) ? "#e5e7eb" : "#0d9488",
                    color:      (sending||!inputText.trim()) ? "#9ca3af"  : "#fff",
                    border:"none", borderRadius:24, fontWeight:700, fontSize:13,
                    cursor: (sending||!inputText.trim()) ? "not-allowed" : "pointer",
                    flexShrink:0, minWidth:80, transition:"all 0.2s",
                  }}>
                  {sending ? "⏳" : "Send ➤"}
                </button>
              </div>
              <p style={{ fontSize:10, color:"#d1d5db", textAlign:"center", margin:"4px 0 0" }}>Press Enter or click Send</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}