const Message = require("../models/Message");
const User    = require("../models/User");

const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text?.trim()) {
      return res.status(400).json({ message: "Receiver and text are required." });
    }
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "Receiver not found." });

    const message = await Message.create({
      sender: req.user._id, receiver: receiverId, text: text.trim(),
    });
    await message.populate("sender",   "name email role");
    await message.populate("receiver", "name email role");

    // Real-time emit
    const io = req.app.get("io");
    if (io) io.to(`user:${receiverId}`).emit("message:receive", message);

    res.status(201).json(message);
  } catch (err) {
    console.error("Send message error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const otherId = req.params.userId;
    const myId    = req.user._id;
    const messages = await Message.find({
      $or: [{ sender: myId, receiver: otherId }, { sender: otherId, receiver: myId }],
    }).populate("sender", "name email role").populate("receiver", "name email role").sort({ createdAt: 1 });
    await Message.updateMany({ sender: otherId, receiver: myId, read: false }, { read: true });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const myId = req.user._id;
    const messages = await Message.find({ $or: [{ sender: myId }, { receiver: myId }] })
      .populate("sender", "name email role").populate("receiver", "name email role")
      .sort({ createdAt: -1 });

    const seen = new Set(), convs = [];
    for (const msg of messages) {
      const other = msg.sender?._id?.toString() === myId.toString() ? msg.receiver : msg.sender;
      if (!other?._id) continue;
      const oid = other._id.toString();
      if (seen.has(oid)) continue;
      seen.add(oid);
      const unread = await Message.countDocuments({ sender: other._id, receiver: myId, read: false });
      convs.push({ user: other, lastMessage: msg, unread });
    }
    res.status(200).json(convs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendMessage, getMessages, getConversations };