import Course from '../models/Course.js';

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Admin
export const createCourse = async (req, res, next) => {
  try {
    const { title, code, creditHours, department, faculty, description } = req.body;

    const exists = await Course.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: `Course code ${code} already exists` });
    }

    const course = await Course.create({
      title,
      code,
      creditHours,
      department,
      faculty,
      description
    });

    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
export const getCourses = async (req, res, next) => {
  try {
    const { department, studentId } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (studentId) filter.students = studentId;

    const courses = await Course.find(filter)
      .populate('faculty', 'name email campusID designation')
      .sort({ code: 1 });

    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single course details
// @route   GET /api/courses/:id
// @access  Private
export const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('faculty', 'name email campusID designation')
      .populate('students', 'name email campusID session program section');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

// @desc    Enroll students in course
// @route   POST /api/courses/:id/enroll
// @access  Private/Admin
export const enrollStudents = async (req, res, next) => {
  try {
    const { studentIds } = req.body; // Array of student IDs
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Add unique students only
    studentIds.forEach(id => {
      if (!course.students.includes(id)) {
        course.students.push(id);
      }
    });

    await course.save();
    res.status(200).json({ success: true, message: 'Students enrolled successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    await course.deleteOne();
    res.status(200).json({ success: true, message: 'Course removed' });
  } catch (err) {
    next(err);
  }
};
