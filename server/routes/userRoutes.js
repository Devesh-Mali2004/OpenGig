const express  = require("express");
const router   = express.Router();
const User     = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// ── Get all trainers (for trainees to start chat) ─────────────────────────────
router.get("/trainers", protect, async (req, res) => {
  try {
    const trainers = await User.find({ role: "trainer", isBlocked: false })
      .select("name email bio expertise phone role")
      .sort({ name: 1 });
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get all trainees (for trainers to start chat) ─────────────────────────────
router.get("/trainees", protect, async (req, res) => {
  try {
    const trainees = await User.find({ role: "trainee", isBlocked: false })
      .select("name email bio skills phone role")
      .sort({ name: 1 });
    res.json(trainees);
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