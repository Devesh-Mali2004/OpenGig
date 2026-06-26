const User        = require("../models/User");
const Course      = require("../models/Course");
const Enrollment  = require("../models/Enrollment");
const LiveSession = require("../models/LiveSession");

// ── Platform Stats ────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const totalUsers       = await User.countDocuments();
    const totalMentors    = await User.countDocuments({ role: "Mentor" });
    const totalLearners    = await User.countDocuments({ role: "Learner" });
    const totalCourses     = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const blockedUsers     = await User.countDocuments({ isBlocked: true });
    const activeSessions   = await LiveSession.countDocuments({ isLive: true });
    const totalSessions    = await LiveSession.countDocuments();

    res.status(200).json({
      totalUsers, totalMentors, totalLearners,
      totalCourses, totalEnrollments, blockedUsers,
      activeSessions, totalSessions,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Get All Users ─────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Block User ────────────────────────────────────────────────────────────────
const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ message: `${user.name} has been blocked.`, user });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Unblock User ──────────────────────────────────────────────────────────────
const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ message: `${user.name} has been unblocked.`, user });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Delete User ───────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.role === "admin") return res.status(403).json({ message: "Cannot delete admin." });
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted." });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Get All Courses (admin) ───────────────────────────────────────────────────
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("Mentor", "name email")
      .sort({ createdAt: -1 });
    // Attach enrollment count
    const withCounts = await Promise.all(courses.map(async (c) => {
      const count = await Enrollment.countDocuments({ course: c._id });
      return { ...c.toObject(), enrollmentCount: count };
    }));
    res.status(200).json(withCounts);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Delete Course (admin) ─────────────────────────────────────────────────────
const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    await Enrollment.deleteMany({ course: req.params.id });
    res.status(200).json({ message: "Course deleted." });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getStats, getAllUsers, blockUser, unblockUser, deleteUser, getAllCourses, deleteCourse };