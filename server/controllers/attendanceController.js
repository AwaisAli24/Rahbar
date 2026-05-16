import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';

// @desc    Get attendance sheet for a course on a specific date (or initialize roster)
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req, res, next) => {
  try {
    const { courseId, date } = req.query;

    if (!courseId || !date) {
      return res.status(400).json({ success: false, message: 'Please provide courseId and date' });
    }

    // Fetch the course with enrolled students
    const course = await Course.findById(courseId).populate(
      'students', 
      'name campusID email session program section'
    );

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({ course: courseId, date })
      .populate('records.student', 'name campusID email session program section')
      .populate('recordedBy', 'name designation role');

    if (existingAttendance) {
      return res.status(200).json({
        success: true,
        recorded: true,
        course: { id: course._id, title: course.title, code: course.code },
        data: existingAttendance,
      });
    }

    // If not recorded, build an initial roster with default 'Present' status
    const initialRecords = course.students.map(student => ({
      student,
      status: 'Present',
      remarks: '',
    }));

    res.status(200).json({
      success: true,
      recorded: false,
      course: { id: course._id, title: course.title, code: course.code },
      data: {
        course: courseId,
        date,
        records: initialRecords,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark or update attendance for a course
// @route   POST /api/attendance
// @access  Private
export const markAttendance = async (req, res, next) => {
  try {
    const { courseId, date, records } = req.body;

    if (!courseId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance data provided' });
    }

    // Using findOneAndUpdate with upsert to smoothly handle both creation and updates
    const attendance = await Attendance.findOneAndUpdate(
      { course: courseId, date },
      {
        course: courseId,
        date,
        recordedBy: req.user.id,
        records,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Attendance saved successfully',
      data: attendance,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance summary/analytics for a course
// @route   GET /api/attendance/summary/:courseId
// @access  Private
export const getAttendanceSummary = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate('students', 'name campusID email');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const attendanceSheets = await Attendance.find({ course: courseId });
    const totalSessions = attendanceSheets.length;

    // Map student attendance stats
    const summary = course.students.map(student => {
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let leaveCount = 0;

      attendanceSheets.forEach(sheet => {
        const record = sheet.records.find(r => r.student?.toString() === student._id.toString());
        if (record) {
          if (record.status === 'Present') presentCount++;
          else if (record.status === 'Absent') absentCount++;
          else if (record.status === 'Late') lateCount++;
          else if (record.status === 'Leave') leaveCount++;
        } else {
          // If student was enrolled later, count missing as absent or skip. Let's count as absent for strict stats.
          absentCount++;
        }
      });

      const attended = presentCount + lateCount; // Late usually counts as attended but flagged
      const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

      return {
        student: { id: student._id, name: student.name, campusID: student.campusID },
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        leave: leaveCount,
        percentage,
      };
    });

    res.status(200).json({
      success: true,
      totalSessions,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance summary for all courses of a specific student
// @route   GET /api/attendance/student/:studentId
// @access  Private
export const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Find all courses where student is enrolled
    const courses = await Course.find({ students: studentId }).select('title code creditHours');

    const attendanceSummary = await Promise.all(
      courses.map(async (course) => {
        const sheets = await Attendance.find({ course: course._id });
        const totalSessions = sheets.length;

        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let leaveCount = 0;

        sheets.forEach(sheet => {
          const record = sheet.records.find(r => r.student?.toString() === studentId.toString());
          if (record) {
            if (record.status === 'Present') presentCount++;
            else if (record.status === 'Absent') absentCount++;
            else if (record.status === 'Late') lateCount++;
            else if (record.status === 'Leave') leaveCount++;
          } else {
            absentCount++;
          }
        });

        const attended = presentCount + lateCount;
        const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

        return {
          course: { id: course._id, title: course.title, code: course.code, creditHours: course.creditHours },
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          leave: leaveCount,
          percentage,
          totalSessions,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: attendanceSummary,
    });
  } catch (err) {
    next(err);
  }
};
