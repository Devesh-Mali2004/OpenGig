const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const dotenv   = require("dotenv");
dotenv.config();

const app = express();
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true }));
app.use(express.json());

app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/courses",       require("./routes/courseRoutes"));
app.use("/api/enrollments",   require("./routes/enrollmentRoutes"));
app.use("/api/users",         require("./routes/userRoutes"));
app.use("/api/admin",         require("./routes/adminRoutes"));
app.use("/api/recommend",     require("./routes/recommendRoutes"));
app.use("/api/chat",          require("./routes/chatRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/live",          require("./routes/liveSessionRoutes"));
app.use("/api/reviews",       require("./routes/reviewRoutes"));

app.get("/", (req, res) => res.json({ status: "OpenGig API running ✅" }));

const PORT      = process.env.PORT      || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/opengig";

mongoose.connect(MONGO_URI)
  .then(() => { console.log("MongoDB connected ✅"); app.listen(PORT, () => console.log(`Server on port ${PORT} 🚀`)); })
  .catch(err => console.error("❌ DB error:", err.message));