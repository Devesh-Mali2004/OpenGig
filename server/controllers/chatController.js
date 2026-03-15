const Message = require("../models/Message");
const User    = require("../models/User");

// ── SEND MESSAGE ──────────────────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId || !text || !text.trim()) {
      return res.status(400).json({ message: "Receiver and message text are required." });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "Receiver not found." });

    const message = await Message.create({
      sender:   req.user._id,
      receiver: receiverId,
      text:     text.trim(),
    });

    await message.populate("sender",   "name email role");
    await message.populate("receiver", "name email role");

    res.status(201).json(message);
  } catch (err) {
    console.error("Send message error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── GET MESSAGES between two users ────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const otherId = req.params.userId;
    const myId    = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myId,    receiver: otherId },
        { sender: otherId, receiver: myId    },
      ],
    })
      .populate("sender",   "name email role")
      .populate("receiver", "name email role")
      .sort({ createdAt: 1 });

    // Mark messages from other person as read
    await Message.updateMany(
      { sender: otherId, receiver: myId, read: false },
      { read: true }
    );

    res.status(200).json(messages);
  } catch (err) {
    console.error("Get messages error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── GET CONVERSATIONS ─────────────────────────────────────────────────────────
const getConversations = async (req, res) => {
  try {
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }],
    })
      .populate("sender",   "name email role")
      .populate("receiver", "name email role")
      .sort({ createdAt: -1 });

    const seen          = new Set();
    const conversations = [];

    for (const msg of messages) {
      const sId  = msg.sender?._id?.toString();
      const myStr = myId.toString();
      const other = sId === myStr ? msg.receiver : msg.sender;
      if (!other?._id) continue;

      const otherId = other._id.toString();
      if (seen.has(otherId)) continue;
      seen.add(otherId);

      const unread = await Message.countDocuments({
        sender: other._id, receiver: myId, read: false,
      });
      conversations.push({ user: other, lastMessage: msg, unread });
    }

    res.status(200).json(conversations);
  } catch (err) {
    console.error("Get conversations error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendMessage, getMessages, getConversations };