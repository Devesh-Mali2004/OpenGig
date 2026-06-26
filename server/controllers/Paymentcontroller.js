const Razorpay  = require("razorpay");
const crypto    = require("crypto");
const Enrollment = require("../models/Enrollment");
const Course    = require("../models/Course");

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

// ── CREATE ORDER ──────────────────────────────────────────────────────────────
// Called when Learner clicks "Buy Now"
// Returns an orderId that the frontend passes to the Razorpay checkout
const createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    if (course.price === 0) {
      return res.status(400).json({ message: "This is a free course — use the free enroll flow." });
    }

    // Idempotency: don't create an order if already enrolled
    const existing = await Enrollment.findOne({ Learner: req.user._id, course: courseId });
    if (existing) {
      return res.status(400).json({ message: "You are already enrolled in this course." });
    }

    const order = await razorpay.orders.create({
      amount:   Math.round(course.price * 100), // Razorpay works in paise
      currency: "INR",
      receipt:  `og_${courseId.toString().slice(-6)}_${Date.now()}`,
      notes: {
        courseId: courseId.toString(),
        userId:   req.user._id.toString(),
      },
    });

    res.status(200).json({
      orderId:    order.id,
      amount:     order.amount,
      currency:   order.currency,
      courseName: course.title,
      keyId:      process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Create order error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── VERIFY PAYMENT & CREATE ENROLLMENT ───────────────────────────────────────
// Called by frontend after Razorpay checkout succeeds
// Validates the HMAC signature before creating enrollment
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
    } = req.body;

    // 1. Verify HMAC signature ─────────────────────────────────────────────
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // 2. Idempotency — don't double-enroll ────────────────────────────────
    const existing = await Enrollment.findOne({ Learner: req.user._id, course: courseId });
    if (existing) {
      return res.status(200).json({ message: "Already enrolled.", enrollment: existing });
    }

    // 3. Create enrollment with payment metadata ───────────────────────────
    const enrollment = await Enrollment.create({
      Learner:   req.user._id,
      course:    courseId,
      status:    "active",
      paymentId: razorpay_payment_id,
      orderId:   razorpay_order_id,
    });

    await enrollment.populate("course");

    // 4. Increment student counter ─────────────────────────────────────────
    await Course.findByIdAndUpdate(courseId, { $inc: { studentsEnrolled: 1 } });

    res.status(201).json({
      message:    "Payment successful! You are now enrolled.",
      enrollment,
    });
  } catch (err) {
    console.error("Verify payment error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrder, verifyPayment };