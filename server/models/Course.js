const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title:            { type: String, required: true, trim: true },
    description:      { type: String, required: true },
    category:         { type: String, required: true },
    price:            { type: Number, required: true, default: 0 },
    level:            { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    skillTags:        [{ type: String }],
    
    // --- ZOOM INTEGRATION FIELDS ---
    isLive:           { type: Boolean, default: false }, // Is this a live session or recorded?
    zoomDetails: {
      meetingId:      { type: String },
      joinUrl:        { type: String }, // For Trainees (Students)
      startUrl:       { type: String }, // For the Trainer (Secret link to start meeting)
      startTime:      { type: Date },   // When the meeting is scheduled
      duration:       { type: Number, default: 60 } // Duration in minutes
    },
    // -------------------------------

    trainer:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating:           { type: Number, default: 0 },
    studentsEnrolled: { type: Number, default: 0 },
    status:           { type: String, enum: ["active", "removed"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);