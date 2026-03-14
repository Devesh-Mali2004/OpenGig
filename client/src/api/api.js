const BASE = "http://localhost:5000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("opengig_token")}`,
});

// ── AUTH ──────────────────────────────────────────
export const loginAPI = (email, password) =>
  fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());

export const signupAPI = (name, email, password, role) =>
  fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  }).then((r) => r.json());

export const getMeAPI = () =>
  fetch(`${BASE}/api/auth/me`, { headers: authHeaders() }).then((r) => r.json());

// ── COURSES ───────────────────────────────────────
export const getAllCoursesAPI = () =>
  fetch(`${BASE}/api/courses`, { headers: authHeaders() }).then((r) => r.json());

export const getMyCoursesAPI = () =>
  fetch(`${BASE}/api/courses/my`, { headers: authHeaders() }).then((r) => r.json());

export const createCourseAPI = (data) =>
  fetch(`${BASE}/api/courses`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const updateCourseAPI = (id, data) =>
  fetch(`${BASE}/api/courses/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const deleteCourseAPI = (id) =>
  fetch(`${BASE}/api/courses/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  }).then((r) => r.json());

// ── ENROLLMENTS ───────────────────────────────────
export const enrollCourseAPI = (courseId) =>
  fetch(`${BASE}/api/enrollments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ courseId }),
  }).then((r) => r.json());

export const getMyEnrollmentsAPI = () =>
  fetch(`${BASE}/api/enrollments/my`, { headers: authHeaders() }).then((r) => r.json());

export const getCourseStudentsAPI = (courseId) =>
  fetch(`${BASE}/api/enrollments/course/${courseId}`, { headers: authHeaders() }).then((r) => r.json());

// ── RECOMMENDATIONS ───────────────────────────────
export const getRecommendationsAPI = () =>
  fetch(`${BASE}/api/recommend`, { headers: authHeaders() }).then((r) => r.json());

// ── ADMIN ─────────────────────────────────────────
export const getStatsAPI = () =>
  fetch(`${BASE}/api/admin/stats`, { headers: authHeaders() }).then((r) => r.json());

export const getAllUsersAPI = () =>
  fetch(`${BASE}/api/admin/users`, { headers: authHeaders() }).then((r) => r.json());

export const blockUserAPI = (id) =>
  fetch(`${BASE}/api/admin/users/${id}/block`, {
    method: "PUT",
    headers: authHeaders(),
  }).then((r) => r.json());

export const unblockUserAPI = (id) =>
  fetch(`${BASE}/api/admin/users/${id}/unblock`, {
    method: "PUT",
    headers: authHeaders(),
  }).then((r) => r.json());