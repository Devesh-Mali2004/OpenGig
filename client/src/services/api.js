import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Auto-attach token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ── Auth ──────────────────────────────────────────
export const signup = (data) => API.post("/auth/signup", data);
export const login  = (data) => API.post("/auth/login", data);
export const getMe  = ()     => API.get("/auth/me");

// ── Courses ───────────────────────────────────────
export const getCourses        = (params) => API.get("/courses", { params });
export const getCourseById     = (id)     => API.get(`/courses/${id}`);
export const createCourse      = (data)   => API.post("/courses", data);
export const updateCourse      = (id, data) => API.put(`/courses/${id}`, data);
export const deleteCourse      = (id)     => API.delete(`/courses/${id}`);
export const getMyMentorCourses = ()     => API.get("/courses/Mentor/my");

// ── Enrollments ───────────────────────────────────
export const enrollInCourse    = (courseId) => API.post(`/enrollments/${courseId}`);
export const getMyEnrollments  = ()         => API.get("/enrollments/my");
export const updateProgress    = (courseId, progress) => API.put(`/enrollments/${courseId}/progress`, { progress });

// ── Recommendations ───────────────────────────────
export const getRecommendations = () => API.get("/recommend");

// ── Admin ─────────────────────────────────────────
export const getAdminStats   = ()    => API.get("/admin/stats");
export const getAllUsers      = ()    => API.get("/admin/users");
export const blockUser        = (id) => API.put(`/admin/users/${id}/block`);
export const getAllAdminCourses = ()  => API.get("/admin/courses");
export const removeAdminCourse = (id) => API.delete(`/admin/courses/${id}`);
