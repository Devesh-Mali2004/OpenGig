const express = require("express");
const router  = express.Router();
const { getStats, getAllUsers, blockUser, unblockUser, deleteUser, getAllCourses, deleteCourse } = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/stats",           protect, adminOnly, getStats);
router.get("/users",           protect, adminOnly, getAllUsers);
router.put("/block/:id",       protect, adminOnly, blockUser);
router.put("/unblock/:id",     protect, adminOnly, unblockUser);
router.delete("/users/:id",    protect, adminOnly, deleteUser);
router.get("/courses",         protect, adminOnly, getAllCourses);
router.delete("/courses/:id",  protect, adminOnly, deleteCourse);

module.exports = router;