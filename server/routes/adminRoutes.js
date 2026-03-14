const express = require("express");
const router = express.Router();
const { getStats, getAllUsers, blockUser, unblockUser, deleteCourse } = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/stats",                protect, adminOnly, getStats);
router.get("/users",                protect, adminOnly, getAllUsers);
router.put("/users/:id/block",      protect, adminOnly, blockUser);
router.put("/users/:id/unblock",    protect, adminOnly, unblockUser);
router.delete("/courses/:id",       protect, adminOnly, deleteCourse);

module.exports = router;