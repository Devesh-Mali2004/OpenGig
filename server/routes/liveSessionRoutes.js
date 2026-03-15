const express = require("express");
const router  = express.Router();
const { goLive, endLive, getActiveSessions, getMySessions, getTrainerStats } = require("../controllers/liveSessionController");
const { protect, trainerOnly } = require("../middleware/authMiddleware");

router.post("/go-live",     protect, trainerOnly, goLive);
router.put("/end/:id",      protect, trainerOnly, endLive);
router.get("/active",       protect, getActiveSessions);
router.get("/my-sessions",  protect, trainerOnly, getMySessions);
router.get("/stats",        protect, trainerOnly, getTrainerStats);

module.exports = router;