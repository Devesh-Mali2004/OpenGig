const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course:   { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    text:     { type: String, required: true, trim: true },
    read:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);