const axios      = require("axios");
const Course     = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User       = require("../models/User");

const ML_URL = process.env.ML_URL || "http://localhost:5001";

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's skills/expertise
    const user = await User.findById(userId).select("skills expertise role");

    // Get enrolled courses
    const enrollments = await Enrollment.find({ Learner: userId })
      .populate("course", "title description tags category");
    const enrolledCourses = enrollments.map(e => e.course).filter(Boolean);

    // Get all courses
    const allCourses = await Course.find()
      .populate("Mentor", "name")
      .lean();

    const userSkills = [
      ...(user?.skills    || []),
      ...(user?.expertise || []),
    ];

    // Call ML service
    try {
      const mlRes = await axios.post(`${ML_URL}/recommend`, {
        user_skills:      userSkills,
        enrolled_courses: enrolledCourses.map(c => ({
          _id:         c._id?.toString(),
          title:       c.title       || "",
          description: c.description || "",
          tags:        c.tags        || [],
          category:    c.category    || "",
        })),
        all_courses: allCourses.map(c => ({
          _id:         c._id?.toString(),
          title:       c.title       || "",
          description: c.description || "",
          tags:        c.tags        || [],
          category:    c.category    || "",
          price:       c.price       || 0,
          level:       c.level       || "Beginner",
          Mentor:     c.Mentor,
          zoomLink:    c.zoomLink    || "",
          duration:    c.duration    || "",
        })),
      }, { timeout: 5000 });

      return res.status(200).json(mlRes.data.recommendations || []);
    } catch (mlErr) {
      console.warn("ML service unavailable, using fallback:", mlErr.message);

      // Fallback — return unenrolled courses sorted by newest
      const enrolledIds = new Set(enrolledCourses.map(c => c._id?.toString()));
      const fallback    = allCourses
        .filter(c => !enrolledIds.has(c._id?.toString()))
        .slice(0, 10);

      return res.status(200).json(fallback);
    }
  } catch (err) {
    console.error("Recommend error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRecommendations };