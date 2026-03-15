const express = require("express");
const router  = express.Router();
const { getNotifications, getUnreadCount, markRead, markAllRead, sendAnnouncement, getAllNotifications } = require("../controllers/notificationController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/",             protect, getNotifications);
router.get("/unread",       protect, getUnreadCount);
router.put("/:id/read",     protect, markRead);
router.put("/read-all",     protect, markAllRead);
router.post("/announce",    protect, adminOnly, sendAnnouncement);
router.get("/all",          protect, adminOnly, getAllNotifications);

module.exports = router;