import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import VideoCall from "./VideoCall";

const BASE = "http://localhost:5000/api";

// ── Standalone fetch helpers — NO 'this' context issues ──────────────────────
function getHeaders() {
  const token = localStorage.getItem("opengig_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiSend(receiverId, text) {
  const res = await fetch(`${BASE}/chat/send`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ receiverId, text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

async function apiGetMessages(userId) {
  const res  = await fetch(`${BASE}/chat/messages/${userId}`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return Array.isArray(data) ? data : [];
}

async function apiGetConversations() {
  const res  = await fetch(`${BASE}/chat/conversations`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return Array.isArray(data) ? data : [];
}

async function apiGetUsers(myRole) {
  const endpoint = myRole === "trainer" ? "trainees" : "trainers";
  const res  = await fetch(`${BASE}/users/${endpoint}`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return Array.isArray(data) ? data : [];
}

export default function Chat() {
  const { user }        = useAuth();
  const { socket, isOnline } = useSocket() || {};

  const [conversations, setConversations] = useState([]);
  const [activeChat,    setActiveChat]    = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [inputText,     setInputText]     = useState("");
  const [sending,       setSending]       = useState(false);
  const [sendError,     setSendError]     = useState("");
  const [loadingConvs,  setLoadingConvs]  = useState(true);
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);
  const [showNewChat,   setShowNewChat]   = useState(false);
  const [allUsers,      setAllUsers]      = useState([]);
  const [userSearch,    setUserSearch]    = useState("");
  const [loadingUsers,  setLoadingUsers]  = useState(false);
  const [typingFrom,    setTypingFrom]    = useState("");
  const [inVideoCall,   setInVideoCall]   = useState(false);
  const [videoRoomId,   setVideoRoomId]   = useState("");

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const typingRef  = useRef(null);
  const activeChatRef = useRef(null);
  const myId = user?._id?.toString();

  // Keep ref in sync so socket listener always has current activeChat
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // ── Real-time: receive messages via socket ────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (msg) => {
      const senderId = (msg.sender?._id || msg.sender)?.toString();
      // If message is from who we're currently chatting with — add to list
      if (activeChatRef.current?._id === senderId) {
        setMessages(prev => {
          // avoid duplicates
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      // Refresh conversations to update last message + unread count
      loadConversations();
    };

    const handleTypingStart = ({ senderName }) => {
      setTypingFrom(senderName);
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => setTypingFrom(""), 3000);
    };

    const handleTypingStop = () => {
      clearTimeout(typingRef.current);
      setTypingFrom("");
    };

    socket.on("message:receive", handleIncoming);
    socket.on("typing:start",    handleTypingStart);
    socket.on("typing:stop",     handleTypingStop);

    return () => {
      socket.off("message:receive", handleIncoming);
      socket.off("typing:start",    handleTypingStart);
      socket.off("typing:stop",     handleTypingStop);
    };
  }, [socket]);

  // ── Load conversations ────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const data = await apiGetConversations();
      setConversations(data);
    } catch (e) {
      console.error("Conversations error:", e.message);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages ─────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    const chat = activeChatRef.current;
    if (!chat?._id) return;
    try {
      const data = await apiGetMessages(chat._id);
      setMessages(data);
    } catch (e) {
      console.error("Messages error:", e.message);
    }
  }, []);

  useEffect(() => {
    if (!activeChat?._id) return;
    setLoadingMsgs(true);
    loadMessages().finally(() => setLoadingMsgs(false));
  }, [activeChat, loadMessages]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── SEND MESSAGE — completely rewritten ────────────────────────────────────
  const sendMsg = async () => {
    const text = inputText.trim();

    // Clear error
    setSendError("");

    // Validate
    if (!text) {
      setSendError("Please type a message.");
      return;
    }
    if (!activeChat?._id) {
      setSendError("Please select a conversation first.");
      return;
    }
    if (sending) return; // prevent double send

    setSending(true);
    setInputText(""); // clear immediately for better UX

    try {
      const msg = await apiSend(activeChat._id, text);

      // Add to local messages immediately
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // Emit via socket for real-time delivery
      if (socket) {
        socket.emit("message:send", { receiverId: activeChat._id, message: msg });
      }

      // Refresh conversation list
      loadConversations();

    } catch (e) {
      console.error("Send error:", e.message);
      setSendError(e.message || "Failed to send. Check your connection.");
      setInputText(text); // restore text on failure
    } finally {
      setSending(false);
      // Refocus input
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
    // Emit typing indicator
    if (socket && activeChat?._id && e.key !== "Enter") {
      socket.emit("typing:start", { receiverId: activeChat._id, senderName: user?.name });
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => {
        socket?.emit("typing:stop", { receiverId: activeChat._id });
      }, 1500);
    }
  };

  // ── New chat ──────────────────────────────────────────────────────────────
  const openNewChat = async () => {
    setShowNewChat(true);
    setUserSearch("");
    setLoadingUsers(true);
    try {
      const data = await apiGetUsers(user?.role);
      setAllUsers(data);
    } catch (e) {
      console.error("Load users:", e.message);
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const startChat = (selectedUser) => {
    setActiveChat(selectedUser);
    setMessages([]);
    setShowNewChat(false);
    setSendError("");
    setInputText("");
    setTypingFrom("");
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // ── Video call ────────────────────────────────────────────────────────────
  const startVideoCall = () => {
    if (!activeChat?._id) return;
    const roomId = `chat-${[myId, activeChat._id].sort().join("-").slice(-24)}`;
    setVideoRoomId(roomId);
    setInVideoCall(true);
  };

  const timeStr = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = (d) => {
    const t = new Date(d), today = new Date();
    if (t.toDateString() === today.toDateString()) return "Today";
    const y = new Date(); y.setDate(today.getDate() - 1);
    if (t.toDateString() === y.toDateString()) return "Yesterday";
    return t.toLocaleDateString();
  };

  const filteredUsers = allUsers.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (inVideoCall) {
    return (
      <VideoCall
        roomName={videoRoomId}
        isHost={user?.role === "trainer"}
        onClose={() => setInVideoCall(false)}
      />
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", fontFamily: "ui-sans-serif,system-ui,sans-serif" }}>

      {/* LEFT: Conversation Sidebar */}
      <div style={{ width: 270, borderRight: "1px solid #f3f4f6", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>💬 Messages</h3>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>
                {user?.role === "trainer" ? "Chat with students" : "Chat with trainers"}
              </p>
            </div>
            <button onClick={openNewChat} title="Start new conversation"
              style={{ width: 32, height: 32, borderRadius: "50%", background: "#0d9488", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, fontWeight: 300 }}>
              +
            </button>
          </div>
        </div>

        {/* New Chat Search */}
        {showNewChat && (
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", background: "#f0fdf4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", margin: 0 }}>
                {user?.role === "trainer" ? "Find a Student" : "Find a Trainer"}
              </p>
              <button onClick={() => setShowNewChat(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <input type="text" placeholder="Search by name..."
              value={userSearch} onChange={e => setUserSearch(e.target.value)}
              autoFocus
              style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: "1px solid #d1fae5", borderRadius: 6, outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
            <div style={{ maxHeight: 160, overflowY: "auto" }}>
              {loadingUsers ? (
                <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: 8, margin: 0 }}>Loading...</p>
              ) : filteredUsers.length === 0 ? (
                <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: 8, margin: 0 }}>
                  {userSearch ? "No matches" : "No users found"}
                </p>
              ) : filteredUsers.map(u => (
                <div key={u._id} onClick={() => startChat(u)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#d1fae5"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ position: "relative" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#0d9488,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    {isOnline?.(u._id) && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", border: "1.5px solid #fff", position: "absolute", bottom: 0, right: 0 }} />
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{u.name}</p>
                    <p style={{ fontSize: 10, color: "#6b7280", margin: 0, textTransform: "capitalize" }}>
                      {u.role} {isOnline?.(u._id) ? "· 🟢 Online" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingConvs ? (
            <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 28, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>No messages yet</p>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Tap <b>+</b> to start chatting</p>
            </div>
          ) : conversations.map(conv => {
            const isActive = activeChat?._id === conv.user?._id;
            const online   = isOnline?.(conv.user?._id);
            return (
              <div key={conv.user._id} onClick={() => startChat(conv.user)}
                style={{ padding: "12px 14px", cursor: "pointer", borderBottom: "1px solid #f9fafb", background: isActive ? "#f0fdf4" : "#fff", transition: "background 0.15s" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "#fff"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#0d9488,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>
                      {conv.user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    {online && (
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", border: "2px solid #fff", position: "absolute", bottom: 0, right: 0 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{conv.user?.name}</span>
                      {conv.unread > 0 && (
                        <span style={{ background: "#0d9488", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999 }}>{conv.unread}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.lastMessage?.text || "Start chatting..."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Chat Window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!activeChat ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div style={{ fontSize: 56 }}>💬</div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#374151", margin: 0 }}>Your Messages</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Select a conversation or start a new one</p>
            <button onClick={openNewChat}
              style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>
              + Start New Chat
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#0d9488,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>
                  {activeChat.name?.[0]?.toUpperCase()}
                </div>
                {isOnline?.(activeChat._id) && (
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", border: "2px solid #fff", position: "absolute", bottom: 0, right: 0 }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{activeChat.name}</p>
                <p style={{ fontSize: 11, color: isOnline?.(activeChat._id) ? "#22c55e" : "#9ca3af", margin: 0 }}>
                  {isOnline?.(activeChat._id) ? "🟢 Online" : "⚫ Offline"}
                </p>
              </div>
              <button onClick={startVideoCall}
                style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                🎥 Video Call
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", background: "#fafafa" }}>
              {loadingMsgs ? (
                <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 20 }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", marginTop: 40 }}>
                  <div style={{ fontSize: 40 }}>👋</div>
                  <p style={{ color: "#6b7280", fontSize: 14, fontWeight: 600, margin: "8px 0 4px" }}>Say hello to {activeChat.name}!</p>
                  <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>Your messages are end-to-end private</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const sid  = (msg.sender?._id || msg.sender)?.toString();
                  const isMe = sid === myId;
                  const showDate = i === 0 || dateStr(msg.createdAt) !== dateStr(messages[i - 1]?.createdAt);
                  return (
                    <div key={msg._id || i}>
                      {showDate && (
                        <div style={{ textAlign: "center", margin: "12px 0 8px", fontSize: 11, color: "#9ca3af" }}>
                          — {dateStr(msg.createdAt)} —
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 4, gap: 6 }}>
                        {!isMe && (
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#374151", flexShrink: 0, alignSelf: "flex-end" }}>
                            {(msg.sender?.name || activeChat.name)?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div style={{
                          maxWidth: "68%", padding: "9px 14px",
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          background: isMe ? "#0d9488" : "#fff",
                          color:      isMe ? "#fff"    : "#111827",
                          fontSize: 13, lineHeight: 1.55,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          wordBreak: "break-word",
                        }}>
                          <p style={{ margin: 0 }}>{msg.text}</p>
                          <p style={{ margin: "3px 0 0", fontSize: 10, opacity: 0.65, textAlign: "right" }}>{timeStr(msg.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Typing indicator */}
              {typingFrom && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#9ca3af", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{typingFrom} is typing...</span>
                  <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }`}</style>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Error */}
            {sendError && (
              <div style={{ padding: "8px 16px", background: "#fef2f2", borderTop: "1px solid #fecaca", color: "#dc2626", fontSize: 12, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <span>⚠️ {sendError}</span>
                <button onClick={() => setSendError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 18, padding: 0 }}>×</button>
              </div>
            )}

            {/* Input */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #f3f4f6", background: "#fff", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={`Message ${activeChat.name}...`}
                  disabled={sending}
                  autoComplete="off"
                  style={{
                    flex: 1, padding: "11px 16px", fontSize: 13,
                    border: "2px solid #e5e7eb", borderRadius: 25, outline: "none",
                    color: "#111827", background: sending ? "#f9fafb" : "#fff",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#0d9488"}
                  onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
                />
                <button
                  onClick={sendMsg}
                  disabled={sending || !inputText.trim()}
                  style={{
                    width: 44, height: 44, borderRadius: "50%", border: "none",
                    background: (sending || !inputText.trim()) ? "#e5e7eb" : "#0d9488",
                    color:      (sending || !inputText.trim()) ? "#9ca3af" : "#fff",
                    fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: (sending || !inputText.trim()) ? "not-allowed" : "pointer",
                    flexShrink: 0, transition: "all 0.2s",
                  }}>
                  {sending ? "⏳" : "➤"}
                </button>
              </div>
              <p style={{ fontSize: 10, color: "#d1d5db", textAlign: "center", margin: "4px 0 0" }}>
                Press Enter to send · 🎥 Video call available
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}