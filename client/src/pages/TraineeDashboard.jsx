import { useState } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import CourseCard from "../components/CourseCard";
import Spinner from "../components/Spinner";
import { getGreeting } from "../utils/helpers";
import {
  getMyEnrollmentsAPI,
  getRecommendationsAPI,
  getAllCoursesAPI,
  enrollCourseAPI,
} from "../api/api";
import useFetch from "../hooks/useFetch";

const MOCK_CATEGORIES = [
  { name: "AI / ML",      icon: "🤖", count: 24 },
  { name: "Web Dev",      icon: "💻", count: 38 },
  { name: "Data Science", icon: "📊", count: 19 },
  { name: "Design",       icon: "🎨", count: 15 },
  { name: "Mobile Dev",   icon: "📱", count: 12 },
  { name: "DevOps",       icon: "⚙️", count: 9  },
];

const NAV_ITEMS = [
  { id: "dashboard",       label: "Dashboard",       icon: "🏠" },
  { id: "courses",         label: "Browse Courses",  icon: "📚" },
  { id: "my-courses",      label: "My Courses",      icon: "🎯" },
  { id: "recommendations", label: "For You",         icon: "✨" },
  { id: "sessions",        label: "Sessions",        icon: "📅" },
  { id: "profile",         label: "Profile",         icon: "👤" },
];

export default function TraineeDashboard() {
  const [activeTab,    setActiveTab]    = useState("dashboard");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [enrollMsg,    setEnrollMsg]    = useState("");

  // ── Real API calls using useFetch hook ──
  const { data: enrollments, loading: loadingEnroll } = useFetch(getMyEnrollmentsAPI);
  const { data: recommended, loading: loadingRec    } = useFetch(getRecommendationsAPI);
  const { data: allCourses,  loading: loadingAll    } = useFetch(getAllCoursesAPI);

  const handleEnroll = async (courseId) => {
    try {
      const res = await enrollCourseAPI(courseId);
      if (res.message === "Already enrolled") {
        setEnrollMsg("Already enrolled in this course!");
      } else {
        setEnrollMsg("Enrolled successfully! 🎉");
      }
      setTimeout(() => setEnrollMsg(""), 3000);
    } catch (err) {
      setEnrollMsg("Enrollment failed. Try again.");
    }
  };

  const enrolledList  = enrollments || [];
  const recList       = recommended?.recommendations || recommended || [];
  const courseList    = allCourses  || [];

  const filtered = courseList.filter((c) =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} navItems={NAV_ITEMS} />

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Topbar */}
        <header style={{ background: "#fff", borderBottom: "1px solid #f3f4f6", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
              {getGreeting()} 👋
            </h2>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Here's what's new for you today</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: 8, fontSize: 12 }}>🔍</span>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7, fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 8, width: 220, background: "#f9fafb", color: "#111827", outline: "none" }}
              />
            </div>
          </div>
        </header>

        {/* Enroll message toast */}
        {enrollMsg && (
          <div style={{ background: "#ccfbf1", color: "#0f766e", padding: "10px 28px", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #99f6e4" }}>
            {enrollMsg}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: "24px 28px" }}>

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <StatCard label="Courses Enrolled"  value={enrolledList.length} icon="📚" color="#0f766e" />
                <StatCard label="Completed"          value={enrolledList.filter(e => e.progress >= 100).length} icon="✅" color="#7c3aed" />
                <StatCard label="Recommendations"    value={recList.length}      icon="✨" color="#ea580c" />
                <StatCard label="Hours Learned"      value="12"                  icon="⏱️" color="#1d4ed8" />
              </div>

              {/* Continue Learning */}
              <section>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Continue Learning</h3>
                  <button onClick={() => setActiveTab("my-courses")} style={{ fontSize: 12, color: "#0d9488", background: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}>View all →</button>
                </div>
                {loadingEnroll ? <Spinner text="Loading your courses..." /> : (
                  enrolledList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: 12, border: "1px dashed #e5e7eb" }}>
                      <p style={{ fontSize: 32, marginBottom: 8 }}>📚</p>
                      <p style={{ fontWeight: 600, color: "#111827" }}>No courses yet</p>
                      <p style={{ fontSize: 12, color: "#9ca3af" }}>Browse courses and enroll to get started!</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                      {enrolledList.slice(0, 3).map((item) => (
                        <CourseCard key={item._id} course={item.course || item} type="enrolled" />
                      ))}
                    </div>
                  )
                )}
              </section>

              {/* Recommendations */}
              <section>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Recommended for You</h3>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>AI-powered suggestions just for you</p>
                  </div>
                  <button onClick={() => setActiveTab("recommendations")} style={{ fontSize: 12, color: "#0d9488", background: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}>See all →</button>
                </div>
                {loadingRec ? <Spinner text="Getting recommendations..." /> : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {recList.slice(0, 4).map((course) => (
                      <CourseCard key={course._id} course={course} type="recommended" onEnroll={handleEnroll} />
                    ))}
                  </div>
                )}
              </section>

              {/* Categories */}
              <section>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Browse Categories</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                  {MOCK_CATEGORIES.map((cat) => (
                    <button key={cat.name} onClick={() => setActiveTab("courses")}
                      style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 10, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <span style={{ fontSize: 24 }}>{cat.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{cat.name}</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{cat.count} courses</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ── MY COURSES TAB ── */}
          {activeTab === "my-courses" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>My Enrolled Courses</h2>
              {loadingEnroll ? <Spinner /> : (
                enrolledList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 12, border: "1px dashed #e5e7eb" }}>
                    <p style={{ fontSize: 32 }}>🎯</p>
                    <p style={{ fontWeight: 600, color: "#111827" }}>No enrollments yet</p>
                    <p style={{ fontSize: 12, color: "#9ca3af" }}>Go browse courses and enroll!</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                    {enrolledList.map((item) => (
                      <CourseCard key={item._id} course={item.course || item} type="enrolled" />
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* ── BROWSE COURSES TAB ── */}
          {activeTab === "courses" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Browse All Courses</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {MOCK_CATEGORIES.map((cat) => (
                  <button key={cat.name}
                    style={{ fontSize: 12, padding: "6px 14px", borderRadius: 999, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 500 }}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
              {loadingAll ? <Spinner /> : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                  {(filtered.length > 0 ? filtered : courseList).map((course) => (
                    <CourseCard key={course._id} course={course} type="recommended" onEnroll={handleEnroll} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RECOMMENDATIONS TAB ── */}
          {activeTab === "recommendations" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Personalized Recommendations</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>AI-powered suggestions based on your learning history</p>
              {loadingRec ? <Spinner /> : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                  {recList.map((course) => (
                    <CourseCard key={course._id} course={course} type="recommended" onEnroll={handleEnroll} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SESSIONS TAB ── */}
          {activeTab === "sessions" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>Upcoming Sessions</h2>
              {loadingEnroll ? <Spinner /> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {enrolledList.filter((e) => (e.course || e).zoomLink).map((item) => {
                    const course = item.course || item;
                    return (
                      <div key={item._id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{course.title}</h4>
                          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>by {course.trainer?.name || course.trainer}</p>
                        </div>
                        <a href={course.zoomLink} target="_blank" rel="noreferrer"
                          style={{ background: "#2563eb", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 18px", borderRadius: 8, textDecoration: "none" }}>
                          Join Session
                        </a>
                      </div>
                    );
                  })}
                  {enrolledList.filter((e) => (e.course || e).zoomLink).length === 0 && (
                    <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 12, border: "1px dashed #e5e7eb" }}>
                      <p style={{ fontSize: 32 }}>📅</p>
                      <p style={{ fontWeight: 600, color: "#111827" }}>No sessions yet</p>
                      <p style={{ fontSize: 12, color: "#9ca3af" }}>Enroll in live courses to see sessions here!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <div style={{ maxWidth: 560 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>My Profile</h2>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", padding: 24 }}>
                <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 20 }}>
                  Profile editing coming soon! 🚀
                </p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}