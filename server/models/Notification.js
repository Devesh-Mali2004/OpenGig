const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type:       { type: String, enum: ["live_session", "enrollment", "message", "general"], default: "general" },
    title:      { type: String, required: true },
    message:    { type: String, required: true },
    link:       { type: String, default: "" },   // where to redirect on click
    data:       { type: Object, default: {} },    // extra payload e.g. { courseId, zoomLink }
    read:       { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);