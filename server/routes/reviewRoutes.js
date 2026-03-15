const express = require("express");
const router  = express.Router();
const { addReview, getCourseReviews, deleteReview, getAllReviews } = require("../controllers/reviewController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/",              protect, addReview);
router.get("/:courseId",      protect, getCourseReviews);
router.delete("/:id",         protect, deleteReview);
router.get("/admin/all",      protect, adminOnly, getAllReviews);

module.exports = router;