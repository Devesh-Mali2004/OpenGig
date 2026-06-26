const Enrollment = require("../models/Enrollment");
const Course     = require("../models/Course");

// ── ENROLL IN COURSE (Free courses only) ─────────────────────────────────────
const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const LearnerId   = req.user._id;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // ── Paid courses must go through the payment flow ──────────────────────
    if (course.price > 0) {
      return res.status(402).json({
        message: "This is a paid course. Please complete payment to enroll.",
        price: course.price,
      });
    }

    // Check already enrolled
    const existing = await Enrollment.findOne({ Learner: LearnerId, course: courseId });
    if (existing) {
      return res.status(200).json({ message: "Already enrolled in this course." });
    }

    const enrollment = await Enrollment.create({
      Learner: LearnerId,
      course:  courseId,
      status:  "active",
    });

    await enrollment.populate("course");

    // Increment student count
    await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: 1 } });

    res.status(201).json({
      message: "Enrolled successfully!",
      enrollment,
    });
  } catch (err) {
    console.error("Enrollment error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── GET MY ENROLLMENTS (Learner) ──────────────────────────────────────────────
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ Learner: req.user._id })
      .populate({
        path: "course",
        populate: { path: "Mentor", select: "name email bio expertise" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET STUDENTS FOR A COURSE (Mentor) ───────────────────────────────────────
const getCourseStudents = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate("Learner", "name email phone")
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
      Learner: req.user._id,
      course:  req.params.courseId,
    });

    if (!deleted) return res.status(404).json({ message: "Enrollment not found." });

    res.status(200).json({ message: "Unenrolled successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { enrollCourse, getMyEnrollments, getCourseStudents, unenrollCourse };