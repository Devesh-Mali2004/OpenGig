const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "No token, access denied" });

  try {
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "opengig_secret_key_2024");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Admin access only" });
};

const trainerOnly = (req, res, next) => {
  if (req.user?.role === "trainer" || req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Trainer access only" });
};

module.exports = { protect, adminOnly, trainerOnly };