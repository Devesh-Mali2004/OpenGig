import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

API.interceptors.request.use(c => {
  const t = localStorage.getItem("opengig_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

API.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem("opengig_token");
    localStorage.removeItem("opengig_user");
    window.location.href = "/login";
  }
  return Promise.reject(err);
});

// AUTH
export const loginAPI          = d => API.post("/auth/login",  d);
export const signupAPI         = d => API.post("/auth/signup", d);
export const getMeAPI          = () => API.get("/auth/me");
export const updateProfileAPI  = d => API.put("/users/profile", d);

// USERS
export const getAllTrainersAPI  = () => API.get("/users/trainers");
export const getAllTraineesAPI  = () => API.get("/users/trainees");

// COURSES
export const getAllCourses      = () => API.get("/courses");
export const getCourseById     = id => API.get(`/courses/${id}`);
export const createCourse      = d  => API.post("/courses", d);
export const updateCourse      = (id,d) => API.put(`/courses/${id}`, d);
export const deleteCourse      = id => API.delete(`/courses/${id}`);
export const getTrainerCourses = () => API.get("/courses/trainer/my-courses");

// ENROLLMENTS
export const enrollCourse      = id => API.post("/enrollments", { courseId: id });
export const getMyEnrollments  = () => API.get("/enrollments/my");
export const getCourseStudents = id => API.get(`/enrollments/course/${id}`);

// RECOMMENDATIONS
export const getRecommendations = () => API.get("/recommend");

// ADMIN
export const getAdminStats     = () => API.get("/admin/stats");
export const getAllUsers        = () => API.get("/admin/users");
export const blockUser         = id => API.put(`/admin/block/${id}`);
export const unblockUser       = id => API.put(`/admin/unblock/${id}`);
export const deleteUserAdmin   = id => API.delete(`/admin/users/${id}`);
export const getAdminCourses   = () => API.get("/admin/courses");
export const deleteAdminCourse = id => API.delete(`/admin/courses/${id}`);

// CHAT
export const sendMessageAPI      = d  => API.post("/chat/send", d);
export const getMessagesAPI      = id => API.get(`/chat/messages/${id}`);
export const getConversationsAPI = () => API.get("/chat/conversations");

// NOTIFICATIONS
export const getNotificationsAPI  = () => API.get("/notifications");
export const markReadAPI          = id => API.put(`/notifications/${id}/read`);
export const markAllReadAPI       = () => API.put("/notifications/read-all");
export const sendAnnouncementAPI  = d  => API.post("/notifications/announce", d);
export const getAllNotifsAdminAPI  = () => API.get("/notifications/all");

// LIVE SESSIONS
export const goLiveAPI            = d  => API.post("/live/go-live", d);
export const endLiveAPI           = id => API.put(`/live/end/${id}`);
export const getActiveSessionsAPI = () => API.get("/live/active");
export const getMySessionsAPI     = () => API.get("/live/my-sessions");
export const getTrainerStatsAPI   = () => API.get("/live/stats");
export const getAllSessionsAPI    = () => API.get("/live/all");

// REVIEWS
export const addReviewAPI         = d  => API.post("/reviews", d);
export const getCourseReviewsAPI  = id => API.get(`/reviews/${id}`);
export const deleteReviewAPI      = id => API.delete(`/reviews/${id}`);
export const getAllReviewsAPI      = () => API.get("/reviews/admin/all");

// Aliases
export const getMyEnrollmentsAPI   = getMyEnrollments;
export const getRecommendationsAPI = getRecommendations;
export const getAllCoursesAPI       = getAllCourses;
export const enrollCourseAPI       = enrollCourse;
export const getMyCoursesAPI       = getTrainerCourses;
export const createCourseAPI       = createCourse;
export const deleteCourseAPI       = deleteCourse;
export const getCourseStudentsAPI  = getCourseStudents;

export default API;