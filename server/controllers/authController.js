const User = require("../models/User");
const jwt  = require("jsonwebtoken");

const JWT_SECRET  = process.env.JWT_SECRET  || "opengig_secret_key_2024";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// ── Generate Token ─────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

// ── SIGNUP ─────────────────────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { name, email, password, role, phone, bio, skills, expertise } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    // Check existing user
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // Only allow Learner and Mentor to self-register
    const allowedRoles = ["Learner", "Mentor"];
    const userRole = allowedRoles.includes(role) ? role : "Learner";

    // Build user object
    const userData = {
      name:  name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role:  userRole,
    };

    if (phone)    userData.phone    = phone;
    if (bio)      userData.bio      = bio;
    if (skills)   userData.skills   = skills;    // array from frontend
    if (expertise) userData.expertise = expertise; // array from frontend

    const user  = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        phone: user.phone,
        bio:   user.bio,
      },
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ── LOGIN ──────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Find user — include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Check blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        phone: user.phone,
        bio:   user.bio,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ── GET ME ─────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { signup, login, getMe };