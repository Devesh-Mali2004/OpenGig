const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    Learner:   { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
    course:    { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    progress:  { type: Number, default: 0, min: 0, max: 100 },
    status:    { type: String, enum: ["active", "completed"], default: "active" },
    // ── Payment tracking (populated for paid courses, empty for free) ──
    paymentId: { type: String, default: "" },
    orderId:   { type: String, default: "" },
  },
  { timestamps: true }
);

enrollmentSchema.index({ Learner: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);