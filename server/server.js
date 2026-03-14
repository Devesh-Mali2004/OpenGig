const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth",        require("./routes/authRoutes"));
app.use("/api/courses",     require("./routes/courseRoutes"));
app.use("/api/enrollments", require("./routes/enrollmentRoutes"));
app.use("/api/users",       require("./routes/userRoutes"));
app.use("/api/admin",       require("./routes/adminRoutes"));
app.use("/api/recommend",   require("./routes/recommendRoutes"));

// Health check
app.get("/", (req, res) => res.json({ status: "OpenGig API running ✅" }));

// Connect DB and start server
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/opengig")
  .then(() => {
    console.log("MongoDB connected ✅");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000} 🚀`)
    );
  })
  .catch((err) => console.error("DB connection error:", err));