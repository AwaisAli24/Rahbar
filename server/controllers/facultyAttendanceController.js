import FacultyAttendance from '../models/FacultyAttendance.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Faculty starts a class session → marks faculty Present automatically
// @route   POST /api/faculty-attendance/start-class
// @access  Private (Faculty)
// ─────────────────────────────────────────────────────────────────────────────
export const startClass = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const facultyId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required' });
    }

    // Verify course exists and faculty is assigned to it
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const now = new Date();

    // Check if a session already exists today for this course
    const existing = await FacultyAttendance.findOne({
      faculty: facultyId,
      course: courseId,
      date: today,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        alreadyStarted: true,
        message: 'Class session already started today for this course.',
        data: existing,
      });
    }

    // Create new session — faculty is automatically marked Present
    const session = await FacultyAttendance.create({
      faculty: facultyId,
      course: courseId,
      date: today,
      startTime: now,
      status: 'Present',
      sessionActive: true,
    });

    await session.populate([
      { path: 'faculty', select: 'name campusID designation department' },
      { path: 'course', select: 'title code department' },
    ]);

    res.status(201).json({
      success: true,
      alreadyStarted: false,
      message: `Class started at ${now.toLocaleTimeString()}. Your attendance has been marked Present.`,
      data: session,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Faculty ends a class session → records endTime
// @route   POST /api/faculty-attendance/end-class
// @access  Private (Faculty)
// ─────────────────────────────────────────────────────────────────────────────
export const endClass = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const facultyId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const session = await FacultyAttendance.findOne({
      faculty: facultyId,
      course: courseId,
      date: today,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active class session found for today. Please start a class first.',
      });
    }

    if (!session.sessionActive) {
      return res.status(400).json({
        success: false,
        message: 'Class session has already been ended.',
        data: session,
      });
    }

    session.endTime = now;
    session.sessionActive = false;
    await session.save();

    // Calculate duration in minutes
    const durationMs = now - new Date(session.startTime);
    const durationMin = Math.round(durationMs / 60000);

    res.status(200).json({
      success: true,
      message: `Class ended. Duration: ${durationMin} minute(s).`,
      duration: durationMin,
      data: session,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get today's session status for a specific course (for faculty)
// @route   GET /api/faculty-attendance/session-status?courseId=xxx
// @access  Private (Faculty)
// ─────────────────────────────────────────────────────────────────────────────
export const getSessionStatus = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const facultyId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required' });
    }

    const today = new Date().toISOString().split('T')[0];

    const session = await FacultyAttendance.findOne({
      faculty: facultyId,
      course: courseId,
      date: today,
    }).populate('course', 'title code');

    if (!session) {
      return res.status(200).json({
        success: true,
        sessionExists: false,
        sessionActive: false,
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      sessionExists: true,
      sessionActive: session.sessionActive,
      data: session,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Faculty views their own attendance sessions
// @route   GET /api/faculty-attendance/my-sessions
// @access  Private (Faculty)
// ─────────────────────────────────────────────────────────────────────────────
export const getMySessions = async (req, res, next) => {
  try {
    const facultyId = req.user.id;
    const { month, year } = req.query;

    const query = { faculty: facultyId };

    // Filter by month/year if provided
    if (month && year) {
      const monthStr = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${monthStr}` };
    }

    const sessions = await FacultyAttendance.find(query)
      .populate('course', 'title code creditHours department')
      .sort({ date: -1, startTime: -1 });

    // Compute duration for each
    const enriched = sessions.map(s => {
      const obj = s.toObject();
      if (obj.startTime && obj.endTime) {
        const dur = Math.round((new Date(obj.endTime) - new Date(obj.startTime)) / 60000);
        obj.durationMinutes = dur;
      } else {
        obj.durationMinutes = null;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      total: enriched.length,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin — get all faculty attendance sessions
// @route   GET /api/faculty-attendance/all
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllFacultyAttendance = async (req, res, next) => {
  try {
    const { facultyId, date, month, year, department } = req.query;

    const query = {};
    if (facultyId) query.faculty = facultyId;
    if (date) query.date = date;
    if (month && year) {
      const monthStr = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${monthStr}` };
    }

    let sessions = await FacultyAttendance.find(query)
      .populate('faculty', 'name campusID designation department email')
      .populate('course', 'title code department creditHours')
      .sort({ date: -1, startTime: -1 });

    // Filter by department if requested
    if (department && department !== 'All') {
      sessions = sessions.filter(s => s.faculty?.department === department || s.course?.department === department);
    }

    const enriched = sessions.map(s => {
      const obj = s.toObject();
      if (obj.startTime && obj.endTime) {
        obj.durationMinutes = Math.round((new Date(obj.endTime) - new Date(obj.startTime)) / 60000);
      } else {
        obj.durationMinutes = null;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      total: enriched.length,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin — get sessions for a specific faculty member
// @route   GET /api/faculty-attendance/faculty/:facultyId
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getFacultySessionsById = async (req, res, next) => {
  try {
    const { facultyId } = req.params;

    const sessions = await FacultyAttendance.find({ faculty: facultyId })
      .populate('faculty', 'name campusID designation department email')
      .populate('course', 'title code department creditHours')
      .sort({ date: -1, startTime: -1 });

    const enriched = sessions.map(s => {
      const obj = s.toObject();
      if (obj.startTime && obj.endTime) {
        obj.durationMinutes = Math.round((new Date(obj.endTime) - new Date(obj.startTime)) / 60000);
      } else {
        obj.durationMinutes = null;
      }
      return obj;
    });

    // Summary stats
    const totalSessions = enriched.length;
    const presentCount  = enriched.filter(s => s.status === 'Present').length;
    const absentCount   = enriched.filter(s => s.status === 'Absent').length;

    res.status(200).json({
      success: true,
      summary: { totalSessions, presentCount, absentCount },
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin — get attendance summary per faculty (for overview table)
// @route   GET /api/faculty-attendance/summary
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getFacultyAttendanceSummary = async (req, res, next) => {
  try {
    // Get all faculty members
    const facultyList = await User.find({ role: 'faculty', isActive: true }).select('name campusID designation department email');

    const summaries = await Promise.all(
      facultyList.map(async (faculty) => {
        const sessions = await FacultyAttendance.find({ faculty: faculty._id })
          .populate('course', 'title code');

        const totalSessions  = sessions.length;
        const presentCount   = sessions.filter(s => s.status === 'Present').length;
        const absentCount    = sessions.filter(s => s.status === 'Absent').length;
        const activeSessions = sessions.filter(s => s.sessionActive).length;

        const attendancePercentage = totalSessions > 0
          ? Math.round((presentCount / totalSessions) * 100)
          : 0;

        return {
          faculty: {
            id: faculty._id,
            name: faculty.name,
            campusID: faculty.campusID,
            designation: faculty.designation,
            department: faculty.department,
            email: faculty.email,
          },
          totalSessions,
          presentCount,
          absentCount,
          activeSessions,
          attendancePercentage,
          recentSessions: sessions.slice(0, 3).map(s => ({
            date: s.date,
            course: s.course?.title || 'N/A',
            startTime: s.startTime,
            endTime: s.endTime,
            status: s.status,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: summaries,
    });
  } catch (err) {
    next(err);
  }
};
