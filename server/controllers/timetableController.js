import Timetable from '../models/Timetable.js';
import Course from '../models/Course.js';

// @desc    Get timetable slots (filtered by department or day)
// @route   GET /api/timetable
// @access  Private
export const getTimetable = async (req, res, next) => {
  try {
    const { department, day } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (day) filter.day = day;

    const slots = await Timetable.find(filter)
      .populate({
        path: 'course',
        select: 'title code creditHours faculty',
        populate: {
          path: 'faculty',
          select: 'name designation campusID',
        },
      })
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new timetable slot with conflict detection
// @route   POST /api/timetable
// @access  Private/Admin
export const createTimetableSlot = async (req, res, next) => {
  try {
    const { courseId, day, startTime, endTime, room, department } = req.body;

    if (!courseId || !day || !startTime || !endTime || !room || !department) {
      return res.status(400).json({ success: false, message: 'All timetable fields are required' });
    }

    // Fetch course to verify existence and get assigned faculty
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Selected course not found' });
    }

    // ─── CONFLICT CHECK 1: Room Availability ──────────────────────────────────
    const roomConflict = await Timetable.findOne({ day, startTime, room });
    if (roomConflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict: ${room} is already booked on ${day} at ${startTime}.`,
      });
    }

    // ─── CONFLICT CHECK 2: Faculty Availability ───────────────────────────────
    if (course.faculty) {
      // Find all slots on the same day and start time
      const concurrentSlots = await Timetable.find({ day, startTime }).populate('course', 'faculty title code');
      
      const facultyConflict = concurrentSlots.find(
        slot => slot.course?.faculty?.toString() === course.faculty.toString()
      );

      if (facultyConflict) {
        return res.status(400).json({
          success: false,
          message: `Conflict: Instructor is already scheduled for ${facultyConflict.course.code} (${facultyConflict.room}) at this time.`,
        });
      }
    }

    const slot = await Timetable.create({
      course: courseId,
      day,
      startTime,
      endTime,
      room,
      department,
    });

    const populatedSlot = await Timetable.findById(slot._id).populate({
      path: 'course',
      select: 'title code creditHours faculty',
      populate: { path: 'faculty', select: 'name designation' },
    });

    res.status(201).json({
      success: true,
      message: 'Timetable slot created successfully',
      data: populatedSlot,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete timetable slot
// @route   DELETE /api/timetable/:id
// @access  Private/Admin
export const deleteTimetableSlot = async (req, res, next) => {
  try {
    const slot = await Timetable.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Timetable slot not found' });
    }

    await slot.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Timetable slot removed successfully',
    });
  } catch (err) {
    next(err);
  }
};
