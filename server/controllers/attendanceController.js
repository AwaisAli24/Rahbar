import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';

const FREE_ABSENTS = 4;      // First 4 absents treated as "leave" (forgiven)
const WITHDRAW_THRESHOLD = 2; // When real absents (beyond FREE_ABSENTS) exceed this → WITHDRAW warning

// ─────────────────────────────────────────────────────────────────────────────
// Helper: compute cumulative stats for each student in a course
// ─────────────────────────────────────────────────────────────────────────────
const getStudentStats = async (courseId, excludeDate = null) => {
  const query = { course: courseId };
  if (excludeDate) query.date = { $ne: excludeDate };

  const sheets = await Attendance.find(query).sort({ date: 1 });
  const totalsMap = {}; // studentId -> { totalAbsents, absenceDates: [] }

  sheets.forEach(sheet => {
    sheet.records.forEach(rec => {
      const id = rec.student?.toString();
      if (!id) return;
      if (!totalsMap[id]) totalsMap[id] = { totalAbsents: 0, absenceDates: [] };
      if (rec.status === 'Absent') {
        totalsMap[id].totalAbsents++;
        totalsMap[id].absenceDates.push(sheet.date);
      }
    });
  });

  // Convert to leave/absent split
  const statsMap = {};
  const triggerAbsenceIndex = FREE_ABSENTS + WITHDRAW_THRESHOLD; // e.g. 4 + 2 = 6 (0-indexed => 7th absent)

  for (const [id, totals] of Object.entries(totalsMap)) {
    const leaveCount  = Math.min(totals.totalAbsents, FREE_ABSENTS);
    const absentCount = Math.max(0, totals.totalAbsents - FREE_ABSENTS);
    const withdraw    = absentCount > WITHDRAW_THRESHOLD;
    const withdrawalDate = withdraw ? (totals.absenceDates[triggerAbsenceIndex] || totals.absenceDates[totals.absenceDates.length - 1] || 'N/A') : null;

    statsMap[id] = {
      leave: leaveCount,
      absent: absentCount,
      totalAbsents: totals.totalAbsents,
      withdraw,
      withdrawalDate,
      absenceDates: totals.absenceDates,
    };
  }

  return statsMap;
};

const defaultStats = () => ({
  leave: 0, absent: 0, totalAbsents: 0,
  withdraw: false, withdrawalDate: null, absenceDates: [],
});

// @desc    Get attendance sheet for a course on a specific date (or initialize roster)
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req, res, next) => {
  try {
    const { courseId, date } = req.query;

    if (!courseId || !date) {
      return res.status(400).json({ success: false, message: 'Please provide courseId and date' });
    }

    const course = await Course.findById(courseId).populate(
      'students',
      'name campusID email session program section'
    );
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const existingAttendance = await Attendance.findOne({ course: courseId, date })
      .populate('records.student', 'name campusID email session program section')
      .populate('recordedBy', 'name designation role');

    if (existingAttendance) {
      const statsMap = await getStudentStats(courseId, null);

      const recordsWithStats = existingAttendance.records.map(rec => {
        const id = rec.student?._id?.toString();
        const stats = statsMap[id] || defaultStats();
        return {
          ...rec.toObject(),
          cumulativeLeave: stats.leave,
          cumulativeAbsent: stats.absent,
          leaveExhausted: stats.leave >= FREE_ABSENTS,
          withdraw: stats.withdraw,
          withdrawalDate: stats.withdrawalDate,
        };
      });

      return res.status(200).json({
        success: true,
        recorded: true,
        freeAbsents: FREE_ABSENTS,
        withdrawThreshold: WITHDRAW_THRESHOLD,
        course: { id: course._id, title: course.title, code: course.code },
        data: { ...existingAttendance.toObject(), records: recordsWithStats },
      });
    }

    const statsMap = await getStudentStats(courseId, date);

    const initialRecords = course.students.map(student => {
      const id = student._id.toString();
      const stats = statsMap[id] || defaultStats();
      return {
        student,
        status: 'Present',
        remarks: '',
        cumulativeLeave: stats.leave,
        cumulativeAbsent: stats.absent,
        leaveExhausted: stats.leave >= FREE_ABSENTS,
        withdraw: stats.withdraw,
        withdrawalDate: stats.withdrawalDate,
      };
    });

    res.status(200).json({
      success: true,
      recorded: false,
      freeAbsents: FREE_ABSENTS,
      withdrawThreshold: WITHDRAW_THRESHOLD,
      course: { id: course._id, title: course.title, code: course.code },
      data: { course: courseId, date, records: initialRecords },
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

    const attendance = await Attendance.findOneAndUpdate(
      { course: courseId, date },
      { course: courseId, date, recordedBy: req.user.id, records },
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

// @desc    Clear all attendance for a course (reset)
// @route   DELETE /api/attendance/clear/:courseId
// @access  Private
export const clearCourseAttendance = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const result = await Attendance.deleteMany({ course: courseId });
    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} attendance session(s) for this course.`,
      deletedCount: result.deletedCount,
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

    const attendanceSheets = await Attendance.find({ course: courseId }).sort({ date: 1 });
    const totalSessions = attendanceSheets.length;

    const summary = course.students.map(student => {
      let presentCount = 0;
      let totalAbsents = 0;
      let lateCount = 0;
      const absenceDates = [];

      attendanceSheets.forEach(sheet => {
        const record = sheet.records.find(r => r.student?.toString() === student._id.toString());
        if (record) {
          if (record.status === 'Present') presentCount++;
          else if (record.status === 'Absent') {
            totalAbsents++;
            absenceDates.push(sheet.date);
          }
          else if (record.status === 'Late') lateCount++;
        } else {
          totalAbsents++;
          absenceDates.push(sheet.date);
        }
      });

      const leaveCount  = Math.min(totalAbsents, FREE_ABSENTS);
      const absentCount = Math.max(0, totalAbsents - FREE_ABSENTS);
      const attended    = presentCount + lateCount;
      const percentage  = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
      const withdraw    = absentCount > WITHDRAW_THRESHOLD;
      const triggerIndex = FREE_ABSENTS + WITHDRAW_THRESHOLD;
      const withdrawalDate = withdraw ? (absenceDates[triggerIndex] || absenceDates[absenceDates.length - 1] || 'N/A') : null;

      return {
        student: { id: student._id, name: student.name, campusID: student.campusID, email: student.email },
        present: presentCount,
        absent: absentCount,
        leave: leaveCount,
        late: lateCount,
        totalAbsents,
        withdraw,
        withdrawalDate,
        absenceDates,
        percentage,
      };
    });

    res.status(200).json({
      success: true,
      totalSessions,
      freeAbsents: FREE_ABSENTS,
      withdrawThreshold: WITHDRAW_THRESHOLD,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get detailed absence logs for a student in a course (for Admin audit)
// @route   GET /api/attendance/absences/:courseId/:studentId
// @access  Private
export const getStudentAbsenceLogs = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.params;
    const sheets = await Attendance.find({ course: courseId, 'records.student': studentId }).sort({ date: 1 });

    const absenceLogs = [];
    let cumulativeAbsents = 0;

    sheets.forEach(sheet => {
      const rec = sheet.records.find(r => r.student?.toString() === studentId.toString());
      if (rec && rec.status === 'Absent') {
        cumulativeAbsents++;
        const isWithdrawTrigger = cumulativeAbsents > (FREE_ABSENTS + WITHDRAW_THRESHOLD);
        absenceLogs.push({
          attendanceId: sheet._id,
          date: sheet.date,
          status: rec.status,
          remarks: rec.remarks || '',
          absentIndex: cumulativeAbsents,
          isWithdrawTrigger,
        });
      }
    });

    res.status(200).json({
      success: true,
      totalAbsents: cumulativeAbsents,
      withdrawalDate: absenceLogs.find(l => l.isWithdrawTrigger)?.date || (cumulativeAbsents >= 7 ? absenceLogs[6]?.date : null),
      absenceLogs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin reverse withdrawal / re-instate student (by changing absence statuses)
// @route   PUT /api/attendance/update-record
// @access  Private/Admin
export const updateStudentAttendanceRecord = async (req, res, next) => {
  try {
    const { courseId, studentId, date, newStatus, remarks } = req.body;

    if (!courseId || !studentId || !date || !newStatus) {
      return res.status(400).json({ success: false, message: 'courseId, studentId, date, and newStatus are required' });
    }

    const sheet = await Attendance.findOne({ course: courseId, date });
    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Attendance record for this date not found' });
    }

    const rec = sheet.records.find(r => r.student?.toString() === studentId.toString());
    if (!rec) {
      return res.status(404).json({ success: false, message: 'Student record not found on this date' });
    }

    rec.status = newStatus;
    if (remarks !== undefined) rec.remarks = remarks;

    await sheet.save();

    res.status(200).json({
      success: true,
      message: `Updated student attendance on ${date} to ${newStatus}`,
      data: sheet,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin quick reverse withdrawal (excuse absents automatically to restore student)
// @route   POST /api/attendance/reverse-withdrawal
// @access  Private/Admin
export const reverseWithdrawal = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.body;

    if (!courseId || !studentId) {
      return res.status(400).json({ success: false, message: 'courseId and studentId are required' });
    }

    const sheets = await Attendance.find({ course: courseId, 'records.student': studentId }).sort({ date: -1 });

    let absentsToConvert = 2; // Converting 2 absents to Present brings them back below threshold
    let convertedCount = 0;

    for (const sheet of sheets) {
      if (convertedCount >= absentsToConvert) break;

      const rec = sheet.records.find(r => r.student?.toString() === studentId.toString());
      if (rec && rec.status === 'Absent') {
        rec.status = 'Present';
        rec.remarks = (rec.remarks ? rec.remarks + ' ' : '') + '[Withdrawal Reversed by Admin]';
        await sheet.save();
        convertedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully reversed withdrawal for student! Excused ${convertedCount} absence(s).`,
      convertedCount,
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

    const courses = await Course.find({ students: studentId }).select('title code creditHours');

    const attendanceSummary = await Promise.all(
      courses.map(async (course) => {
        const sheets = await Attendance.find({ course: course._id }).sort({ date: 1 });
        const totalSessions = sheets.length;

        let presentCount = 0;
        let totalAbsents = 0;
        let lateCount = 0;
        const absenceDates = [];

        sheets.forEach(sheet => {
          const record = sheet.records.find(r => r.student?.toString() === studentId.toString());
          if (record) {
            if (record.status === 'Present') presentCount++;
            else if (record.status === 'Absent') {
              totalAbsents++;
              absenceDates.push(sheet.date);
            }
            else if (record.status === 'Late') lateCount++;
          } else {
            totalAbsents++;
            absenceDates.push(sheet.date);
          }
        });

        const leaveCount  = Math.min(totalAbsents, FREE_ABSENTS);
        const absentCount = Math.max(0, totalAbsents - FREE_ABSENTS);
        const attended    = presentCount + lateCount;
        const percentage  = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
        const withdraw    = absentCount > WITHDRAW_THRESHOLD;
        const triggerIndex = FREE_ABSENTS + WITHDRAW_THRESHOLD;

        return {
          course: { id: course._id, title: course.title, code: course.code, creditHours: course.creditHours },
          present: presentCount,
          absent: absentCount,
          leave: leaveCount,
          late: lateCount,
          totalAbsents,
          withdraw,
          withdrawalDate: withdraw ? (absenceDates[triggerIndex] || absenceDates[absenceDates.length - 1] || 'N/A') : null,
          absenceDates,
          percentage,
          totalSessions,
        };
      })
    );

    res.status(200).json({ success: true, data: attendanceSummary });
  } catch (err) {
    next(err);
  }
};
