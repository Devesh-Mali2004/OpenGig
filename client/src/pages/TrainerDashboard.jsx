import { useState } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getMyCoursesAPI,
  createCourseAPI,
  deleteCourseAPI,
  getCourseStudentsAPI,
} from "../api/api";
import useFetch from "../hooks/useFetch";
import { getGreeting } from "../utils/helpers";

const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",      icon: "🏠" },
  { id: "courses",    label: "My Courses",      icon: "📚" },
  { id: "students",   label: "Students",        icon: "👥" },
  { id: "sessions",   label: "Sessions",        icon: "📅" },
  { id: "profile",    label: "Profile",         icon: "👤" },
];

const EMPTY_FORM = {
  title: "", description: "", category: "", price: "", zoomLink: ""
};

export default function TrainerDashboard() {
  const [activeTab,      setActiveTab]      = useState("dashboard");
  const [showForm,       setShowForm]       = useState(false);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [formError,      setFormError]      = useState("");
  const [formLoading,    setFormLoading]    = useState(false);
  const [successMsg,     setSuccessMsg]     = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students,       setStudents]       = useState([]);
  const [loadStudents,   setLoadStudents]   = useState(false);

  const { user } = useAuth();
  const navigate  = useNavigate();

  const { data: courses, loading: loadingCourses, setData: setCourses } = useFetch(getMyCoursesAPI);

  const courseList = courses || [];

  // ── Create Course ──────────────────────────────
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.title || !form.category) {
      setFormError("Title and Category are required!");
      return;
    }
    setFormLoading(true);
    try {
      const res = await createCourseAPI(form);
      if (res.message) { setFormError(res.message); return; }
      setCourses([...courseList, res]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccessMsg("Course created successfully! 🎉");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setFormError("Failed to create course. Try again.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete Course ──────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await deleteCourseAPI(id);
      setCourses(courseList.filter((c) => c._id !== id));
      setSuccessMsg("Course deleted!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert("Delete failed.");
    }
  };

  // ── View Students ──────────────────────────────
  const handleViewStudents = async (course) => {
    setSelectedCourse(course);
    setLoadStudents(true);
    setActiveTab("students");
    try {
      const res = await getCourseStudentsAPI(course._id);
      setStudents(res || []);
    } catch (err) {
      setStudents([]);
    } finally {
      setLoadStudents(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} navItems={NAV_ITEMS} />

      <main style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Topbar */}
        <header style={{ background: "#fff", borderBottom: "1px solid #f3f4f6", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
              {getGreeting()}, {user?.name?.split(" ")[0]} 👋
            </h2>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Trainer Dashboard</p>
          </div>
          <button onClick={() => { setShowForm(true); setActiveTab("courses"); }}
            style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Add Course
          </button>
        </header>

        {/* Success Toast */}
        {successMsg && (
          <div style={{ background: "#ccfbf1", color: "#0f766e", padding: "10px 28px", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #99f6e4" }}>
            {successMsg}
          </div>
        )}

        <div style={{ padding: "24px 28px" }}>

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <StatCard label="Total Courses"   value={courseList.length} icon="📚" color="#0f766e" />
                <StatCard label="Total Students"  value={courseList.reduce((a, c) => a + (c.enrollmentCount || 0), 0)} icon="👥" color="#7c3aed" />
                <StatCard label="Live Sessions"   value={courseList.filter(c => c.zoomLink).length} icon="🎥" color="#ea580c" />
                <StatCard label="Avg Rating"      value="4.8 ⭐" icon="🏆" color="#1d4ed8" />
              </div>

              {/* Recent Courses */}
              <section>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>My Courses</h3>
                  <button onClick={() => setActiveTab("courses")}
                    style={{ fontSize: 12, color: "#0d9488", background: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}>
                    View all →
                  </button>
                </div>
                {loadingCourses ? <Spinner /> : (
                  courseList.length === 0 ? (
                    <EmptyState icon="📚" title="No courses yet" desc="Click '+ Add Course' to create your first course!" />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                      {courseList.slice(0, 3).map((course) => (
                        <TrainerCourseCard key={course._id} course={course} onDelete={handleDelete} onViewStudents={handleViewStudents} />
                      ))}
                    </div>
                  )
                )}
              </section>
            </div>
          )}

          {/* ── COURSES TAB ── */}
          {activeTab === "courses" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>My Courses</h2>
                <button onClick={() => setShowForm(!showForm)}
                  style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {showForm ? "✕ Cancel" : "+ Add Course"}
                </button>
              </div>

              {/* Create Course Form */}
              {showForm && (
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Create New Course</h3>
                  {formError && (
                    <div style={{ background: "#fef2f2", color: "#dc2626", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                      {formError}
                    </div>
                  )}
                  <form onSubmit={handleCreateCourse}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                      <FormField label="Course Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. React JS Masterclass" />
                      <FormField label="Category *"     value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="e.g. Web Dev, AI/ML" />
                      <FormField label="Price (₹)"      value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="0 for Free" type="number" />
                      <FormField label="Zoom Link"      value={form.zoomLink} onChange={(v) => setForm({ ...form, zoomLink: v })} placeholder="https://zoom.us/j/..." />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Description</label>
                      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe your course..."
                        style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 8, resize: "vertical", minHeight: 80, outline: "none", fontFamily: "inherit" }} />
                    </div>
                    <button type="submit" disabled={formLoading}
                      style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: formLoading ? 0.7 : 1 }}>
                      {formLoading ? "Creating..." : "Create Course"}
                    </button>
                  </form>
                </div>
              )}

              {/* Course List */}
              {loadingCourses ? <Spinner /> : (
                courseList.length === 0 ? (
                  <EmptyState icon="📚" title="No courses yet" desc="Create your first course above!" />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                    {courseList.map((course) => (
                      <TrainerCourseCard key={course._id} course={course} onDelete={handleDelete} onViewStudents={handleViewStudents} />
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* ── STUDENTS TAB ── */}
          {activeTab === "students" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                Students {selectedCourse ? `— ${selectedCourse.title}` : ""}
              </h2>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
                {selectedCourse ? "Students enrolled in this course" : "Select a course to view students"}
              </p>
              {!selectedCourse ? (
                <EmptyState icon="👥" title="No course selected" desc="Click 'View Students' on any course card!" />
              ) : loadStudents ? <Spinner text="Loading students..." /> : (
                students.length === 0 ? (
                  <EmptyState icon="👥" title="No students yet" desc="Share your course to get students enrolled!" />
                ) : (
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f9fafb" }}>
                          {["#", "Name", "Email", "Enrolled On"].map((h) => (
                            <th key={h} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280", textAlign: "left", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, i) => (
                          <tr key={s._id} style={{ borderBottom: "1px solid #f9fafb" }}>
                            <td style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af" }}>{i + 1}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{s.learner?.name || "—"}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{s.learner?.email || "—"}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          )}

          {/* ── SESSIONS TAB ── */}
          {activeTab === "sessions" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>Live Sessions</h2>
              {loadingCourses ? <Spinner /> : (
                courseList.filter((c) => c.zoomLink).length === 0 ? (
                  <EmptyState icon="🎥" title="No live sessions" desc="Add a Zoom link when creating a course to enable live sessions!" />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {courseList.filter((c) => c.zoomLink).map((course) => (
                      <div key={course._id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{course.title}</h4>
                          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{course.category}</p>
                        </div>
                        <a href={course.zoomLink} target="_blank" rel="noreferrer"
                          style={{ background: "#2563eb", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 18px", borderRadius: 8, textDecoration: "none" }}>
                          Start Session
                        </a>
                      </div>
                    ))}
                  </div>
                )
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

// ── Helper Components ──────────────────────────────────────────────────────

function TrainerCourseCard({ course, onDelete, onViewStudents }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#ccfbf1", color: "#0f766e", fontWeight: 600 }}>
          {course.category || "General"}
        </span>
        {course.zoomLink && (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "#dbeafe", color: "#1d4ed8", fontWeight: 600 }}>
            🎥 Live
          </span>
        )}
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "8px 0 4px", lineHeight: 1.3 }}>{course.title}</h3>
      <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, lineHeight: 1.4 }}>
        {course.description?.slice(0, 80) || "No description"}...
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f766e" }}>
          {course.price ? `₹${course.price}` : "Free"}
        </span>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          {course.enrollmentCount || 0} students
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onViewStudents(course)}
          style={{ flex: 1, padding: "7px 0", background: "#f0fdf4", color: "#0f766e", border: "1px solid #bbf7d0", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          👥 Students
        </button>
        <button onClick={() => onDelete(course._id)}
          style={{ flex: 1, padding: "7px 0", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 8, outline: "none", color: "#111827", fontFamily: "inherit" }} />
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 12, border: "1px dashed #e5e7eb" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>{icon}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 13, color: "#9ca3af" }}>{desc}</p>
    </div>
  );
}