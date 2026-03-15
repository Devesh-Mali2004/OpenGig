const Review     = require("../models/Review");
const Enrollment = require("../models/Enrollment");

// ── Add / Update Review ───────────────────────────────────────────────────────
const addReview = async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    if (!courseId || !rating) return res.status(400).json({ message: "Course and rating required." });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5." });

    // Must be enrolled to review
    const enrolled = await Enrollment.findOne({ trainee: req.user._id, course: courseId });
    if (!enrolled) return res.status(403).json({ message: "You must be enrolled to review this course." });

    // Upsert — update if already reviewed
    const review = await Review.findOneAndUpdate(
      { user: req.user._id, course: courseId },
      { rating, comment: comment || "" },
      { new: true, upsert: true }
    );
    await review.populate("user", "name");
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get Reviews for a Course ──────────────────────────────────────────────────
const getCourseReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ course: req.params.courseId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.status(200).json({ reviews, avgRating, total: reviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete Review ─────────────────────────────────────────────────────────────
const deleteReview = async (req, res) => {
  try {
    await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.status(200).json({ message: "Review deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get all reviews (admin) ───────────────────────────────────────────────────
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user",   "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addReview, getCourseReviews, deleteReview, getAllReviews };