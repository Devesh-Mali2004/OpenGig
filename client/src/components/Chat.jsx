import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";
import Chat from "../components/Chat";
import { useAuth } from "../context/AuthContext";
import { getGreeting } from "../utils/helpers";
import {
  getMyEnrollmentsAPI, getRecommendationsAPI, getAllCoursesAPI,
  enrollCourseAPI, updateProfileAPI,
} from "../api/api";

const CATEGORIES = ["All","Web Dev","AI / ML","Data Science","Design","Mobile Dev","DevOps","Blockchain","Freelancing","Marketing","Cybersecurity"];

const NAV_ITEMS = [
  { id: "dashboard",       label: "Dashboard",      icon: "🏠" },
  { id: "courses",         label: "Browse Courses", icon: "📚" },
  { id: "my-courses",      label: "My Courses",     icon: "🎯" },
  { id: "recommendations", label: "For You",        icon: "✨" },
  { id: "sessions",        label: "Sessions",       icon: "📅" },
  { id: "chat",            label: "Messages",       icon: "💬" },
  { id: "profile",         label: "Profile",        icon: "👤" },
];

export default function TraineeDashboard() {
  const [activeTab,     setActiveTab]     = useState("dashboard");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [filterCat,     setFilterCat]     = useState("All");
  const [enrollments,   setEnrollments]   = useState([]);
  const [recommended,   setRecommended]   = useState([]);
  const [allCourses,    setAllCourses]    = useState([]);
  const [loadingEnroll, setLoadingEnroll] = useState(true);
  const [loadingRec,    setLoadingRec]    = useState(true);
  const [loadingAll,    setLoadingAll]    = useState(true);
  const [toast,         setToast]         = useState(null);
  const [enrollingId,   setEnrollingId]   = useState(null);
  const [profileForm,   setProfileForm]   = useState({ name:"", phone:"", bio:"", skills:"" });
  const [profileLoading,setProfileLoading]= useState(false);
  const [profileError,  setProfileError]  = useState("");

  const { user } = useAuth();

  useEffect(() => {
    if (user) setProfileForm({
      name:   user.name  || "",
      phone:  user.phone || "",
      bio:    user.bio   || "",
      skills: Array.isArray(user.skills) ? user.skills.join(", ") : "",
    });
  }, [user]);

  const fetchEnrollments = useCallback(async () => {
    setLoadingEnroll(true);
    try {
      const res = await getMyEnrollmentsAPI();
      setEnrollments(Array.isArray(res.data) ? res.data : []);
    } catch { setEnrollments([]); }
    finally { setLoadingEnroll(false); }
  }, []);

  const fetchRecommended = useCallback(async () => {
    setLoadingRec(true);
    try {
      const res = await getRecommendationsAPI();
      const d = res.data;
      setRecommended(Array.isArray(d) ? d : Array.isArray(d?.recommendations) ? d.recommendations : []);
    } catch { setRecommended([]); }
    finally { setLoadingRec(false); }
  }, []);

  const fetchAllCourses = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res = await getAllCoursesAPI();
      setAllCourses(Array.isArray(res.data) ? res.data : []);
    } catch { setAllCourses([]); }
    finally { setLoadingAll(false); }
  }, []);

  useEffect(() => {
    fetchEnrollments();
    fetchRecommended();
    fetchAllCourses();
  }, [fetchEnrollments, fetchRecommended, fetchAllCourses]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEnroll = async (courseId) => {
    if (enrollingId) return;
    setEnrollingId(courseId);
    try {
      const res = await enrollCourseAPI(courseId);
      const msg = res.data?.message || "";
      if (msg.toLowerCase().includes("already")) {
        showToast("You're already enrolled!", "warning");
      } else {
        showToast("Enrolled successfully! 🎉");
        fetchEnrollments();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Enrollment failed.", "error");
    } finally { setEnrollingId(null); }
  };

  const isEnrolled = (courseId) =>
    enrollments.some(e => (e.course?._id || e.course || e._id)?.toString() === courseId?.toString());

  const enrolledList = enrollments.map(e => e.course || e).filter(Boolean);

  // Search + category filter
  const filteredCourses = allCourses.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q);
    const matchCat = filterCat === "All" || c.category?.toLowerCase().includes(filterCat.toLowerCase());
    return matchSearch && matchCat;
  });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileLoading(true);
    try {
      const payload = {
        name:   profileForm.name,
        phone:  profileForm.phone,
        bio:    profileForm.bio,
        skills: profileForm.skills.split(",").map(s => s.trim()).filter(Boolean),
      };
      await updateProfileAPI(payload);
      const updatedUser = { ...user, ...payload };
      localStorage.setItem("opengig_user", JSON.stringify(updatedUser));
      showToast("Profile updated! ✅");
    } catch (err) {
      setProfileError(err?.response?.data?.message || "Failed to update profile.");
    } finally { setProfileLoading(false); }
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f9fafb", fontFamily:"ui-sans-serif,system-ui,sans-serif" }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} navItems={NAV_ITEMS} />

      <main style={{ marginLeft:220, flex:1, display:"flex", flexDirection:"column" }}>
        {/* Topbar */}
        <header style={{ background:"#fff", borderBottom:"1px solid #f3f4f6", padding:"12px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:30 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, color:"#111827", margin:0 }}>{getGreeting()}, {user?.name?.split(" ")[0]} 👋</h2>
            <p style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>Here's what's new for you today</p>
          </div>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:10, top:8, fontSize:12 }}>🔍</span>
            <input type="text" placeholder="Search courses..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setActiveTab("courses"); }}
              onKeyDown={e => { if(e.key==="Enter") setActiveTab("courses"); }}
              style={{ paddingLeft:30, paddingRight:12, paddingTop:7, paddingBottom:7, fontSize:12, border:"1px solid #e5e7eb", borderRadius:8, width:220, background:"#f9fafb", color:"#111827", outline:"none" }} />
          </div>
        </header>

        {/* Toast */}
        {toast && (
          <div style={{ position:"fixed", bottom:"2rem", right:"2rem", zIndex:9999, padding:"0.75rem 1.5rem", borderRadius:10, fontWeight:600, fontSize:14,
            background: toast.type==="error"?"#fef2f2":toast.type==="warning"?"#fffbeb":"#f0fdf4",
            color:      toast.type==="error"?"#dc2626":toast.type==="warning"?"#d97706":"#16a34a",
            border:    `1px solid ${toast.type==="error"?"#fca5a5":toast.type==="warning"?"#fcd34d":"#86efac"}`,
            boxShadow:"0 4px 20px rgba(0,0,0,0.1)" }}>
            {toast.msg}
          </div>
        )}

        <div style={{ padding:"24px 28px" }}>

          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                <StatCard label="Enrolled"        value={enrolledList.length}  icon="📚" color="#0f766e" />
                <StatCard label="Completed"        value={0}                    icon="✅" color="#7c3aed" />
                <StatCard label="Recommendations"  value={recommended.length}  icon="✨" color="#ea580c" />
                <StatCard label="Hours Learned"    value="12"                  icon="⏱️" color="#1d4ed8" />
              </div>

              <section>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <h3 style={{ fontSize:15, fontWeight:700, color:"#111827", margin:0 }}>Continue Learning</h3>
                  <button onClick={() => setActiveTab("my-courses")} style={{ fontSize:12, color:"#0d9488", background:"transparent", border:"none", cursor:"pointer", fontWeight:500 }}>View all →</button>
                </div>
                {loadingEnroll ? <Spinner /> : enrolledList.length === 0 ? (
                  <EmptyState icon="📚" title="No courses yet" desc="Browse and enroll in courses!" action="Browse Courses" onAction={() => setActiveTab("courses")} />
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                    {enrolledList.slice(0,3).map(course => <EnrolledCard key={course._id} course={course} />)}
                  </div>
                )}
              </section>

              <section>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div>
                    <h3 style={{ fontSize:15, fontWeight:700, color:"#111827", margin:0 }}>Recommended for You</h3>
                    <p style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>AI-powered suggestions</p>
                  </div>
                  <button onClick={() => setActiveTab("recommendations")} style={{ fontSize:12, color:"#0d9488", background:"transparent", border:"none", cursor:"pointer", fontWeight:500 }}>See all →</button>
                </div>
                {loadingRec ? <Spinner /> : recommended.length === 0 ? (
                  <EmptyState icon="✨" title="No recommendations yet" desc="Enroll in courses to get AI suggestions!" />
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                    {recommended.slice(0,4).map(course => (
                      <EnrollableCourseCard key={course._id} course={course} enrolled={isEnrolled(course._id)} enrolling={enrollingId===course._id} onEnroll={() => handleEnroll(course._id)} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* BROWSE COURSES */}
          {activeTab === "courses" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <h2 style={{ fontSize:18, fontWeight:700, color:"#111827", margin:0 }}>Browse Courses</h2>
                <span style={{ fontSize:12, color:"#9ca3af" }}>{filteredCourses.length} courses found</span>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setFilterCat(cat)}
                    style={{ fontSize:12, padding:"5px 14px", borderRadius:999, border:"1px solid #e5e7eb", cursor:"pointer", fontWeight:500, transition:"all 0.2s",
                      background: filterCat===cat?"#0d9488":"#fff",
                      color:      filterCat===cat?"#fff":"#374151" }}>
                    {cat}
                  </button>
                ))}
              </div>
              {loadingAll ? <Spinner /> : filteredCourses.length === 0 ? (
                <EmptyState icon="🔍" title="No courses found" desc="Try a different search or category" action="Clear Search" onAction={() => { setSearchQuery(""); setFilterCat("All"); }} />
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                  {filteredCourses.map(course => (
                    <EnrollableCourseCard key={course._id} course={course} enrolled={isEnrolled(course._id)} enrolling={enrollingId===course._id} onEnroll={() => handleEnroll(course._id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MY COURSES */}
          {activeTab === "my-courses" && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, color:"#111827", marginBottom:20 }}>My Enrolled Courses</h2>
              {loadingEnroll ? <Spinner /> : enrolledList.length === 0 ? (
                <EmptyState icon="🎯" title="No enrollments yet" desc="Go browse and enroll!" action="Browse Courses" onAction={() => setActiveTab("courses")} />
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                  {enrolledList.map(course => <EnrolledCard key={course._id} course={course} />)}
                </div>
              )}
            </div>
          )}

          {/* RECOMMENDATIONS */}
          {activeTab === "recommendations" && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, color:"#111827", marginBottom:4 }}>Personalized Recommendations</h2>
              <p style={{ fontSize:13, color:"#9ca3af", marginBottom:20 }}>AI-powered suggestions based on your learning history</p>
              {loadingRec ? <Spinner /> : recommended.length === 0 ? (
                <EmptyState icon="✨" title="No recommendations yet" desc="Enroll in more courses to get AI suggestions!" />
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                  {recommended.map(course => (
                    <EnrollableCourseCard key={course._id} course={course} enrolled={isEnrolled(course._id)} enrolling={enrollingId===course._id} onEnroll={() => handleEnroll(course._id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SESSIONS */}
          {activeTab === "sessions" && (
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, color:"#111827", marginBottom:20 }}>Upcoming Sessions</h2>
              {loadingEnroll ? <Spinner /> : enrolledList.filter(c => c?.zoomLink).length === 0 ? (
                <EmptyState icon="📅" title="No sessions yet" desc="Enroll in live courses to see sessions!" action="Browse Courses" onAction={() => setActiveTab("courses")} />
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {enrolledList.filter(c => c?.zoomLink).map(course => (
                    <div key={course._id} style={{ background:"#fff", borderRadius:12, border:"1px solid #f3f4f6", padding:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <h4 style={{ fontSize:14, fontWeight:600, color:"#111827", margin:0 }}>{course.title}</h4>
                        <p style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>by {course.trainer?.name||"Trainer"}</p>
                        {course.duration && <p style={{ fontSize:11, color:"#0d9488", marginTop:2 }}>⏱ {course.duration}</p>}
                      </div>
                      <a href={course.zoomLink} target="_blank" rel="noreferrer"
                        style={{ background:"#2563eb", color:"#fff", fontSize:12, fontWeight:600, padding:"8px 18px", borderRadius:8, textDecoration:"none" }}>
                        Join Session
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHAT */}
          {activeTab === "chat" && (
            <div style={{ height:"calc(100vh - 140px)" }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:"#111827", marginBottom:16 }}>Messages</h2>
              <div style={{ height:"calc(100% - 50px)" }}><Chat /></div>
            </div>
          )}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <div style={{ maxWidth:560 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:"#111827", marginBottom:20 }}>My Profile</h2>
              <div style={{ background:"#fff", borderRadius:12, border:"1px solid #f3f4f6", padding:28 }}>
                <div style={{ textAlign:"center", marginBottom:24 }}>
                  <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#0d9488,#7c3aed)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:700, margin:"0 auto 10px" }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <p style={{ fontWeight:700, color:"#111827", fontSize:16, margin:0 }}>{user?.name}</p>
                  <span style={{ fontSize:11, padding:"2px 10px", borderRadius:999, background:"#ccfbf1", color:"#0f766e", fontWeight:600 }}>Trainee</span>
                </div>
                {profileError && <div style={{ background:"#fef2f2", color:"#dc2626", padding:"8px 12px", borderRadius:8, fontSize:13, marginBottom:16 }}>⚠️ {profileError}</div>}
                <form onSubmit={handleProfileSave}>
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <ProfileField label="Full Name" value={profileForm.name}  onChange={v => setProfileForm({...profileForm,name:v})}  placeholder="Your full name" />
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Email</label>
                      <input value={user?.email||""} disabled style={{ width:"100%", padding:"9px 12px", fontSize:13, border:"1px solid #e5e7eb", borderRadius:8, color:"#9ca3af", background:"#f9fafb", boxSizing:"border-box" }} />
                    </div>
                    <ProfileField label="Phone" value={profileForm.phone} onChange={v => setProfileForm({...profileForm,phone:v})} placeholder="+91 9876543210" />
                    <ProfileField label="Skills I'm learning (comma separated)" value={profileForm.skills} onChange={v => setProfileForm({...profileForm,skills:v})} placeholder="React, Python, UI/UX" />
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Bio</label>
                      <textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm,bio:e.target.value})}
                        placeholder="Tell trainers about yourself..."
                        style={{ width:"100%", padding:"10px 12px", fontSize:13, border:"1px solid #e5e7eb", borderRadius:8, resize:"vertical", minHeight:80, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
                    </div>
                    <button type="submit" disabled={profileLoading}
                      style={{ background:"#0d9488", color:"#fff", border:"none", borderRadius:8, padding:"11px 0", fontSize:14, fontWeight:600, cursor:profileLoading?"not-allowed":"pointer", opacity:profileLoading?0.7:1 }}>
                      {profileLoading ? "Saving..." : "Save Profile ✅"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function EnrolledCard({ course }) {
  return (
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #f3f4f6", overflow:"hidden" }}>
      <div style={{ height:70, background:"linear-gradient(135deg,#0d9488,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:28 }}>📚</span>
      </div>
      <div style={{ padding:14 }}>
        <h4 style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 6px", lineHeight:1.4 }}>{course.title}</h4>
        <p style={{ fontSize:11, color:"#9ca3af", margin:"0 0 8px" }}>by {course.trainer?.name||"Trainer"}</p>
        <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, background:"#f0fdf4", color:"#16a34a", fontWeight:600 }}>✅ Enrolled</span>
      </div>
    </div>
  );
}

function EnrollableCourseCard({ course, enrolled, enrolling, onEnroll }) {
  return (
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #f3f4f6", overflow:"hidden", display:"flex", flexDirection:"column", transition:"box-shadow 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
      <div style={{ height:80, background:"linear-gradient(135deg,#0d9488,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:32 }}>📚</span>
      </div>
      <div style={{ padding:14, flex:1, display:"flex", flexDirection:"column" }}>
        <h4 style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 6px", lineHeight:1.4 }}>{course.title}</h4>
        <p style={{ fontSize:11, color:"#9ca3af", marginBottom:8, flex:1 }}>{course.description?.slice(0,70)}...</p>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontSize:11, color:"#0d9488", fontWeight:600 }}>{course.level||"Beginner"}</span>
          <span style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{course.price===0||!course.price?"Free":`₹${course.price}`}</span>
        </div>
        <button onClick={onEnroll} disabled={enrolled||enrolling}
          style={{ width:"100%", padding:"8px", borderRadius:8, border:"none", cursor:enrolled||enrolling?"not-allowed":"pointer", fontWeight:600, fontSize:12, transition:"all 0.2s",
            background: enrolled?"#f0fdf4":enrolling?"#e0e7ff":"#0d9488",
            color:      enrolled?"#16a34a":enrolling?"#4338ca":"#fff" }}>
          {enrolled?"✅ Enrolled":enrolling?"Enrolling...":"Enroll Free"}
        </button>
      </div>
    </div>
  );
}

function ProfileField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", padding:"9px 12px", fontSize:13, border:"1px solid #e5e7eb", borderRadius:8, outline:"none", color:"#111827", fontFamily:"inherit", boxSizing:"border-box" }} />
    </div>
  );
}

function EmptyState({ icon, title, desc, action, onAction }) {
  return (
    <div style={{ textAlign:"center", padding:40, background:"#fff", borderRadius:12, border:"1px dashed #e5e7eb" }}>
      <p style={{ fontSize:36, marginBottom:8 }}>{icon}</p>
      <p style={{ fontWeight:600, color:"#111827", marginBottom:4 }}>{title}</p>
      <p style={{ fontSize:12, color:"#9ca3af", marginBottom:action?16:0 }}>{desc}</p>
      {action && <button onClick={onAction} style={{ background:"#0d9488", color:"#fff", border:"none", padding:"8px 20px", borderRadius:8, fontWeight:600, fontSize:12, cursor:"pointer" }}>{action}</button>}
    </div>
  );
}