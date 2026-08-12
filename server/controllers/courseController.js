import Course from '../models/Course.js';

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Admin
export const createCourse = async (req, res, next) => {
  try {
    const { title, code, creditHours, department, faculty, description } = req.body;

    // faculty can be an array or a single ID — normalise to array
    const facultyArray = Array.isArray(faculty)
      ? faculty.filter(Boolean)
      : faculty ? [faculty] : [];

    const course = await Course.create({
      title,
      code,
      creditHours,
      department,
      faculty: facultyArray,
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
    const { department, studentId, facultyId } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (studentId)  filter.students   = studentId;
    if (facultyId)  filter.faculty    = facultyId; // works for array fields too

    const courses = await Course.find(filter)
      .populate('faculty', 'name email campusID designation')
      .populate('students', 'name email campusID session program section')
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

// @desc    Assign / update faculty for a course (replaces entire list)
// @route   PUT /api/courses/:id/faculty
// @access  Private/Admin
export const updateCourseFaculty = async (req, res, next) => {
  try {
    const { facultyIds } = req.body; // array of user IDs
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    course.faculty = Array.isArray(facultyIds) ? facultyIds.filter(Boolean) : [];
    await course.save();

    const updated = await Course.findById(course._id).populate('faculty', 'name email campusID designation');
    res.status(200).json({ success: true, message: 'Faculty updated', data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc    Enroll students in course
// @route   POST /api/courses/:id/enroll
// @access  Private/Admin
export const enrollStudents = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
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
