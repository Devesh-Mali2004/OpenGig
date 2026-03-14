const express = require("express");
const router = express.Router();
const { getAllCourses, getMyCourses, createCourse, updateCourse, deleteCourse } = require("../controllers/courseController");
const { protect, trainerOnly } = require("../middleware/authMiddleware");

router.get("/",          getAllCourses);
router.get("/my",        protect, trainerOnly, getMyCourses);
router.post("/",         protect, trainerOnly, createCourse);
router.put("/:id",       protect, trainerOnly, updateCourse);
router.delete("/:id",    protect, trainerOnly, deleteCourse);

module.exports = router;

