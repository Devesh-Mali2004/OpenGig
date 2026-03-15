const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true, select: false },
    role:      { type: String, enum: ["trainee", "trainer", "admin"], default: "trainee" },
    phone:     { type: String, default: "" },
    bio:       { type: String, default: "" },
    skills:    [{ type: String }],     // for trainees — what they want to learn
    expertise: [{ type: String }],     // for trainers — what they teach
    isBlocked: { type: Boolean, default: false },
    status:    { type: String, default: "active" },
  },
  { timestamps: true }
);

// ── Hash password before saving ───────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Compare password ──────────────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);