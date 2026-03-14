const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

// POST /api/enrollments — enroll in course
const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const existing = await Enrollment.findOne({ learner: req.user.id, course: courseId });
    if (existing) return res.status(400).json({ message: "Already enrolled" });

    const enrollment = await Enrollment.create({ learner: req.user.id, course: courseId });
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ message: "Enrollment failed", error: err.message });
  }
};

// GET /api/enrollments/my — learner's enrollments
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ learner: req.user.id }).populate("course");
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch enrollments", error: err.message });
  }
};

// GET /api/enrollments/course/:courseId — students in a course (trainer)
const getCourseStudents = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.courseId }).populate("learner", "name email");
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students", error: err.message });
  }
};

module.exports = { enrollCourse, getMyEnrollments, getCourseStudents };