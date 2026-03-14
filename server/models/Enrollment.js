const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    trainee:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course:   { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status:   { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true }
);

enrollmentSchema.index({ trainee: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);