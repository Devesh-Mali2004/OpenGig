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

    // End any previous live session by this Mentor
    await LiveSession.updateMany(
      { Mentor: req.user._id, isLive: true },
      { isLive: false, endedAt: new Date() }
    );

    // Create new session
    const session = await LiveSession.create({
      Mentor:  req.user._id,
      course:   courseId || null,
      title:    title.trim(),
      zoomLink: meetingLink,
      isLive:   true,
    });

    // Find Learners to notify
    let LearnerIds = [];
    let courseTitle = "";

    if (courseId) {
      const enrollments = await Enrollment.find({ course: courseId }).select("Learner");
      LearnerIds = enrollments.map(e => e.Learner.toString());
      const course = await Course.findById(courseId).select("title");
      courseTitle = course?.title || "";
    } else {
      const Learners = await User.find({ role: "Learner", isBlocked: false }).select("_id");
      LearnerIds = Learners.map(t => t._id.toString());
    }

    // Create notifications
    if (LearnerIds.length > 0) {
      const notifs = LearnerIds.map(tid => ({
        recipient: tid,
        sender:    req.user._id,
        type:      "live_session",
        title:     `🔴 ${req.user.name} is Live!`,
        message:   `"${title}"${courseTitle ? ` — ${courseTitle}` : ""}. Click Join to enter.`,
        link:      "/live",
        data:      { zoomLink: meetingLink, sessionId: session._id.toString(), courseId: courseId || "" },
      }));
      await Notification.insertMany(notifs);

      // Real-time socket push to all Learners
      const io = req.app.get("io");
      if (io) {
        LearnerIds.forEach(tid => {
          io.to(`user:${tid}`).emit("notification:new", {
            type:    "live_session",
            title:   `🔴 ${req.user.name} is Live!`,
            message: `"${title}" — Click to join`,
            data:    { zoomLink: meetingLink },
          });
        });
      }
    }

    await session.populate("Mentor", "name email");

    res.status(201).json({
      message:     `🔴 You are live! ${LearnerIds.length} Learners notified.`,
      session,
      meetingLink, // Return so Mentor can see/copy it
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
    if (session.Mentor.toString() !== req.user._id.toString()) {
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
      .populate("Mentor", "name email")
      .populate("course",  "title")
      .sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET MY SESSIONS (Mentor) ─────────────────────────────────────────────────
const getMySessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find({ Mentor: req.user._id })
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET Mentor STATS ─────────────────────────────────────────────────────────
const getMentorStats = async (req, res) => {
  try {
    const courses        = await Course.find({ Mentor: req.user._id });
    const courseIds      = courses.map(c => c._id);
    const totalEnrollments = await Enrollment.countDocuments({ course: { $in: courseIds } });
    const activeSessions   = await LiveSession.countDocuments({ Mentor: req.user._id, isLive: true });
    const totalSessions    = await LiveSession.countDocuments({ Mentor: req.user._id });

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
      .populate("Mentor", "name email")
      .populate("course",  "title")
      .sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { goLive, endLive, getActiveSessions, getMySessions, getMentorStats, getAllSessions };