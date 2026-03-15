import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

// ── Socket.io client (loaded from CDN to avoid npm install issues) ─────────────
const loadSocketIO = () => {
  return new Promise((resolve) => {
    if (window.io) { resolve(window.io); return; }
    const script    = document.createElement("script");
    script.src      = "https://cdn.socket.io/4.7.2/socket.io.min.js";
    script.onload   = () => resolve(window.io);
    script.onerror  = () => resolve(null);
    document.head.appendChild(script);
  });
};

export function SocketProvider({ children }) {
  const { user }    = useAuth();
  const socketRef   = useRef(null);
  const [socket,    setSocket]    = useState(null);
  const [onlineIds, setOnlineIds] = useState([]);

  useEffect(() => {
    if (!user?._id) {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    let mounted = true;

    loadSocketIO().then((io) => {
      if (!io || !mounted) return;

      const sock = io("http://localhost:5000", {
        transports:        ["websocket", "polling"],
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      sock.on("connect", () => {
        console.log("🔌 Socket connected:", sock.id);
        sock.emit("user:join", user._id);
      });

      sock.on("disconnect", () => {
        console.log("🔌 Socket disconnected");
      });

      sock.on("users:online", (ids) => {
        setOnlineIds(ids || []);
      });

      sock.on("connect_error", (err) => {
        console.warn("Socket connect error:", err.message);
      });

      socketRef.current = sock;
      if (mounted) setSocket(sock);
    });

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [user?._id]);

  const isOnline = (userId) => onlineIds.includes(userId?.toString());

  return (
    <SocketContext.Provider value={{ socket, onlineIds, isOnline }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);