const express    = require("express");
const router     = express.Router();
const { signup, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/signup",   signup);   // used by frontend register
router.post("/login",    login);    // used by frontend login
router.get("/me",        protect, getMe);

module.exports = router;