const express = require("express");
const router  = express.Router();
const { sendMessage, getMessages, getConversations } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

// IMPORTANT: /conversations MUST come before /:userId
router.get("/conversations",  protect, getConversations);
router.get("/messages/:userId", protect, getMessages);   // changed to /messages/:userId
router.post("/send",          protect, sendMessage);     // changed to /send for clarity

module.exports = router;