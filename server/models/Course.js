const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title:            { type: String, required: true, trim: true },
    description:      { type: String, required: true },
    category:         { type: String, required: true },
    price:            { type: Number, required: true, default: 0 },
    level:            { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    skillTags:        [{ type: String }],
    demoVideo:        { type: String, default: "" }, // ← NEW: YouTube URL or direct video link

    // --- ZOOM INTEGRATION FIELDS ---
    isLive:           { type: Boolean, default: false },
    zoomDetails: {
      meetingId:      { type: String },
      joinUrl:        { type: String },
      startUrl:       { type: String },
      startTime:      { type: Date },
      duration:       { type: Number, default: 60 }
    },
    // --------------------------------

    Mentor:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating:           { type: Number, default: 0 },
    studentsEnrolled: { type: Number, default: 0 },
    status:           { type: String, enum: ["active", "removed"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);