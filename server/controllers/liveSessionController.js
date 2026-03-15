const LiveSession  = require("../models/LiveSession");
const Notification = require("../models/Notification");
const Enrollment   = require("../models/Enrollment");
const Course       = require("../models/Course");
const User         = require("../models/User");
const crypto       = require("crypto");

// ── Auto-generate Jitsi meeting link ─────────────────────────────────────────
const generateMeetingLink = (title, courseId) => {
  const uid  = crypto.randomBytes(5).toString("hex");
  const slug = (title || "session").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 18);
  const cid  = courseId ? courseId.toString().slice(-6) : "gen";
  return `https://meet.jit.si/OpenGig-${slug}-${cid}-${uid}`;
};

// ── GO LIVE ───────────────────────────────────────────────────────────────────
const goLive = async (req, res) => {
  try {
    const { title, courseId, customLink } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "Session title is required." });
    }

    // Auto-generate or use custom link
    const meetingLink = customLink?.trim() || generateMeetingLink(title, courseId);

    // End any previous live session by this trainer
    await LiveSession.updateMany(
      { trainer: req.user._id, isLive: true },
      { isLive: false, endedAt: new Date() }
    );

    // Create new session
    const session = await LiveSession.create({
      trainer:  req.user._id,
      course:   courseId || null,
      title:    title.trim(),
      zoomLink: meetingLink,
      isLive:   true,
    });

    // Find trainees to notify
    let traineeIds = [];
    let courseTitle = "";

    if (courseId) {
      const enrollments = await Enrollment.find({ course: courseId }).select("trainee");
      traineeIds = enrollments.map(e => e.trainee.toString());
      const course = await Course.findById(courseId).select("title");
      courseTitle = course?.title || "";
    } else {
      const trainees = await User.find({ role: "trainee", isBlocked: false }).select("_id");
      traineeIds = trainees.map(t => t._id.toString());
    }

    // Create notifications
    if (traineeIds.length > 0) {
      const notifs = traineeIds.map(tid => ({
        recipient: tid,
        sender:    req.user._id,
        type:      "live_session",
        title:     `🔴 ${req.user.name} is Live!`,
        message:   `"${title}"${courseTitle ? ` — ${courseTitle}` : ""}. Click Join to enter.`,
        link:      "/live",
        data:      { zoomLink: meetingLink, sessionId: session._id.toString(), courseId: courseId || "" },
      }));
      await Notification.insertMany(notifs);

      // Real-time socket push to all trainees
      const io = req.app.get("io");
      if (io) {
        traineeIds.forEach(tid => {
          io.to(`user:${tid}`).emit("notification:new", {
            type:    "live_session",
            title:   `🔴 ${req.user.name} is Live!`,
            message: `"${title}" — Click to join`,
            data:    { zoomLink: meetingLink },
          });
        });
      }
    }

    await session.populate("trainer", "name email");

    res.status(201).json({
      message:     `🔴 You are live! ${traineeIds.length} trainees notified.`,
      session,
      meetingLink, // Return so trainer can see/copy it
    });
  } catch (err) {
    console.error("Go live error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── END LIVE ──────────────────────────────────────────────────────────────────
const endLive = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found." });
    if (session.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    session.isLive  = false;
    session.endedAt = new Date();
    await session.save();

    res.status(200).json({ message: "Session ended.", session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET ACTIVE SESSIONS ───────────────────────────────────────────────────────
const getActiveSessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find({ isLive: true })
      .populate("trainer", "name email")
      .populate("course",  "title")
      .sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET MY SESSIONS (trainer) ─────────────────────────────────────────────────
const getMySessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find({ trainer: req.user._id })
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET TRAINER STATS ─────────────────────────────────────────────────────────
const getTrainerStats = async (req, res) => {
  try {
    const courses        = await Course.find({ trainer: req.user._id });
    const courseIds      = courses.map(c => c._id);
    const totalEnrollments = await Enrollment.countDocuments({ course: { $in: courseIds } });
    const activeSessions   = await LiveSession.countDocuments({ trainer: req.user._id, isLive: true });
    const totalSessions    = await LiveSession.countDocuments({ trainer: req.user._id });

    res.status(200).json({
      totalCourses: courses.length, totalEnrollments,
      activeSessions, totalSessions,
      liveNow: activeSessions > 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET ALL SESSIONS (admin) ──────────────────────────────────────────────────
const getAllSessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find()
      .populate("trainer", "name email")
      .populate("course",  "title")
      .sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { goLive, endLive, getActiveSessions, getMySessions, getTrainerStats, getAllSessions };