import { useState, useEffect } from "react";
import {
  getCourseReviewsAPI, enrollCourseAPI,
  createPaymentOrderAPI, verifyPaymentAPI,
  getCourseById,
} from "../api/api";

const CAT_ICONS = {
  "Web Dev":"💻","AI / ML":"🤖","Data Science":"📊","Design":"🎨",
  "Mobile Dev":"📱","DevOps":"⚙️","Blockchain":"🔗","Freelancing":"💼",
  "Marketing":"📣","Cybersecurity":"🔒","General":"📚",
};

function Stars({ rating, size = 14 }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? "#f59e0b" : "#e5e7eb", fontSize: size }}>★</span>
      ))}
    </span>
  );
}

function Chip({ children }) {
  return (
    <span style={{ background:"rgba(255,255,255,0.22)", padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:600 }}>
      {children}
    </span>
  );
}

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function CourseDetailModal({ course: initialCourse, isEnrolled: initialEnrolled, onClose, onEnrollSuccess, user }) {
  const [course,      setCourse]      = useState(initialCourse);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [reviews,     setReviews]     = useState([]);
  const [avgRating,   setAvgRating]   = useState(0);
  const [loadingRevs, setLoadingRevs] = useState(true);
  const [enrolled,    setEnrolled]    = useState(initialEnrolled);
  const [enrolling,   setEnrolling]   = useState(false);
  const [paying,      setPaying]      = useState(false);
  const [toast,       setToast]       = useState(null);

  const isPaid   = (course.price || 0) > 0;
  const catIcon  = CAT_ICONS[course.category] || "📚";
  const revCount = reviews.length;

  // Fetch full course (ensures Mentor is populated even when coming from enrolled list)
  useEffect(() => {
    getCourseById(course._id)
      .then(r => setCourse(r.data))
      .catch(() => {});
    fetchReviews();
    const handleEsc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchReviews = async () => {
    setLoadingRevs(true);
    try {
      const r = await getCourseReviewsAPI(initialCourse._id);
      setReviews(r.data?.reviews || []);
      setAvgRating(r.data?.avgRating || 0);
    } catch {}
    finally { setLoadingRevs(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Free enroll ────────────────────────────────────────────────────────────
  const handleEnrollFree = async () => {
    setEnrolling(true);
    try {
      await enrollCourseAPI(course._id);
      setEnrolled(true);
      showToast("Enrolled successfully! 🎉");
      onEnrollSuccess();
    } catch(e) {
      showToast(e?.response?.data?.message || "Failed to enroll.", "error");
    } finally { setEnrolling(false); }
  };

  // ── Razorpay checkout ──────────────────────────────────────────────────────
  const handlePay = async () => {
    const loaded = await loadRazorpay();
    if (!loaded) { showToast("Payment gateway failed to load.", "error"); return; }
    setPaying(true);
    try {
      const res = await createPaymentOrderAPI({ courseId: course._id });
      const { orderId, amount, currency, keyId } = res.data;

      const options = {
        key:         keyId,
        amount,
        currency,
        name:        "OpenGig",
        description: course.title,
        order_id:    orderId,
        handler: async response => {
          try {
            await verifyPaymentAPI({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              courseId:            course._id,
            });
            setEnrolled(true);
            showToast("Payment successful! You're now enrolled 🎉");
            onEnrollSuccess();
          } catch {
            showToast("Payment verification failed. Contact support.", "error");
          } finally { setPaying(false); }
        },
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme:   { color: "#0d9488" },
        modal:   { ondismiss: () => setPaying(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => { showToast("Payment failed. Try again.", "error"); setPaying(false); });
      rzp.open();
    } catch(e) {
      showToast(e?.response?.data?.message || "Could not initiate payment.", "error");
      setPaying(false);
    }
  };

  // ── Video helpers ──────────────────────────────────────────────────────────
  const getYTEmbed = url => {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|watch\?v=|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null;
  };
  const isVideoFile = url => url && /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  // ── Backdrop click ─────────────────────────────────────────────────────────
  const onBackdrop = e => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div onClick={onBackdrop} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:1000,
      display:"flex", alignItems:"flex-start", justifyContent:"center",
      padding:"32px 16px", overflowY:"auto", backdropFilter:"blur(3px)",
    }}>
      <div style={{
        background:"#fff", borderRadius:20, width:"100%", maxWidth:980,
        position:"relative", boxShadow:"0 32px 100px rgba(0,0,0,0.28)",
        marginBottom:40,
      }}>

        {/* ── Close button ── */}
        <button onClick={onClose} style={{
          position:"absolute", top:14, right:14, zIndex:10,
          width:34, height:34, borderRadius:"50%", background:"rgba(0,0,0,0.55)",
          color:"#fff", border:"none", cursor:"pointer", fontSize:18,
          display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700,
        }}>✕</button>

        {/* ── Hero banner ── */}
        <div style={{
          background:"linear-gradient(135deg,#0d9488 0%,#7c3aed 100%)",
          borderRadius:"20px 20px 0 0", padding:"28px 32px 22px", color:"#fff",
        }}>
          <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
            <div style={{
              width:56, height:56, borderRadius:14, background:"rgba(255,255,255,0.18)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:28, flexShrink:0,
            }}>{catIcon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                <Chip>{course.category || "General"}</Chip>
                <Chip>{course.level || "Beginner"}</Chip>
                {course.demoVideo && <Chip>🎬 Demo Available</Chip>}
                {!isPaid && <Chip>🆓 Free</Chip>}
              </div>
              <h2 style={{ fontSize:22, fontWeight:800, margin:"0 0 10px", lineHeight:1.3, paddingRight:40 }}>
                {course.title}
              </h2>
              <div style={{ display:"flex", gap:18, flexWrap:"wrap", alignItems:"center", fontSize:13, opacity:0.92 }}>
                <span>👨‍🏫 {course.Mentor?.name || "Mentor"}</span>
                {avgRating > 0 && (
                  <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <Stars rating={avgRating} size={13} />
                    <strong>{Number(avgRating).toFixed(1)}</strong>
                    <span style={{ opacity:0.75 }}>({revCount} review{revCount !== 1 ? "s" : ""})</span>
                  </span>
                )}
                <span>👥 {course.studentsEnrolled || 0} students</span>
                {course.duration && <span>⏱ {course.duration}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body: left tabs + right enrollment card ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 290px" }}>

          {/* ── Left: tab content ── */}
          <div style={{ borderRight:"1px solid #f3f4f6" }}>

            {/* Tab nav */}
            <div style={{ display:"flex", borderBottom:"1px solid #f3f4f6", padding:"0 28px" }}>
              {[
                { id:"overview", label:"📋 Overview" },
                { id:"demo",     label:"🎬 Demo Video", disabled:!course.demoVideo },
                { id:"reviews",  label:`⭐ Reviews (${revCount})` },
              ].map(t => (
                <button key={t.id}
                  onClick={() => !t.disabled && setActiveTab(t.id)}
                  style={{
                    padding:"14px 18px", fontSize:13, fontWeight:600, border:"none",
                    background:"transparent", cursor:t.disabled ? "default" : "pointer",
                    color: t.disabled ? "#d1d5db" : activeTab === t.id ? "#0d9488" : "#6b7280",
                    borderBottom: activeTab === t.id ? "2px solid #0d9488" : "2px solid transparent",
                    marginBottom:-1, transition:"all 0.15s",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding:"24px 28px 28px" }}>

              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && (
                <div>
                  <h3 style={SH}>About This Course</h3>
                  <p style={{ fontSize:14, color:"#374151", lineHeight:1.75, marginBottom:20 }}>
                    {course.description}
                  </p>

                  {course.skillTags?.length > 0 && (
                    <div style={{ marginBottom:20 }}>
                      <h4 style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:8 }}>Skills You'll Gain</h4>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {course.skillTags.map(tag => (
                          <span key={tag} style={{
                            background:"#f0fdf4", color:"#0f766e",
                            padding:"4px 12px", borderRadius:999, fontSize:12, fontWeight:600,
                            border:"1px solid #bbf7d0",
                          }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {course.Mentor && (
                    <div style={{ background:"#f9fafb", borderRadius:12, padding:16, border:"1px solid #f3f4f6" }}>
                      <h4 style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:10, marginTop:0 }}>Your Mentor</h4>
                      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                        <div style={{
                          width:44, height:44, borderRadius:"50%",
                          background:"linear-gradient(135deg,#0d9488,#7c3aed)",
                          color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:18, fontWeight:700, flexShrink:0,
                        }}>
                          {course.Mentor.name?.[0]?.toUpperCase() || "T"}
                        </div>
                        <div>
                          <p style={{ fontWeight:700, color:"#111827", margin:"0 0 2px", fontSize:14 }}>{course.Mentor.name}</p>
                          <p style={{ fontSize:12, color:"#6b7280", margin:0 }}>{course.Mentor.email}</p>
                          {course.Mentor.bio && (
                            <p style={{ fontSize:13, color:"#374151", marginTop:6, lineHeight:1.55 }}>{course.Mentor.bio}</p>
                          )}
                          {course.Mentor.expertise?.length > 0 && (
                            <div style={{ marginTop:6, display:"flex", flexWrap:"wrap", gap:4 }}>
                              {(Array.isArray(course.Mentor.expertise) ? course.Mentor.expertise : [course.Mentor.expertise])
                                .slice(0, 5).map(e => (
                                  <span key={e} style={{
                                    background:"#eff6ff", color:"#1d4ed8",
                                    fontSize:11, padding:"2px 8px", borderRadius:999, fontWeight:600,
                                  }}>{e}</span>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── DEMO VIDEO ── */}
              {activeTab === "demo" && (
                <div>
                  <h3 style={SH}>Free Demo Preview</h3>
                  <p style={{ fontSize:12, color:"#9ca3af", marginBottom:16, marginTop:-4 }}>
                    A free preview of this course — visible to everyone, no account needed.
                  </p>
                  {course.demoVideo ? (
                    <div style={{ borderRadius:12, overflow:"hidden", background:"#000", position:"relative", paddingTop:"56.25%" }}>
                      {getYTEmbed(course.demoVideo) ? (
                        <iframe
                          src={getYTEmbed(course.demoVideo)}
                          title="Course demo"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none" }}
                        />
                      ) : isVideoFile(course.demoVideo) ? (
                        <video
                          src={course.demoVideo} controls
                          style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%" }}
                        />
                      ) : (
                        <iframe
                          src={course.demoVideo} title="Course demo" allowFullScreen
                          style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none" }}
                        />
                      )}
                    </div>
                  ) : (
                    <div style={{ padding:48, textAlign:"center", background:"#f9fafb", borderRadius:12, border:"1px dashed #e5e7eb" }}>
                      <p style={{ fontSize:36, marginBottom:8 }}>🎬</p>
                      <p style={{ fontSize:13, color:"#9ca3af" }}>No demo video added yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── REVIEWS ── */}
              {activeTab === "reviews" && (
                <div>
                  {/* Rating summary bar */}
                  {revCount > 0 && (
                    <div style={{
                      display:"flex", alignItems:"center", gap:24,
                      padding:"14px 18px", background:"#fffbeb",
                      borderRadius:12, marginBottom:20, border:"1px solid #fde68a",
                    }}>
                      <div style={{ textAlign:"center", flexShrink:0 }}>
                        <p style={{ fontSize:36, fontWeight:800, color:"#f59e0b", margin:0, lineHeight:1 }}>
                          {Number(avgRating).toFixed(1)}
                        </p>
                        <div style={{ margin:"4px 0" }}><Stars rating={avgRating} size={16} /></div>
                        <p style={{ fontSize:11, color:"#9ca3af", margin:0 }}>
                          {revCount} review{revCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        {[5,4,3,2,1].map(n => {
                          const cnt = reviews.filter(r => r.rating === n).length;
                          const pct = revCount > 0 ? (cnt / revCount) * 100 : 0;
                          return (
                            <div key={n} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                              <span style={{ fontSize:11, color:"#6b7280", width:7, flexShrink:0 }}>{n}</span>
                              <span style={{ color:"#f59e0b", fontSize:11, flexShrink:0 }}>★</span>
                              <div style={{ flex:1, height:6, background:"#f3f4f6", borderRadius:999, overflow:"hidden" }}>
                                <div style={{ width:`${pct}%`, height:"100%", background:"#f59e0b", borderRadius:999 }}/>
                              </div>
                              <span style={{ fontSize:11, color:"#9ca3af", width:20, textAlign:"right", flexShrink:0 }}>{cnt}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {loadingRevs ? (
                    <p style={{ textAlign:"center", color:"#9ca3af", fontSize:13, padding:20 }}>Loading reviews...</p>
                  ) : reviews.length === 0 ? (
                    <div style={{ padding:40, textAlign:"center", background:"#f9fafb", borderRadius:12, border:"1px dashed #e5e7eb" }}>
                      <p style={{ fontSize:32, marginBottom:8 }}>⭐</p>
                      <p style={{ fontWeight:600, color:"#111827", marginBottom:4 }}>No reviews yet</p>
                      <p style={{ fontSize:12, color:"#9ca3af" }}>Enroll and be the first to review!</p>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {reviews.map(r => (
                        <div key={r._id} style={{ background:"#f9fafb", borderRadius:10, padding:"14px 16px", border:"1px solid #f3f4f6" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{
                                width:34, height:34, borderRadius:"50%",
                                background:"linear-gradient(135deg,#0d9488,#7c3aed)",
                                color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:13, fontWeight:700, flexShrink:0,
                              }}>
                                {r.user?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p style={{ fontSize:13, fontWeight:600, color:"#111827", margin:0 }}>{r.user?.name || "Learner"}</p>
                                <p style={{ fontSize:10, color:"#9ca3af", margin:"1px 0 0" }}>
                                  {new Date(r.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                                </p>
                              </div>
                            </div>
                            <Stars rating={r.rating} size={14} />
                          </div>
                          {r.comment && (
                            <p style={{ fontSize:13, color:"#374151", margin:0, lineHeight:1.65, fontStyle:"italic", paddingLeft:44 }}>
                              "{r.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: enrollment card ── */}
          <div style={{ padding:"24px 20px" }}>
            <div style={{ position:"sticky", top:24 }}>

              {/* Price */}
              <div style={{ background:"#f9fafb", borderRadius:14, border:"1px solid #e5e7eb", padding:"18px 18px 16px", marginBottom:12 }}>
                <div style={{ textAlign:"center", marginBottom:16, paddingBottom:16, borderBottom:"1px solid #e5e7eb" }}>
                  {isPaid ? (
                    <>
                      <p style={{ fontSize:32, fontWeight:800, color:"#111827", margin:0 }}>
                        ₹{(course.price).toLocaleString("en-IN")}
                      </p>
                      <p style={{ fontSize:11, color:"#9ca3af", margin:"3px 0 0" }}>One-time · Lifetime access</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize:30, fontWeight:800, color:"#16a34a", margin:0 }}>FREE</p>
                      <p style={{ fontSize:11, color:"#9ca3af", margin:"3px 0 0" }}>No credit card required</p>
                    </>
                  )}
                </div>

                {/* CTA */}
                {enrolled ? (
                  <div style={{ textAlign:"center", padding:"12px 0", background:"#f0fdf4", borderRadius:10, border:"1px solid #bbf7d0" }}>
                    <p style={{ fontSize:15, fontWeight:700, color:"#16a34a", margin:0 }}>✅ You're Enrolled</p>
                    <p style={{ fontSize:11, color:"#6b7280", margin:"4px 0 0" }}>Full access granted</p>
                  </div>
                ) : isPaid ? (
                  <button onClick={handlePay} disabled={paying} style={{
                    width:"100%", padding:"13px 0",
                    background: paying ? "#9ca3af" : "#0d9488",
                    color:"#fff", border:"none", borderRadius:10,
                    fontSize:14, fontWeight:700,
                    cursor: paying ? "not-allowed" : "pointer",
                    boxShadow: paying ? "none" : "0 4px 14px rgba(13,148,136,0.35)",
                    transition:"all 0.2s",
                  }}>
                    {paying ? "⏳ Processing..." : `💳 Buy Now — ₹${course.price.toLocaleString("en-IN")}`}
                  </button>
                ) : (
                  <button onClick={handleEnrollFree} disabled={enrolling} style={{
                    width:"100%", padding:"13px 0",
                    background: enrolling ? "#9ca3af" : "#0d9488",
                    color:"#fff", border:"none", borderRadius:10,
                    fontSize:14, fontWeight:700,
                    cursor: enrolling ? "not-allowed" : "pointer",
                    boxShadow: enrolling ? "none" : "0 4px 14px rgba(13,148,136,0.35)",
                    transition:"all 0.2s",
                  }}>
                    {enrolling ? "⏳ Enrolling..." : "🎓 Enroll Free — Start Now"}
                  </button>
                )}
              </div>

              {/* Course meta chips */}
              <div style={{ background:"#f9fafb", borderRadius:12, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                {[
                  ["📊", "Level",    course.level || "Beginner"],
                  ["🏷️", "Category", course.category || "General"],
                  ["👥", "Students", `${course.studentsEnrolled || 0} enrolled`],
                  ...(course.duration   ? [["⏱", "Duration",   course.duration]]        : []),
                  ...(course.demoVideo  ? [["🎬", "Demo video", "Free preview"]]         : []),
                  ...(isPaid            ? [["💳", "Payment",    "One-time"]]             : [["✅", "Price", "Free forever"]]),
                ].map(([icon, label, val], i, arr) => (
                  <div key={label} style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"9px 14px", fontSize:12,
                    borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
                  }}>
                    <span style={{ color:"#6b7280" }}>{icon} {label}</span>
                    <span style={{ fontWeight:600, color:"#374151" }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Watch demo shortcut */}
              {course.demoVideo && activeTab !== "demo" && (
                <button onClick={() => setActiveTab("demo")} style={{
                  width:"100%", marginTop:10, padding:"9px 0",
                  background:"transparent", border:"1px solid #0d9488",
                  color:"#0d9488", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
                }}>
                  🎬 Watch Free Demo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Toast inside modal */}
        {toast && (
          <div style={{
            position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)",
            padding:"10px 22px", borderRadius:10, fontWeight:600, fontSize:13,
            background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
            color:      toast.type === "error" ? "#dc2626" : "#16a34a",
            border:     `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
            boxShadow:"0 6px 24px rgba(0,0,0,0.12)", whiteSpace:"nowrap", zIndex:10,
          }}>{toast.msg}</div>
        )}
      </div>
    </div>
  );
}

const SH = { fontSize:15, fontWeight:700, color:"#111827", marginBottom:12, marginTop:0 };