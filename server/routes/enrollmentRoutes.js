const express = require("express");
const router = express.Router();
const { enrollCourse, getMyEnrollments, getCourseStudents } = require("../controllers/enrollmentController");
const { protect, trainerOnly } = require("../middleware/authMiddleware");

router.post("/",                        protect, enrollCourse);
router.get("/my",                       protect, getMyEnrollments);
router.get("/course/:courseId",         protect, trainerOnly, getCourseStudents);

module.exports = router;