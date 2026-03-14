const axios = require("axios");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// GET /api/recommend
const getRecommendations = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ learner: req.user.id }).populate("course");
    const enrolledCategories = enrollments.map(e => e.course?.category).filter(Boolean);

    const allCourses = await Course.find().populate("trainer", "name");

    // Call ML service
    try {
      const mlRes = await axios.post(
        `${process.env.ML_SERVICE_URL || "http://localhost:5001"}/recommend`,
        { categories: enrolledCategories, courses: allCourses }
      );
      return res.json(mlRes.data);
    } catch (mlErr) {
      // Fallback: return all courses if ML is down
      return res.json({ recommendations: allCourses.slice(0, 6) });
    }
  } catch (err) {
    res.status(500).json({ message: "Recommendation failed", error: err.message });
  }
};

module.exports = { getRecommendations };