import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * VideoCall Component
 * Uses Jitsi Meet — FREE, no API key, no account needed
 * Works instantly in any browser
 *
 * Props:
 *   roomName  — unique room ID (e.g. course ID or session ID)
 *   onClose   — callback when call ends
 *   isHost    — true if trainer (can mute others, end call)
 */
export default function VideoCall({ roomName, onClose, isHost = false }) {
  const { user } = useAuth();
  const containerRef = useRef(null);
  const apiRef       = useRef(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [participants, setParticipants] = useState(1);

  const cleanRoom = roomName
    ? `opengig-${roomName.toString().replace(/[^a-zA-Z0-9]/g, "").slice(0, 30)}`
    : `opengig-room-${Math.random().toString(36).slice(2, 8)}`;

  useEffect(() => {
    // Load Jitsi script
    const script = document.createElement("script");
    script.src   = "https://meet.jit.si/external_api.js";
    script.async = true;

    script.onload = () => {
      if (!containerRef.current) return;

      try {
        const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
          roomName: cleanRoom,
          parentNode: containerRef.current,
          width:  "100%",
          height: "100%",
          userInfo: {
            displayName: user?.name || "OpenGig User",
            email:       user?.email || "",
          },
          configOverwrite: {
            startWithAudioMuted:  false,
            startWithVideoMuted:  false,
            disableDeepLinking:   true,
            enableNoisyMicDetection: false,
            prejoinPageEnabled:   false,   // skip pre-join screen
            disableInviteFunctions: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK:         false,
            SHOW_WATERMARK_FOR_GUESTS:    false,
            SHOW_BRAND_WATERMARK:         false,
            DEFAULT_BACKGROUND:           "#111827",
            TOOLBAR_BUTTONS: [
              "microphone", "camera", "closedcaptions",
              "desktop", "fullscreen", "fodeviceselection",
              "hangup", "chat", "recording", "raisehand",
              "videoquality", "tileview", "participants-pane",
              "settings", "shortcuts",
            ],
          },
        });

        apiRef.current = api;
        setLoading(false);

        // Event listeners
        api.addEventListener("readyToClose", () => {
          onClose && onClose();
        });

        api.addEventListener("participantJoined", () => {
          api.getNumberOfParticipants().then(n => setParticipants(n));
        });

        api.addEventListener("participantLeft", () => {
          api.getNumberOfParticipants().then(n => setParticipants(n));
        });

        api.addEventListener("videoConferenceLeft", () => {
          onClose && onClose();
        });

      } catch (err) {
        setError("Failed to load video call. Please check your internet connection.");
        setLoading(false);
      }
    };

    script.onerror = () => {
      setError("Failed to load Jitsi. Check your internet connection.");
      setLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch {}
        apiRef.current = null;
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [cleanRoom, user]);

  const handleEndCall = () => {
    if (apiRef.current) {
      try { apiRef.current.executeCommand("hangup"); } catch {}
    }
    onClose && onClose();
  };

  const handleMuteAll = () => {
    if (apiRef.current && isHost) {
      try { apiRef.current.executeCommand("muteEveryone", "audio"); } catch {}
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#111827", display: "flex", flexDirection: "column",
    }}>
      {/* Header bar */}
      <div style={{
        background: "#1f2937", padding: "10px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #374151", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🎥</span>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>
              OpenGig Live Session
            </p>
            <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>
              {loading ? "Connecting..." : `${participants} participant(s) • Room: ${cleanRoom.slice(0, 20)}`}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isHost && !loading && (
            <button onClick={handleMuteAll}
              style={{ background: "#374151", color: "#d1d5db", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              🔇 Mute All
            </button>
          )}
          <button onClick={handleEndCall}
            style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
            {isHost ? "⏹ End Session" : "🚪 Leave"}
          </button>
        </div>
      </div>

      {/* Video container */}
      <div style={{ flex: 1, position: "relative" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, border: "3px solid #374151", borderTop: "3px solid #0d9488", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#9ca3af", fontSize: 14 }}>Starting video call...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {error && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 40 }}>⚠️</span>
            <p style={{ color: "#fca5a5", fontSize: 14, fontWeight: 600 }}>{error}</p>
            <button onClick={onClose}
              style={{ background: "#374151", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer" }}>
              Close
            </button>
          </div>
        )}
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}