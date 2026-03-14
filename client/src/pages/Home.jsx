import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    icon: "🤖",
    title: "AI-Powered Recommendations",
    desc: "Get personalized course suggestions using our TF-IDF + Cosine Similarity ML engine.",
  },
  {
    icon: "🎥",
    title: "Live Zoom Sessions",
    desc: "Join real-time training sessions with expert trainers via seamless Zoom integration.",
  },
  {
    icon: "📈",
    title: "Track Your Progress",
    desc: "Monitor enrollments, completed courses, and skill growth in your personal dashboard.",
  },
  {
    icon: "🏆",
    title: "Expert Trainers",
    desc: "Learn from vetted professionals who create, manage, and deliver quality content.",
  },
  {
    icon: "🔒",
    title: "Secure & Trusted",
    desc: "JWT-based authentication with role-based access for Trainees, Trainers, and Admins.",
  },
  {
    icon: "⚡",
    title: "Fast & Modern Stack",
    desc: "Built on MERN stack with a Python ML service — fast, scalable, and production-ready.",
  },
];

const steps = [
  { step: "01", title: "Sign Up", desc: "Create your account as a Trainee or Trainer in seconds." },
  { step: "02", title: "Browse Courses", desc: "Explore AI-recommended courses tailored to your skills." },
  { step: "03", title: "Enroll & Learn", desc: "Join live sessions, track progress, and grow your career." },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "trainer") navigate("/trainer/dashboard");
      else navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div style={{ background: "#0f0f1a", minHeight: "100vh", color: "#fff", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1.2rem 3rem", borderBottom: "1px solid #1e1e2e", position: "sticky", top: 0,
        background: "#0f0f1aee", backdropFilter: "blur(10px)", zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.6rem" }}>🚀</span>
          <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#a78bfa" }}>OpenGig</span>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          {user ? (
            <button onClick={handleCTA} style={btnStyle("#6d28d9")}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => navigate("/login")} style={btnStyle("transparent", "#a78bfa", true)}>
                Login
              </button>
              <button onClick={() => navigate("/login")} style={btnStyle("#6d28d9")}>
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: "center", padding: "6rem 2rem 4rem" }}>
        <div style={{
          display: "inline-block", padding: "0.3rem 1rem", borderRadius: "999px",
          background: "#1e1b4b", color: "#a78bfa", fontSize: "0.85rem",
          marginBottom: "1.5rem", border: "1px solid #4338ca",
        }}>
          ✨ AI-Powered Freelance Training Marketplace
        </div>
        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 800, lineHeight: 1.15, marginBottom: "1.5rem" }}>
          Learn Skills That <br />
          <span style={{ background: "linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Get You Hired
          </span>
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1.15rem", maxWidth: "560px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
          OpenGig connects trainees with expert trainers through AI-recommended courses,
          live sessions, and real-world skill building.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={handleCTA} style={{ ...btnStyle("#6d28d9"), padding: "0.85rem 2.2rem", fontSize: "1rem" }}>
            {user ? "Go to Dashboard →" : "Start Learning Free →"}
          </button>
          <button onClick={() => navigate("/login")} style={{ ...btnStyle("transparent", "#a78bfa", true), padding: "0.85rem 2.2rem", fontSize: "1rem" }}>
            Become a Trainer
          </button>
        </div>

        {/* Stats bar */}
        <div style={{
          display: "flex", justifyContent: "center", gap: "3rem", marginTop: "4rem",
          flexWrap: "wrap",
        }}>
          {[["500+", "Courses"], ["2K+", "Trainees"], ["120+", "Trainers"], ["98%", "Satisfaction"]].map(([num, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#a78bfa" }}>{num}</div>
              <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          Why Choose <span style={{ color: "#a78bfa" }}>OpenGig?</span>
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: "3rem" }}>
          Everything you need to upskill and get hired — in one platform.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {features.map((f) => (
            <div key={f.title} style={{
              background: "#13131f", border: "1px solid #1e1e2e", borderRadius: "14px",
              padding: "1.8rem", transition: "border-color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#4338ca"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e2e"}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.8rem" }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.5rem" }}>{f.title}</h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "4rem 2rem", background: "#0d0d1a" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            How It <span style={{ color: "#a78bfa" }}>Works</span>
          </h2>
          <p style={{ color: "#64748b", marginBottom: "3rem" }}>Three simple steps to start your learning journey.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem" }}>
            {steps.map((s) => (
              <div key={s.step} style={{ textAlign: "center" }}>
                <div style={{
                  width: "60px", height: "60px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #4338ca, #7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1rem", fontSize: "1.1rem", fontWeight: 800,
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{s.title}</h3>
                <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding: "5rem 2rem", textAlign: "center" }}>
        <div style={{
          maxWidth: "700px", margin: "0 auto",
          background: "linear-gradient(135deg, #1e1b4b, #2e1065)",
          borderRadius: "20px", padding: "3.5rem 2rem",
          border: "1px solid #4338ca",
        }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>
            Ready to Level Up? 🚀
          </h2>
          <p style={{ color: "#94a3b8", marginBottom: "2rem", lineHeight: 1.7 }}>
            Join thousands of freelancers building in-demand skills on OpenGig.
            Your next opportunity starts here.
          </p>
          <button onClick={handleCTA} style={{ ...btnStyle("#7c3aed"), padding: "0.9rem 2.5rem", fontSize: "1rem" }}>
            {user ? "Back to Dashboard →" : "Join OpenGig Free →"}
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #1e1e2e", padding: "2rem 3rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem" }}>🚀</span>
          <span style={{ fontWeight: 700, color: "#a78bfa" }}>OpenGig</span>
        </div>
        <p style={{ color: "#334155", fontSize: "0.85rem" }}>
          © 2024 OpenGig. AI-Powered Freelance Training Marketplace.
        </p>
      </footer>
    </div>
  );
}

// ── Button style helper ────────────────────────────────────────────────────────
function btnStyle(bg, color = "#fff", outlined = false) {
  return {
    padding: "0.6rem 1.4rem",
    borderRadius: "8px",
    border: outlined ? `1px solid ${color}` : "none",
    background: bg,
    color: outlined ? color : "#fff",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "opacity 0.2s",
  };
}