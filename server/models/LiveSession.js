const mongoose = require("mongoose");

const liveSessionSchema = new mongoose.Schema(
  {
    trainer:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course:    { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    title:     { type: String, required: true },
    zoomLink:  { type: String, required: true },
    isLive:    { type: Boolean, default: true },
    endedAt:   { type: Date },
    viewers:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveSession", liveSessionSchema);