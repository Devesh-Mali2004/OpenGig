const Course     = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: "active" })
      .populate("Mentor", "name email bio expertise")
      .sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("Mentor", "name email bio expertise");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ Mentor: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createCourse = async (req, res) => {
  try {
    const {
      title, description, price, category, tags,
      zoomLink, duration, level,
      demoVideo,     // ← NEW
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const course = await Course.create({
      title,
      description,
      price:     Number(price)  || 0,
      category:  category       || "General",
      tags:      tags           || [],
      zoomLink:  zoomLink       || "",
      duration:  duration       || "",
      level:     level          || "Beginner",
      demoVideo: demoVideo      || "",   // ← NEW
      Mentor:   req.user._id,
    });

    res.status(201).json(course);
  } catch (err) {
    console.error("Create course error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.Mentor.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    // req.body already contains demoVideo if provided
    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.Mentor.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    await Course.findByIdAndDelete(req.params.id);
    await Enrollment.deleteMany({ course: req.params.id });
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getAllCourses, getCourseById, getMyCourses,
  createCourse, updateCourse, deleteCourse,
};