import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("opengig_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("opengig_token");
      localStorage.removeItem("opengig_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// AUTH
export const loginAPI            = (data)      => API.post("/auth/login",  data);
export const signupAPI           = (data)      => API.post("/auth/signup", data);
export const getMeAPI            = ()          => API.get("/auth/me");
export const updateProfileAPI    = (data)      => API.put("/users/profile", data);

// COURSES
export const getAllCourses        = ()          => API.get("/courses");
export const getCourseById        = (id)        => API.get(`/courses/${id}`);
export const createCourse         = (data)      => API.post("/courses", data);
export const updateCourse         = (id, data)  => API.put(`/courses/${id}`, data);
export const deleteCourse         = (id)        => API.delete(`/courses/${id}`);
export const getTrainerCourses    = ()          => API.get("/courses/trainer/my-courses");

// ENROLLMENTS
export const enrollCourse         = (courseId)  => API.post("/enrollments", { courseId });
export const getMyEnrollments     = ()          => API.get("/enrollments/my");
export const getCourseStudents    = (courseId)  => API.get(`/enrollments/course/${courseId}`);

// RECOMMENDATIONS
export const getRecommendations   = ()          => API.get("/recommend");

// ADMIN
export const getAdminStats        = ()          => API.get("/admin/stats");
export const getAllUsers           = ()          => API.get("/admin/users");
export const blockUser            = (id)        => API.put(`/admin/block/${id}`);
export const unblockUser          = (id)        => API.put(`/admin/unblock/${id}`);
export const deleteUserAdmin      = (id)        => API.delete(`/admin/users/${id}`);
export const getAdminCourses      = ()          => API.get("/admin/courses");
export const deleteAdminCourse    = (id)        => API.delete(`/admin/courses/${id}`);

// CHAT
export const sendMessageAPI       = (data)      => API.post("/chat/send", data);
export const getMessagesAPI       = (userId)    => API.get(`/chat/messages/${userId}`);
export const getConversationsAPI  = ()          => API.get("/chat/conversations");

// NOTIFICATIONS
export const getNotificationsAPI  = ()          => API.get("/notifications");
export const getUnreadCountAPI    = ()          => API.get("/notifications/unread");
export const markReadAPI          = (id)        => API.put(`/notifications/${id}/read`);
export const markAllReadAPI       = ()          => API.put("/notifications/read-all");
export const sendAnnouncementAPI  = (data)      => API.post("/notifications/announce", data);
export const getAllNotifsAdminAPI  = ()          => API.get("/notifications/all");

// LIVE SESSIONS
export const goLiveAPI            = (data)      => API.post("/live/go-live", data);
export const endLiveAPI           = (id)        => API.put(`/live/end/${id}`);
export const getActiveSessionsAPI = ()          => API.get("/live/active");
export const getMySessionsAPI     = ()          => API.get("/live/my-sessions");
export const getTrainerStatsAPI   = ()          => API.get("/live/stats");
export const getAllSessionsAPI    = ()           => API.get("/live/all");

// REVIEWS / FEEDBACK
export const addReviewAPI         = (data)      => API.post("/reviews", data);
export const getCourseReviewsAPI  = (courseId)  => API.get(`/reviews/${courseId}`);
export const deleteReviewAPI      = (id)        => API.delete(`/reviews/${id}`);
export const getAllReviewsAPI      = ()          => API.get("/reviews/admin/all");

// ALIASES
export const getAllTrainersAPI = () => API.get("/users/trainers");
export const getMyEnrollmentsAPI   = getMyEnrollments;
export const getRecommendationsAPI = getRecommendations;
export const getAllCoursesAPI       = getAllCourses;
export const enrollCourseAPI       = enrollCourse;
export const getMyCoursesAPI       = getTrainerCourses;
export const createCourseAPI       = createCourse;
export const deleteCourseAPI       = deleteCourse;
export const getCourseStudentsAPI  = getCourseStudents;

export default API;