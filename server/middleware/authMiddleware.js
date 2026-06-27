const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    let token = req.headers.authorization?.startsWith("Bearer") && req.headers.authorization.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Not authorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "opengig_secret");
        req.user = await User.findById(decoded.id).select("-password");
        next();
    } catch (error) {
        res.status(401).json({ message: "Token failed" });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") next();
    else res.status(403).json({ message: "Admin access only" });
};

const trainerOnly = (req, res, next) => {
    if (req.user && req.user.role === "Mentor") next();
    else res.status(403).json({ message: "Mentor access only" });
};

module.exports = { protect, adminOnly, trainerOnly };