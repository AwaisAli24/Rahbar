import Assessment from '../models/Assessment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin — get all students' transcripts grouped by department
// @route   GET /api/transcripts
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllTranscripts = async (req, res, next) => {
  try {
    const { department, program, semester } = req.query;

    const query = { role: 'student', isActive: true };
    if (department && department !== 'All') query.department = department;
    if (program && program !== 'All') query.program = program;
    if (semester && semester !== 'All') query.semester = Number(semester);

    const students = await User.find(query)
      .select('name campusID email department program semester section session cgpa fatherName gender phone')
      .sort({ department: 1, semester: 1, name: 1 });

    res.status(200).json({
      success: true,
      total: students.length,
      data: students,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin — get full transcript for a single student
// @route   GET /api/transcripts/:studentId
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentTranscript = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId).select(
      'name campusID email department program semester section session cgpa fatherName gender phone dob address'
    );
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get all courses this student is enrolled in
    const courses = await Course.find({ students: studentId }).select('title code creditHours department');

    // For each course, get their grades from assessments
    const transcript = await Promise.all(
      courses.map(async (course) => {
        const assessments = await Assessment.find({ course: course._id }).select(
          'title type totalMarks weightage records date'
        );

        let totalWeightageEarned = 0;
        let totalWeightageConfigured = 0;
        let totalMarksEarned = 0;
        let totalMarksConfigured = 0;

        const gradeDetails = assessments.map(assessment => {
          const record = assessment.records?.find(
            r => r.student?.toString() === studentId.toString()
          );
          const marks = record?.marksObtained || 0;
          const percentage = assessment.totalMarks > 0
            ? Math.round((marks / assessment.totalMarks) * 100)
            : 0;

          // Weighted contribution
          const weightedEarned = assessment.totalMarks > 0
            ? (marks / assessment.totalMarks) * (assessment.weightage || 0)
            : 0;

          totalWeightageEarned += weightedEarned;
          totalWeightageConfigured += (assessment.weightage || 0);
          totalMarksEarned += marks;
          totalMarksConfigured += assessment.totalMarks;

          return {
            title: assessment.title,
            type: assessment.type,
            date: assessment.date,
            marksObtained: marks,
            totalMarks: assessment.totalMarks,
            weightage: assessment.weightage,
            percentage,
          };
        });

        // Final grade calculation (percentage out of configured weightage)
        const finalPercentage = totalWeightageConfigured > 0
          ? Math.round((totalWeightageEarned / totalWeightageConfigured) * 100)
          : null;

        // Letter grade
        let letterGrade = 'N/A';
        let gradePoints = 0;
        if (finalPercentage !== null) {
          if (finalPercentage >= 90)      { letterGrade = 'A+'; gradePoints = 4.0; }
          else if (finalPercentage >= 85) { letterGrade = 'A';  gradePoints = 4.0; }
          else if (finalPercentage >= 80) { letterGrade = 'A-'; gradePoints = 3.7; }
          else if (finalPercentage >= 75) { letterGrade = 'B+'; gradePoints = 3.3; }
          else if (finalPercentage >= 70) { letterGrade = 'B';  gradePoints = 3.0; }
          else if (finalPercentage >= 65) { letterGrade = 'B-'; gradePoints = 2.7; }
          else if (finalPercentage >= 60) { letterGrade = 'C+'; gradePoints = 2.3; }
          else if (finalPercentage >= 55) { letterGrade = 'C';  gradePoints = 2.0; }
          else if (finalPercentage >= 50) { letterGrade = 'C-'; gradePoints = 1.7; }
          else if (finalPercentage >= 45) { letterGrade = 'D';  gradePoints = 1.0; }
          else                            { letterGrade = 'F';  gradePoints = 0.0; }
        }

        return {
          course: {
            id: course._id,
            title: course.title,
            code: course.code,
            creditHours: course.creditHours,
            department: course.department,
          },
          assessments: gradeDetails,
          summary: {
            totalMarksEarned,
            totalMarksConfigured,
            totalWeightageEarned: Math.round(totalWeightageEarned * 10) / 10,
            totalWeightageConfigured,
            finalPercentage,
            letterGrade,
            gradePoints,
            assessmentsCount: assessments.length,
          },
        };
      })
    );

    // Overall GPA calculation
    let totalQualityPoints = 0;
    let totalCreditHours = 0;
    transcript.forEach(entry => {
      if (entry.summary.finalPercentage !== null) {
        totalQualityPoints += entry.summary.gradePoints * entry.course.creditHours;
        totalCreditHours += entry.course.creditHours;
      }
    });
    const gpa = totalCreditHours > 0
      ? Math.round((totalQualityPoints / totalCreditHours) * 100) / 100
      : 0;

    res.status(200).json({
      success: true,
      student,
      transcript,
      gpa,
      totalCreditHours,
      totalCourses: courses.length,
    });
  } catch (err) {
    next(err);
  }
};
