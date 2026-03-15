import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "#080810",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "2rem 1rem",
    position: "relative",
    overflow: "hidden",
  },
  glow1: {
    position: "fixed", top: "-150px", left: "-150px",
    width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(109,40,217,0.25) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  glow2: {
    position: "fixed", bottom: "-150px", right: "-100px",
    width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    background: "#0f0f1a",
    border: "1px solid #1e1e35",
    borderRadius: "20px",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
    position: "relative",
    zIndex: 1,
  },
  logo: {
    textAlign: "center",
    marginBottom: "1.8rem",
  },
  logoIcon: { fontSize: "2.2rem" },
  logoText: {
    fontSize: "1.6rem", fontWeight: 800,
    background: "linear-gradient(90deg, #818cf8, #a78bfa)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    display: "block", marginTop: "0.2rem",
  },
  tabs: {
    display: "flex", gap: "0.5rem",
    background: "#13131f", borderRadius: "10px",
    padding: "0.3rem", marginBottom: "1.8rem",
  },
  tab: (active) => ({
    flex: 1, padding: "0.6rem", borderRadius: "8px", border: "none",
    cursor: "pointer", fontWeight: 600, fontSize: "0.95rem", transition: "all 0.2s",
    background: active ? "#4338ca" : "transparent",
    color: active ? "#fff" : "#64748b",
  }),
  label: {
    display: "block", color: "#94a3b8",
    fontSize: "0.85rem", fontWeight: 600,
    marginBottom: "0.4rem", marginTop: "1rem",
  },
  input: {
    width: "100%", padding: "0.75rem 1rem",
    borderRadius: "10px", border: "1px solid #1e1e35",
    background: "#13131f", color: "#fff",
    fontSize: "0.95rem", outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  roleGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: "0.8rem", marginTop: "0.4rem",
  },
  roleCard: (active) => ({
    padding: "1rem", borderRadius: "12px", cursor: "pointer",
    border: `2px solid ${active ? "#6d28d9" : "#1e1e35"}`,
    background: active ? "#1e1b4b" : "#13131f",
    textAlign: "center", transition: "all 0.2s",
  }),
  roleIcon: { fontSize: "1.8rem", marginBottom: "0.4rem" },
  roleTitle: (active) => ({
    fontWeight: 700, fontSize: "0.95rem",
    color: active ? "#a78bfa" : "#94a3b8",
  }),
  roleDesc: { fontSize: "0.78rem", color: "#475569", marginTop: "0.2rem" },
  submitBtn: (loading) => ({
    width: "100%", padding: "0.85rem",
    borderRadius: "10px", border: "none",
    background: loading ? "#312e81" : "linear-gradient(135deg, #4338ca, #7c3aed)",
    color: "#fff", fontWeight: 700, fontSize: "1rem",
    cursor: loading ? "not-allowed" : "pointer",
    marginTop: "1.5rem", transition: "opacity 0.2s",
    opacity: loading ? 0.7 : 1,
  }),
  error: {
    background: "#450a0a", border: "1px solid #dc2626",
    color: "#fca5a5", padding: "0.75rem 1rem",
    borderRadius: "8px", fontSize: "0.875rem",
    marginTop: "1rem",
  },
  divider: {
    textAlign: "center", color: "#334155",
    fontSize: "0.85rem", margin: "1.2rem 0 0",
  },
  switchLink: {
    color: "#818cf8", cursor: "pointer",
    fontWeight: 600, textDecoration: "underline",
    background: "none", border: "none", fontSize: "0.85rem",
  },
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate   = useNavigate();
  const { loginUser, registerUser } = useAuth();

  const [tab, setTab]       = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  // Login fields
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Signup fields
  const [signupData, setSignupData] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "trainee", phone: "", bio: "", skills: "",
  });

  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleSignupChange = (e) =>
    setSignupData({ ...signupData, [e.target.name]: e.target.value });

  // ── LOGIN SUBMIT ─────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!loginData.email || !loginData.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const user = await loginUser(loginData.email, loginData.password);
      if (user.role === "admin")   navigate("/admin/dashboard");
      else if (user.role === "trainer") navigate("/trainer/dashboard");
      else navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP SUBMIT ────────────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const { name, email, password, confirmPassword, role, phone, bio, skills } = signupData;

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const payload = { name, email, password, role, phone, bio };
      if (role === "trainee" && skills) payload.skills = skills.split(",").map(s => s.trim());
      if (role === "trainer" && skills) payload.expertise = skills.split(",").map(s => s.trim());

      const user = await registerUser(payload);
      if (user.role === "trainer") navigate("/trainer/dashboard");
      else navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => { setTab(t); setError(""); };

  return (
    <div style={S.page}>
      <div style={S.glow1} />
      <div style={S.glow2} />

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logo}>
          <span style={S.logoIcon}>🚀</span>
          <span style={S.logoText}>OpenGig</span>
          <p style={{ color: "#475569", fontSize: "0.85rem", marginTop: "0.3rem" }}>
            AI-Powered Freelance Training Marketplace
          </p>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          <button style={S.tab(tab === "login")}  onClick={() => switchTab("login")}>Login</button>
          <button style={S.tab(tab === "signup")} onClick={() => switchTab("signup")}>Sign Up</button>
        </div>

        {/* ── LOGIN FORM ── */}
        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <label style={S.label}>Email Address</label>
            <input
              style={S.input} type="email" name="email"
              placeholder="you@example.com"
              value={loginData.email} onChange={handleLoginChange}
              onFocus={e => e.target.style.borderColor = "#6d28d9"}
              onBlur={e  => e.target.style.borderColor = "#1e1e35"}
            />

            <label style={S.label}>Password</label>
            <input
              style={S.input} type="password" name="password"
              placeholder="Enter your password"
              value={loginData.password} onChange={handleLoginChange}
              onFocus={e => e.target.style.borderColor = "#6d28d9"}
              onBlur={e  => e.target.style.borderColor = "#1e1e35"}
            />

            {error && <div style={S.error}>⚠️ {error}</div>}

            <button type="submit" style={S.submitBtn(loading)} disabled={loading}>
              {loading ? "Logging in..." : "Login to OpenGig →"}
            </button>

            <p style={S.divider}>
              Don't have an account?{" "}
              <button type="button" style={S.switchLink} onClick={() => switchTab("signup")}>
                Sign up free
              </button>
            </p>

            {/* Quick demo credentials */}
            <div style={{ marginTop: "1.2rem", padding: "0.8rem", background: "#0d1117", borderRadius: "8px", border: "1px solid #1e1e35" }}>
              <p style={{ color: "#475569", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.4rem" }}>🧪 DEMO CREDENTIALS</p>
              {[
                ["👑 Admin",   "admin@opengig.com",  "admin123"],
                ["🎓 Trainer", "alice@opengig.com",  "trainer123"],
                ["📚 Trainee", "david@opengig.com",  "trainee123"],
              ].map(([role, email, pass]) => (
                <div
                  key={role}
                  onClick={() => setLoginData({ email, password: pass })}
                  style={{ cursor: "pointer", color: "#64748b", fontSize: "0.78rem", padding: "0.2rem 0", display:"flex", gap:"0.5rem" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
                  onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
                >
                  <span>{role}:</span><span>{email}</span>
                </div>
              ))}
            </div>
          </form>
        )}

        {/* ── SIGNUP FORM ── */}
        {tab === "signup" && (
          <form onSubmit={handleSignup}>

            {/* Role Selection */}
            <label style={{ ...S.label, marginTop: 0 }}>I want to join as</label>
            <div style={S.roleGrid}>
              {[
                { value: "trainee", icon: "📚", title: "Trainee", desc: "I want to learn & grow skills" },
                { value: "trainer", icon: "🎓", title: "Trainer", desc: "I want to teach & earn" },
              ].map((r) => (
                <div
                  key={r.value}
                  style={S.roleCard(signupData.role === r.value)}
                  onClick={() => setSignupData({ ...signupData, role: r.value })}
                >
                  <div style={S.roleIcon}>{r.icon}</div>
                  <div style={S.roleTitle(signupData.role === r.value)}>{r.title}</div>
                  <div style={S.roleDesc}>{r.desc}</div>
                </div>
              ))}
            </div>

            {/* Basic Info */}
            <label style={S.label}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              style={S.input} type="text" name="name"
              placeholder="Your full name"
              value={signupData.name} onChange={handleSignupChange}
              onFocus={e => e.target.style.borderColor = "#6d28d9"}
              onBlur={e  => e.target.style.borderColor = "#1e1e35"}
            />

            <label style={S.label}>Email Address <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              style={S.input} type="email" name="email"
              placeholder="you@example.com"
              value={signupData.email} onChange={handleSignupChange}
              onFocus={e => e.target.style.borderColor = "#6d28d9"}
              onBlur={e  => e.target.style.borderColor = "#1e1e35"}
            />

            <label style={S.label}>Phone Number</label>
            <input
              style={S.input} type="tel" name="phone"
              placeholder="+91 9876543210"
              value={signupData.phone} onChange={handleSignupChange}
              onFocus={e => e.target.style.borderColor = "#6d28d9"}
              onBlur={e  => e.target.style.borderColor = "#1e1e35"}
            />

            {/* Role-specific fields */}
            {signupData.role === "trainee" && (
              <>
                <label style={S.label}>Skills I Want to Learn</label>
                <input
                  style={S.input} type="text" name="skills"
                  placeholder="e.g. React, Python, UI/UX (comma separated)"
                  value={signupData.skills} onChange={handleSignupChange}
                  onFocus={e => e.target.style.borderColor = "#6d28d9"}
                  onBlur={e  => e.target.style.borderColor = "#1e1e35"}
                />
              </>
            )}

            {signupData.role === "trainer" && (
              <>
                <label style={S.label}>Areas of Expertise</label>
                <input
                  style={S.input} type="text" name="skills"
                  placeholder="e.g. Node.js, Data Science, DevOps (comma separated)"
                  value={signupData.skills} onChange={handleSignupChange}
                  onFocus={e => e.target.style.borderColor = "#6d28d9"}
                  onBlur={e  => e.target.style.borderColor = "#1e1e35"}
                />
                <label style={S.label}>Short Bio</label>
                <textarea
                  style={{ ...S.input, resize: "vertical", minHeight: "80px" }}
                  name="bio"
                  placeholder="Tell trainees about your experience..."
                  value={signupData.bio} onChange={handleSignupChange}
                  onFocus={e => e.target.style.borderColor = "#6d28d9"}
                  onBlur={e  => e.target.style.borderColor = "#1e1e35"}
                />
              </>
            )}

            {/* Password */}
            <label style={S.label}>Password <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              style={S.input} type="password" name="password"
              placeholder="Min 6 characters"
              value={signupData.password} onChange={handleSignupChange}
              onFocus={e => e.target.style.borderColor = "#6d28d9"}
              onBlur={e  => e.target.style.borderColor = "#1e1e35"}
            />

            <label style={S.label}>Confirm Password <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              style={S.input} type="password" name="confirmPassword"
              placeholder="Repeat your password"
              value={signupData.confirmPassword} onChange={handleSignupChange}
              onFocus={e => e.target.style.borderColor = "#6d28d9"}
              onBlur={e  => e.target.style.borderColor = "#1e1e35"}
            />

            {error && <div style={S.error}>⚠️ {error}</div>}

            <button type="submit" style={S.submitBtn(loading)} disabled={loading}>
              {loading
                ? "Creating account..."
                : `Create ${signupData.role === "trainer" ? "Trainer" : "Trainee"} Account →`}
            </button>

            <p style={S.divider}>
              Already have an account?{" "}
              <button type="button" style={S.switchLink} onClick={() => switchTab("login")}>
                Login here
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}