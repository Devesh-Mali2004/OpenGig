import "./Home.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

// ── Scroll reveal hook ──────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── Animated counter ────────────────────────────────────────
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = Math.ceil(target / 60);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(start);
          }, 20);
          obs.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Home() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sec1Ref  = useReveal();
  const sec2Ref  = useReveal();
  const cardsRef = useReveal();
  const offerRef = useReveal();
  const testRef  = useReveal();
  const ctaRef   = useReveal();
  const teamRef  = useReveal();
  const statsRef = useReveal();

  return (
    <div>
      <div className="page">

        {/* ══ NAV ══ */}
        <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
          <div className="brand">
            <div className="logo">OG</div>
            <span>OpenGig</span>
          </div>
          <nav className="nav-links">
            <a href="#home">Home</a>
            <a href="#about">About Us</a>
            <a href="#contact">Contact Us</a>
            <a href="#admin">Admin Support</a>
          </nav>
          <div className="nav-actions">
            <button className="btn btn-ghost" onClick={() => navigate("/login")}>Log In</button>
            <button className="btn btn-dark" onClick={() => navigate("/signup")}>Open Account</button>
          </div>
        </header>

        {/* ══ HERO ══ */}
        <main id="home" className="hero">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>

          <div className="faces reveal-item" style={{ "--delay": "0s" }}>
            {[1, 5, 9, 12, 16].map((n) => (
              <div key={n} className="face">
                <img src={`https://i.pravatar.cc/150?img=${n}`} alt="" />
              </div>
            ))}
            <span className="faces-label">1200+ Learners joined</span>
          </div>

          <h1 className="reveal-item" style={{ "--delay": "0.15s" }}>
            Advance your skills.<br />
            Simplify your finances
          </h1>

          <div className="search-row reveal-item" style={{ "--delay": "0.28s" }}>
            <div className="search">
              <input type="text" placeholder="What skill are you looking for?" />
              <span className="search-ic">⌕</span>
            </div>
          </div>

          <button
            className="btn btn-dark pill reveal-item"
            style={{ "--delay": "0.42s" }}
            onClick={() => navigate("/signup")}
          >
            🚀 Book a Mentor
          </button>
        </main>

        {/* ══ STATS ══ */}
        <div className="stats-bar reveal" ref={statsRef}>
          <div className="stat-item">
            <div className="stat-num"><Counter target={1200} suffix="+" /></div>
            <div className="stat-label">Active Learners</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-num"><Counter target={350} suffix="+" /></div>
            <div className="stat-label">Expert Mentors</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-num"><Counter target={98} suffix="%" /></div>
            <div className="stat-label">Satisfaction Rate</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-num"><Counter target={50} suffix="+" /></div>
            <div className="stat-label">Skill Categories</div>
          </div>
        </div>

        {/* ══ SECTION 1 ══ */}
        <section className="section split reveal" id="about" ref={sec1Ref}>
          <div className="reveal-item" style={{ "--delay": "0s" }}>
            <h2>Build <span className="u">today</span> for<br />a better tomorrow</h2>
            <p>Learn from industry mentors, work on real gigs, and gain experience that truly matters. Empowering students and mentors to grow through real-world learning and meaningful collaboration.</p>
            <div className="chip">✦ Services</div>
          </div>
          <div className="round-img reveal-item" style={{ "--delay": "0.18s" }}>
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&h=500&fit=crop&crop=faces" alt="team" />
          </div>
        </section>

        {/* ══ SECTION 2 ══ */}
        <section className="section split reveal" ref={sec2Ref}>
          <div className="round-img small reveal-item" style={{ "--delay": "0s" }}>
            <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=500&fit=crop&crop=faces" alt="progress" />
          </div>
          <div className="reveal-item" style={{ "--delay": "0.18s" }}>
            <h2>See how we can help you progress</h2>
            <p>We connect learners with experienced mentors and real-world gigs that turn knowledge into practical skills and career-ready experience.</p>
          </div>
        </section>

        {/* ══ SERVICES ══ */}
        <section className="section reveal" id="services" ref={cardsRef}>
          <div className="cards-label">✦ Services</div>
          <div className="cards-grid">
            {[
              { icon: "🎓", title: "Learn from Mentors",       sub: "Guided learning with real experts who have hands-on industry experience.",   cls: "green", d: "0s"    },
              { icon: "⭐", title: "Expert Led Learning",      sub: "Practical sessions with weekly goals tailored to your skill level.",         cls: "green", d: "0.08s" },
              { icon: "⚡", title: "Live Skill Sessions",      sub: "Interactive workshops, live Q&A and real project reviews with mentors.",      cls: "dark",  d: "0.16s" },
              { icon: "🎯", title: "Personalised Learning",    sub: "Your pace, your roadmap. Customised learning paths built just for you.",     cls: "light", d: "0.24s" },
              { icon: "✅", title: "Clear and Professional",   sub: "Structured mentorship plans with clear milestones and outcomes.",            cls: "green", d: "0.32s" },
              { icon: "📈", title: "Guided Skill Development", sub: "From absolute basics to advanced techniques with expert support.",           cls: "dark",  d: "0.40s" },
            ].map((c) => (
              <article key={c.title} className={`card ${c.cls} reveal-item`} style={{ "--delay": c.d }}>
                <span className="card-icon">{c.icon}</span>
                <div className="card-title">{c.title}</div>
                <div className="card-sub">{c.sub}</div>
                <button className="mini">Learn more →</button>
              </article>
            ))}
          </div>
        </section>

        {/* ══ OFFER ══ */}
        <section className="section offer reveal" ref={offerRef}>
          <h2 className="reveal-item" style={{ "--delay": "0s" }}>
            What we can offer <span className="u">you!</span>
          </h2>
          <div className="offer-grid">
            <div className="offer-col reveal-item" style={{ "--delay": "0.12s" }}>
              <h3>Opportunities Across Multiple Interests</h3>
              <p>✦ &nbsp;Guided, Real-World Experience</p>
              <p style={{ marginTop: 8 }}>✦ &nbsp;Digital-First Learning &amp; Collaboration</p>
            </div>
            <div className="offer-col reveal-item" style={{ "--delay": "0.22s" }}>
              <h3>Access a wide range of learning areas and gigs</h3>
              <p>Work on practical projects designed to strengthen skills and build confidence through mentor-led guidance.</p>
              <p style={{ marginTop: 10 }}>Engage in content, communication, and project workflows through our reliable platform.</p>
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIAL ══ */}
        <section className="section testimonial reveal" ref={testRef}>
          <h2 className="reveal-item" style={{ "--delay": "0s" }}>
            What our learners say About <span className="u">Us</span>
          </h2>
          <div className="test-wrap">
            <div className="quote reveal-item" style={{ "--delay": "0.12s" }}>
              <div className="qmark">"</div>
              <p>Open Gig helped me connect with experienced mentors and work on real-world projects within a structured timeline. The guidance I received significantly improved my skills, and within a short time, I was able to build a strong portfolio and apply my learning effectively.</p>
            </div>
            <div className="people reveal-item" style={{ "--delay": "0.22s" }}>
              {[20, 25, 30].map((n) => (
                <div key={n} className="bubble">
                  <img src={`https://i.pravatar.cc/150?img=${n}`} alt="" />
                </div>
              ))}
              <div className="person-card">
                <div className="person-img">
                  <img src="https://i.pravatar.cc/150?img=33" alt="" />
                </div>
                <div>
                  <div className="person-name">Arjun Mehta</div>
                  <div className="person-role">Student • Web Dev</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CTA ══ */}
        <section className="section cta reveal" id="contact" ref={ctaRef}>
          <div className="cta-box reveal-item" style={{ "--delay": "0s" }}>
            <div>
              <h2>Let's make things happen</h2>
              <p>Connect with mentors, grow your skills, and turn learning into real results.</p>
              <button className="btn btn-dark" style={{ marginTop: 22 }} onClick={() => navigate("/signup")}>
                Get free slots of your favourite mentors
              </button>
            </div>
            <div className="spark">✦</div>
          </div>
        </section>

        {/* ══ TEAM ══ */}
        <section className="section team reveal" id="admin" ref={teamRef}>
          <div className="team-head">
            <div className="chip">✦ Team</div>
            <p>Meet the mentors and experienced team behind our platform.</p>
          </div>
          <div className="team-grid">
            {[
              { emoji: "👩‍💻", name: "Pratiksha K", role: "Full Stack Mentor", d: "0s"    },
              { emoji: "🎨",  name: "Gaurav I",    role: "UI/UX Mentor",      d: "0.08s" },
              { emoji: "☕",  name: "Devesh M",    role: "Java Mentor",       d: "0.16s" },
              { emoji: "⚙️",  name: "Sohan M",     role: "Backend Mentor",    d: "0.24s" },
            ].map((m) => (
              <article key={m.name} className="team-card reveal-item" style={{ "--delay": m.d }}>
                <div className="avatar">{m.emoji}</div>
                <div className="tname">{m.name}</div>
                <div className="trole">{m.role}</div>
                <div className="tdesc">10+ years of experience. Expertise in real-world projects and mentorship.</div>
              </article>
            ))}
          </div>
        </section>

      </div>

      {/* ══ FOOTER ══ */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="logo">OG</div>
            <p>OpenGig connects learners with industry mentors and real-world projects to build skills that matter.</p>
          </div>
          <div className="footer-links">
            <div>
              <h4>Platform</h4>
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#services">Services</a>
            </div>
            <div>
              <h4>Support</h4>
              <a href="#contact">Contact</a>
              <a href="#admin">Admin Support</a>
              <a href="#home">Privacy Policy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© OpenGig 2026. All rights reserved.</span>
          <span>Built for learning &amp; mentorship</span>
        </div>
      </footer>
    </div>
  );
}