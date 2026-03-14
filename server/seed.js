/**
 * OpenGig — Database Seeder
 * Run: node seed.js
 * Seeds: 1 admin, 3 trainers, 6 trainees, 9 courses, enrollments, reviews
 */

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ── DB Connection ──────────────────────────────────────────────────────────────
const MONGO_URI = "mongodb://localhost:27017/opengig";

// ── Inline Models (fallback if imported models differ) ─────────────────────────
const userSchema = new mongoose.Schema({
  name:      String,
  email:     { type: String, unique: true },
  password:  String,
  role:      { type: String, enum: ["trainee", "trainer", "admin"], default: "trainee" },
  isBlocked: { type: Boolean, default: false },
  status:    { type: String, default: "active" },
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title:       String,
  description: String,
  price:       Number,
  category:    String,
  trainer:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tags:        [String],
  zoomLink:    String,
  duration:    String,
  level:       { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
}, { timestamps: true });

const enrollmentSchema = new mongoose.Schema({
  trainee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course:  { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  status:  { type: String, default: "enrolled" },
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course:  { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  rating:  { type: Number, min: 1, max: 5 },
  comment: String,
}, { timestamps: true });

const User       = mongoose.models.User       || mongoose.model("User",       userSchema);
const Course     = mongoose.models.Course     || mongoose.model("Course",     courseSchema);
const Enrollment = mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
const Review     = mongoose.models.Review     || mongoose.model("Review",     reviewSchema);

// ── Seed Data ──────────────────────────────────────────────────────────────────
const hashPass = async (pw) => bcrypt.hash(pw, 10);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB:", MONGO_URI);

  // Clear existing data
  await User.deleteMany({});
  await Course.deleteMany({});
  await Enrollment.deleteMany({});
  await Review.deleteMany({});
  console.log("🗑️  Cleared existing data");

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminUser = await User.create({
    name: "Super Admin",
    email: "admin@opengig.com",
    password: await hashPass("admin123"),
    role: "admin",
  });

  const trainerData = [
    { name: "Alice Johnson",  email: "alice@opengig.com",  password: await hashPass("trainer123") },
    { name: "Bob Williams",   email: "bob@opengig.com",    password: await hashPass("trainer123") },
    { name: "Carol Martinez", email: "carol@opengig.com",  password: await hashPass("trainer123") },
  ];
  const trainers = await User.insertMany(trainerData.map(t => ({ ...t, role: "trainer" })));

  const traineeData = [
    { name: "David Lee",      email: "david@opengig.com",   password: await hashPass("trainee123") },
    { name: "Emma Brown",     email: "emma@opengig.com",    password: await hashPass("trainee123") },
    { name: "Frank Wilson",   email: "frank@opengig.com",   password: await hashPass("trainee123") },
    { name: "Grace Taylor",   email: "grace@opengig.com",   password: await hashPass("trainee123") },
    { name: "Henry Davis",    email: "henry@opengig.com",   password: await hashPass("trainee123") },
    { name: "Iris Thompson",  email: "iris@opengig.com",    password: await hashPass("trainee123") },
  ];
  const trainees = await User.insertMany(traineeData.map(t => ({ ...t, role: "trainee" })));

  console.log(`👤 Created: 1 admin, ${trainers.length} trainers, ${trainees.length} trainees`);

  // ── Courses ────────────────────────────────────────────────────────────────
  const coursesData = [
    {
      title: "Full Stack Web Development Bootcamp",
      description: "Master React, Node.js, Express, and MongoDB. Build real-world projects from scratch.",
      price: 2999,
      category: "Web Development",
      trainer: trainers[0]._id,
      tags: ["react", "nodejs", "mongodb", "javascript", "fullstack"],
      duration: "12 weeks",
      level: "Beginner",
      zoomLink: "https://zoom.us/j/1234567890",
    },
    {
      title: "Python for Data Science & ML",
      description: "Learn Python, Pandas, NumPy, Scikit-Learn, and build ML models step by step.",
      price: 3499,
      category: "Data Science",
      trainer: trainers[0]._id,
      tags: ["python", "machine learning", "data science", "pandas", "sklearn"],
      duration: "10 weeks",
      level: "Intermediate",
      zoomLink: "https://zoom.us/j/2345678901",
    },
    {
      title: "UI/UX Design Masterclass",
      description: "Design intuitive user interfaces using Figma. Learn design thinking and prototyping.",
      price: 1999,
      category: "Design",
      trainer: trainers[1]._id,
      tags: ["figma", "ux", "ui", "design", "prototyping"],
      duration: "8 weeks",
      level: "Beginner",
      zoomLink: "https://zoom.us/j/3456789012",
    },
    {
      title: "DevOps & Cloud Engineering",
      description: "Learn Docker, Kubernetes, CI/CD pipelines, AWS, and modern deployment practices.",
      price: 4999,
      category: "DevOps",
      trainer: trainers[1]._id,
      tags: ["docker", "kubernetes", "aws", "devops", "cicd"],
      duration: "14 weeks",
      level: "Advanced",
      zoomLink: "https://zoom.us/j/4567890123",
    },
    {
      title: "React Native Mobile App Development",
      description: "Build cross-platform iOS and Android apps using React Native and Expo.",
      price: 2499,
      category: "Mobile Development",
      trainer: trainers[2]._id,
      tags: ["react native", "mobile", "ios", "android", "expo"],
      duration: "10 weeks",
      level: "Intermediate",
      zoomLink: "https://zoom.us/j/5678901234",
    },
    {
      title: "Blockchain & Web3 Fundamentals",
      description: "Understand blockchain, smart contracts with Solidity, and build DApps on Ethereum.",
      price: 5499,
      category: "Blockchain",
      trainer: trainers[2]._id,
      tags: ["blockchain", "web3", "solidity", "ethereum", "smart contracts"],
      duration: "12 weeks",
      level: "Advanced",
      zoomLink: "https://zoom.us/j/6789012345",
    },
    {
      title: "Digital Marketing & SEO",
      description: "Master SEO, Google Ads, social media marketing, email campaigns, and analytics.",
      price: 1499,
      category: "Marketing",
      trainer: trainers[0]._id,
      tags: ["seo", "marketing", "google ads", "social media", "analytics"],
      duration: "6 weeks",
      level: "Beginner",
      zoomLink: "https://zoom.us/j/7890123456",
    },
    {
      title: "Cybersecurity & Ethical Hacking",
      description: "Learn penetration testing, network security, ethical hacking tools and techniques.",
      price: 4499,
      category: "Cybersecurity",
      trainer: trainers[1]._id,
      tags: ["cybersecurity", "ethical hacking", "penetration testing", "security"],
      duration: "12 weeks",
      level: "Advanced",
      zoomLink: "https://zoom.us/j/8901234567",
    },
    {
      title: "Freelancing Mastery: Land High-Paying Clients",
      description: "Build your freelance career. Learn proposal writing, client management, and pricing.",
      price: 999,
      category: "Freelancing",
      trainer: trainers[2]._id,
      tags: ["freelancing", "upwork", "fiverr", "client management", "proposal"],
      duration: "4 weeks",
      level: "Beginner",
      zoomLink: "https://zoom.us/j/9012345678",
    },
  ];

  const courses = await Course.insertMany(coursesData);
  console.log(`📚 Created ${courses.length} courses`);

  // ── Enrollments ────────────────────────────────────────────────────────────
  const enrollmentPairs = [
    { trainee: trainees[0]._id, course: courses[0]._id },
    { trainee: trainees[0]._id, course: courses[1]._id },
    { trainee: trainees[0]._id, course: courses[6]._id },
    { trainee: trainees[1]._id, course: courses[2]._id },
    { trainee: trainees[1]._id, course: courses[4]._id },
    { trainee: trainees[2]._id, course: courses[3]._id },
    { trainee: trainees[2]._id, course: courses[7]._id },
    { trainee: trainees[3]._id, course: courses[0]._id },
    { trainee: trainees[3]._id, course: courses[8]._id },
    { trainee: trainees[4]._id, course: courses[5]._id },
    { trainee: trainees[4]._id, course: courses[1]._id },
    { trainee: trainees[5]._id, course: courses[4]._id },
    { trainee: trainees[5]._id, course: courses[2]._id },
  ];

  await Enrollment.insertMany(enrollmentPairs);
  console.log(`✅ Created ${enrollmentPairs.length} enrollments`);

  // ── Reviews ────────────────────────────────────────────────────────────────
  const reviewsData = [
    { user: trainees[0]._id, course: courses[0]._id, rating: 5, comment: "Absolutely amazing course! The projects are real-world and the trainer explains everything clearly." },
    { user: trainees[3]._id, course: courses[0]._id, rating: 4, comment: "Great content and well structured. Would love more advanced topics in future modules." },
    { user: trainees[1]._id, course: courses[2]._id, rating: 5, comment: "Best UI/UX course I've ever taken. The Figma hands-on sessions are incredible." },
    { user: trainees[4]._id, course: courses[1]._id, rating: 5, comment: "Python ML course is top-notch. I built my first model by week 3!" },
    { user: trainees[2]._id, course: courses[3]._id, rating: 4, comment: "Very in-depth DevOps content. Docker and Kubernetes sections are especially great." },
    { user: trainees[5]._id, course: courses[4]._id, rating: 5, comment: "React Native course helped me ship my first app to the Play Store. 10/10!" },
  ];

  await Review.insertMany(reviewsData);
  console.log(`⭐ Created ${reviewsData.length} reviews`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n🎉 Seed complete! Here are your login credentials:");
  console.log("─".repeat(50));
  console.log("👑 ADMIN");
  console.log("   Email   : admin@opengig.com");
  console.log("   Password: admin123");
  console.log("\n🎓 TRAINERS");
  trainers.forEach(t => {
    console.log(`   ${t.name.padEnd(20)} | ${t.email.padEnd(25)} | trainer123`);
  });
  console.log("\n📚 TRAINEES");
  trainees.forEach(t => {
    console.log(`   ${t.name.padEnd(20)} | ${t.email.padEnd(25)} | trainee123`);
  });
  console.log("─".repeat(50));
  console.log("✅ Database is ready for demo!\n");

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});