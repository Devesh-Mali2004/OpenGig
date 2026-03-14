const Course = require("../models/Course");
const { createZoomMeeting } = require("../utils/zoomService");

// ... (getAllCourses and getMyCourses stay the same)

// POST /api/courses — create course
const createCourse = async (req, res) => {
  try {
    const { title, description, category, price, isLive, startTime } = req.body;
    
    let zoomDetails = {};

    // If the trainer marked it as a live course, generate the Zoom link
    if (isLive === true || isLive === "true") {
      const zoomData = await createZoomMeeting(title, startTime);
      zoomDetails = {
        meetingId: zoomData.meetingId,
        joinUrl: zoomData.joinUrl,
        startUrl: zoomData.startUrl,
        startTime: startTime
      };
    }

    const course = await Course.create({
      title, 
      description, 
      category, 
      price, 
      isLive: !!isLive, // stores as boolean
      zoomDetails,
      trainer: req.user.id
    });

    res.status(201).json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create course", error: err.message });
  }
};

// ... (updateCourse and deleteCourse stay the same)

module.exports = { getAllCourses, getMyCourses, createCourse, updateCourse, deleteCourse };

// PUT /api/courses/:id — update course
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, trainer: req.user.id },
      req.body,
      { new: true }
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Failed to update course", error: err.message });
  }
};

// DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, trainer: req.user.id });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course", error: err.message });
  }
};

module.exports = { getAllCourses, getMyCourses, createCourse, updateCourse, deleteCourse };