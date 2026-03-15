const Enrollment = require("../models/Enrollment");
const Course     = require("../models/Course");

// ── ENROLL IN COURSE (Free) ───────────────────────────────────────────────────
const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const traineeId   = req.user._id;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required." });
    }

    // Check course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check already enrolled
    const existing = await Enrollment.findOne({ trainee: traineeId, course: courseId });
    if (existing) {
      return res.status(200).json({ message: "Already enrolled in this course." });
    }

    // Create enrollment — free, no payment needed
    const enrollment = await Enrollment.create({
      trainee: traineeId,
      course:  courseId,
      status:  "active",
    });

    // Populate course details before returning
    await enrollment.populate("course");

    res.status(201).json({
      message: "Enrolled successfully!",
      enrollment,
    });
  } catch (err) {
    console.error("Enrollment error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── GET MY ENROLLMENTS (Trainee) ──────────────────────────────────────────────
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ trainee: req.user._id })
      .populate("course")
      .sort({ createdAt: -1 });

    res.status(200).json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET STUDENTS FOR A COURSE (Trainer) ───────────────────────────────────────
const getCourseStudents = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate("trainee", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── UNENROLL ──────────────────────────────────────────────────────────────────
const unenrollCourse = async (req, res) => {
  try {
    const deleted = await Enrollment.findOneAndDelete({
      trainee: req.user._id,
      course:  req.params.courseId,
    });

    if (!deleted) return res.status(404).json({ message: "Enrollment not found." });

    res.status(200).json({ message: "Unenrolled successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { enrollCourse, getMyEnrollments, getCourseStudents, unenrollCourse };