const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const totalUsers    = await User.countDocuments();
    const totalCourses  = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const trainers      = await User.countDocuments({ role: "trainer" });
    const learners      = await User.countDocuments({ role: "learner" });

    res.json({ totalUsers, totalCourses, totalEnrollments, trainers, learners });
  } catch (err) {
    res.status(500).json({ message: "Failed to get stats", error: err.message });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// PUT /api/admin/users/:id/block
const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    ).select("-password");
    res.json({ message: "User blocked", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to block user", error: err.message });
  }
};

// PUT /api/admin/users/:id/unblock
const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    ).select("-password");
    res.json({ message: "User unblocked", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to unblock user", error: err.message });
  }
};

// DELETE /api/admin/courses/:id
const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted by admin" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course", error: err.message });
  }
};

module.exports = { getStats, getAllUsers, blockUser, unblockUser, deleteCourse };