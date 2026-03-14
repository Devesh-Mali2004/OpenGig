const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// GET /api/users/profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to get profile", error: err.message });
  }
});

// PUT /api/users/profile
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

module.exports = router;