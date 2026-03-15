const LiveSession  = require("../models/LiveSession");
const Notification = require("../models/Notification");
const Enrollment   = require("../models/Enrollment");
const Course       = require("../models/Course");
const User         = require("../models/User");
const crypto       = require("crypto");

const generateMeetingLink = (title) => {
  const uid  = crypto.randomBytes(4).toString("hex");
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20);
  return `https://meet.jit.si/opengig-${slug}-${uid}`;
};

const goLive = async (req, res) => {
  try {
    const { title, courseId, zoomLink: customLink } = req.body;
    if (!title) return res.status(400).json({ message: "Session title is required." });

    const meetingLink = customLink || generateMeetingLink(title);

    await LiveSession.updateMany({ trainer: req.user._id, isLive: true }, { isLive: false, endedAt: new Date() });

    const session = await LiveSession.create({
      trainer: req.user._id, course: courseId || null,
      title, zoomLink: meetingLink, isLive: true,
    });

    let traineeIds = [];
    if (courseId) {
      const enrollments = await Enrollment.find({ course: courseId }).select("trainee");
      traineeIds = enrollments.map(e => e.trainee);
    } else {
      const trainees = await User.find({ role: "trainee", isBlocked: false }).select("_id");
      traineeIds = trainees.map(t => t._id);
    }

    if (traineeIds.length > 0) {
      const courseInfo = courseId ? await Course.findById(courseId).select("title") : null;
      const notifs = traineeIds.map(tid => ({
        recipient: tid, sender: req.user._id, type: "live_session",
        title: "🔴 Live Session Started!",
        message: `${req.user.name} is live: "${title}"${courseInfo ? ` (${courseInfo.title})` : ""}. Click to join!`,
        link: "/live", data: { zoomLink: meetingLink, sessionId: session._id, courseId },
      }));
      await Notification.insertMany(notifs);
    }

    await session.populate("trainer", "name email");
    res.status(201).json({ message: `🔴 Live! ${traineeIds.length} trainees notified.`, session, meetingLink });
  } catch (err) {
    console.error("Go live error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const endLive = async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndUpdate(req.params.id, { isLive: false, endedAt: new Date() }, { new: true });
    if (!session) return res.status(404).json({ message: "Session not found." });
    res.status(200).json({ message: "Session ended.", session });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getActiveSessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find({ isLive: true })
      .populate("trainer", "name email").populate("course", "title").sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMySessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find({ trainer: req.user._id })
      .populate("course", "title").sort({ createdAt: -1 }).limit(20);
    res.status(200).json(sessions);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getTrainerStats = async (req, res) => {
  try {
    const courses = await Course.find({ trainer: req.user._id });
    const courseIds = courses.map(c => c._id);
    const totalEnrollments = await Enrollment.countDocuments({ course: { $in: courseIds } });
    const activeSessions   = await LiveSession.countDocuments({ trainer: req.user._id, isLive: true });
    const totalSessions    = await LiveSession.countDocuments({ trainer: req.user._id });
    res.status(200).json({ totalCourses: courses.length, totalEnrollments, activeSessions, totalSessions, liveNow: activeSessions > 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getAllSessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find()
      .populate("trainer", "name email").populate("course", "title").sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { goLive, endLive, getActiveSessions, getMySessions, getTrainerStats, getAllSessions };