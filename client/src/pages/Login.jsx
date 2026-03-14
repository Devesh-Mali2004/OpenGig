import { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("mentor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "register") {
        // ── REGISTER ──
        const res = await fetch(API_BASE + "/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            role: role === "mentor" ? "trainer" : "trainee",
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.message || "Registration failed"); return; }

        setMessage("Account created! You can now login.");
        setMode("login");
        setName("");
        setEmail("");
        setPassword("");

      } else {
        // ── LOGIN ──
        const res = await fetch(API_BASE + "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.message || "Login failed"); return; }

        loginUser(data, data.token);

        if (data.role === "trainer") navigate("/trainer/dashboard");
        else if (data.role === "admin") navigate("/admin/dashboard");
        else navigate("/dashboard");
      }

    } catch (err) {
      setError("Server error. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Header */}
        <div className="login-header">
          <div className="login-badge">
            <svg className="icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z" stroke="currentColor" strokeWidth="1.8" />
              <path d="M9.5 12l1.8 1.8L15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="login-title">
              {mode === "login"
                ? `${role === "mentor" ? "Mentor" : "Learner"} Login`
                : `${role === "mentor" ? "Mentor" : "Learner"} Register`}
            </h2>
            <p className="login-subtitle">
              {mode === "login"
                ? `Access your ${role} dashboard securely.`
                : `Create your ${role} account in seconds.`}
            </p>
          </div>
        </div>

        {/* Role Switch */}
        <div className="role-switch">
          <button
            type="button"
            className={role === "mentor" ? "role-btn active" : "role-btn"}
            onClick={() => { setRole("mentor"); setError(""); setMessage(""); }}
          >
            Mentor
          </button>
          <button
            type="button"
            className={role === "learner" ? "role-btn active" : "role-btn"}
            onClick={() => { setRole("learner"); setError(""); setMessage(""); }}
          >
            Learner
          </button>
        </div>

        {/* Form */}
        <form className="form" onSubmit={handleSubmit}>

          {/* Name field — only on register */}
          {mode === "register" && (
            <div className="field">
              <div className="label">Full Name</div>
              <div className="input-wrap">
                <input
                  className="input"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="field">
            <div className="label">Email</div>
            <div className="input-wrap">
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <div className="label">Password</div>
            <div className="input-wrap">
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="actions">
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login" ? "Login" : "Register"}
            </button>
          </div>
        </form>

        {/* Alerts */}
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <div className="divider" />

        {/* Mode Switch */}
        <div className="switch-row">
          {mode === "login" ? (
            <>
              <span>Don't have an account?</span>
              <button className="link-btn" type="button"
                onClick={() => { setMode("register"); setError(""); setMessage(""); }}>
                Register
              </button>
            </>
          ) : (
            <>
              <span>Already registered?</span>
              <button className="link-btn" type="button"
                onClick={() => { setMode("login"); setError(""); setMessage(""); }}>
                Login
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}