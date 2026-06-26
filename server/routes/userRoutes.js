const express  = require("express");
const router   = express.Router();
const User     = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// ── Get all Mentors (for Learners to start chat) ─────────────────────────────
router.get("/Mentors", protect, async (req, res) => {
  try {
    const Mentors = await User.find({ role: "Mentor", isBlocked: false })
      .select("name email bio expertise phone role")
      .sort({ name: 1 });
    res.json(Mentors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get all Learners (for Mentors to start chat) ─────────────────────────────
router.get("/Learners", protect, async (req, res) => {
  try {
    const Learners = await User.find({ role: "Learner", isBlocked: false })
      .select("name email bio skills phone role")
      .sort({ name: 1 });
    res.json(Learners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update profile ────────────────────────────────────────────────────────────
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone, bio, skills, expertise } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, bio, skills, expertise },
      { new: true, runValidators: false }
    ).select("-password");
    if (!updated) return res.status(404).json({ message: "User not found." });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get user by ID ────────────────────────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;