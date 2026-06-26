const express   = require("express");
const mongoose  = require("mongoose");
const cors      = require("cors");
const dotenv    = require("dotenv");
const http      = require("http");
const { Server } = require("socket.io");
dotenv.config();

const app    = express();
const server = http.createServer(app);

// ── Socket.io setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible in controllers
app.set("io", io);

// ── Connected users map: userId → socketId ────────────────────────────────────
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // User joins with their userId
  socket.on("user:join", (userId) => {
    if (userId) {
      onlineUsers.set(userId.toString(), socket.id);
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} online (${onlineUsers.size} total)`);
      // Broadcast online status
      io.emit("users:online", Array.from(onlineUsers.keys()));
    }
  });

  // Private message
  socket.on("message:send", (data) => {
    const { receiverId, message } = data;
    if (receiverId && message) {
      io.to(`user:${receiverId}`).emit("message:receive", message);
    }
  });

  // Typing indicator
  socket.on("typing:start", ({ receiverId, senderName }) => {
    io.to(`user:${receiverId}`).emit("typing:start", { senderName });
  });
  socket.on("typing:stop", ({ receiverId }) => {
    io.to(`user:${receiverId}`).emit("typing:stop");
  });

  // User disconnect
  socket.on("disconnect", () => {
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`👤 User ${userId} offline`);
        break;
      }
    }
    io.emit("users:online", Array.from(onlineUsers.keys()));
  });
});

// Export io for use in controllers
module.exports.io = io;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
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
app.use("/api/payments", require("./routes/paymentRoutes"));
app.get("/", (req, res) => res.json({ status: "OpenGig API ✅", realtime: "Socket.io enabled" }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT      = process.env.PORT      || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/opengig";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ✅");
    server.listen(PORT, () => console.log(`Server + Socket.io running on port ${PORT} 🚀`));
  })
  .catch(err => console.error("❌ DB error:", err.message));