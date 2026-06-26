import { formatPrice } from "../utils/helpers";

const TAG_COLORS = {
  Trending:    { bg: "#fef3c7", color: "#b45309" },
  Recommended: { bg: "#ccfbf1", color: "#0f766e" },
  New:         { bg: "#dbeafe", color: "#1d4ed8" },
  "Top Rated": { bg: "#ede9fe", color: "#7c3aed" },
};

export default function CourseCard({ course, type = "recommended", onEnroll }) {
  const tag = TAG_COLORS[course.tag] || { bg: "#f3f4f6", color: "#374151" };

  if (type === "enrolled") {
    return (
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", padding: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{course.title}</p>
        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>
          by {course.Mentor?.name || course.Mentor} · {course.category}
        </p>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>
            <span>Progress</span>
            <span style={{ color: "#0d9488", fontWeight: 600 }}>{course.progress || 0}%</span>
          </div>
          <div style={{ height: 5, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${course.progress || 0}%`, background: "#0d9488", borderRadius: 999 }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#9ca3af" }}>
            {course.nextSession === "Completed" ? "✅ Completed" : `Next: ${course.nextSession || "TBD"}`}
          </span>
          {course.zoomLink && (
            <a href={course.zoomLink} target="_blank" rel="noreferrer"
              style={{ fontSize: 10, background: "#2563eb", color: "#fff", padding: "4px 10px", borderRadius: 6, fontWeight: 600, textDecoration: "none" }}>
              Join Zoom
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, fontWeight: 500, background: tag.bg, color: tag.color }}>
          {course.tag || "Course"}
        </span>
        <span style={{ fontSize: 10, color: "#9ca3af", background: "#f9fafb", padding: "2px 8px", borderRadius: 4 }}>
          {course.level || "All Levels"}
        </span>
      </div>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", margin: "8px 0 2px", lineHeight: 1.3 }}>{course.title}</p>
      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>
        by {course.Mentor?.name || course.Mentor}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#374151" }}>⭐ {course.rating || "4.5"}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f766e" }}>{formatPrice(course.price)}</span>
      </div>
      <button onClick={() => onEnroll && onEnroll(course._id)}
        style={{ width: "100%", marginTop: 10, padding: "7px 0", background: "#0d9488", color: "#fff", fontSize: 11, fontWeight: 600, border: "none", borderRadius: 7, cursor: "pointer" }}>
        Enroll Now
      </button>
    </div>
  );
}