const Notification = require("../models/Notification");
const User         = require("../models/User");

const getNotifications = async (req, res) => {
  try {
    const list = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name role")
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.status(200).json({ count });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true }
    );
    res.status(200).json({ message: "Marked as read" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.status(200).json({ message: "All marked as read" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin: broadcast announcement
const sendAnnouncement = async (req, res) => {
  try {
    const { title, message, targetRole } = req.body;
    if (!title || !message) return res.status(400).json({ message: "Title and message required." });

    const query = targetRole && targetRole !== "all" ? { role: targetRole } : {};
    const users = await User.find(query).select("_id");

    const notifs = users.map(u => ({
      recipient: u._id, sender: req.user._id,
      type: "general", title, message, link: "/dashboard", data: {},
    }));
    await Notification.insertMany(notifs);

    // Real-time push via socket
    const io = req.app.get("io");
    if (io) {
      users.forEach(u => {
        io.to(`user:${u._id}`).emit("notification:new", { type: "general", title, message });
      });
    }

    res.status(201).json({ message: `Announcement sent to ${users.length} users.` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getAllNotifications = async (req, res) => {
  try {
    const list = await Notification.find()
      .populate("sender",    "name role")
      .populate("recipient", "name role")
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, sendAnnouncement, getAllNotifications };