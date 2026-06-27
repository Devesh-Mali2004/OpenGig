const express = require("express");
const router  = express.Router();
const {
  getAllCourses, getCourseById, getMyCourses,
  createCourse, updateCourse, deleteCourse,
} = require("../controllers/courseController");
// CORRECT:
const { protect, trainerOnly } = require("../middleware/authMiddleware");
// Public
router.get("/",            getAllCourses);


// Protected — Mentor must be authenticated
router.get("/trainer/my-courses", protect, trainerOnly, getMyCourses);
router.get("/:id",         getCourseById);
router.post("/",           protect, trainerOnly, createCourse);
router.put("/:id",         protect, trainerOnly, updateCourse);
router.delete("/:id",      protect, trainerOnly, deleteCourse);

module.exports = router;