import Assessment from '../models/Assessment.js';
import Course from '../models/Course.js';

// @desc    Get all assessments for a course
// @route   GET /api/assessments?courseId=...
// @access  Private
export const getAssessments = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId parameter is required' });
    }

    const assessments = await Assessment.find({ course: courseId })
      .populate('records.student', 'name campusID email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new assessment item
// @route   POST /api/assessments
// @access  Private/Faculty/Admin
export const createAssessment = async (req, res, next) => {
  try {
    const { courseId, title, type, totalMarks, weightage, date } = req.body;

    if (!courseId || !title || !type || !totalMarks || !weightage || !date) {
      return res.status(400).json({ success: false, message: 'All assessment fields are required' });
    }

    const course = await Course.findById(courseId).populate('students', '_id');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Initialize records for all enrolled students
    const initialRecords = course.students.map(student => ({
      student: student._id,
      marksObtained: 0,
      remarks: ''
    }));

    const assessment = await Assessment.create({
      course: courseId,
      title,
      type,
      totalMarks,
      weightage,
      date,
      records: initialRecords,
    });

    const populatedAssessment = await Assessment.findById(assessment._id)
      .populate('records.student', 'name campusID email');

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: populatedAssessment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student marks for an assessment
// @route   PUT /api/assessments/:id/marks
// @access  Private/Faculty/Admin
export const updateMarks = async (req, res, next) => {
  try {
    const { records } = req.body; // Array of { studentId, marksObtained, remarks }
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Update records
    records.forEach(incoming => {
      const existing = assessment.records.find(
        r => r.student?.toString() === incoming.studentId.toString()
      );
      if (existing) {
        existing.marksObtained = Number(incoming.marksObtained) || 0;
        if (incoming.remarks !== undefined) existing.remarks = incoming.remarks;
      }
    });

    await assessment.save();

    const updatedAssessment = await Assessment.findById(assessment._id)
      .populate('records.student', 'name campusID email');

    res.status(200).json({
      success: true,
      message: 'Marks updated successfully',
      data: updatedAssessment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete an assessment
// @route   DELETE /api/assessments/:id
// @access  Private/Faculty/Admin
export const deleteAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    await assessment.deleteOne();
    res.status(200).json({ success: true, message: 'Assessment removed successfully' });
  } catch (err) {
    next(err);
  }
};

// Helper: Calculate Letter Grade & GPA points
const getGradeInfo = (score) => {
  if (score >= 85) return { grade: 'A',  gpa: 4.0 };
  if (score >= 80) return { grade: 'A-', gpa: 3.7 };
  if (score >= 75) return { grade: 'B+', gpa: 3.3 };
  if (score >= 70) return { grade: 'B',  gpa: 3.0 };
  if (score >= 65) return { grade: 'B-', gpa: 2.7 };
  if (score >= 60) return { grade: 'C+', gpa: 2.3 };
  if (score >= 55) return { grade: 'C',  gpa: 2.0 };
  if (score >= 50) return { grade: 'D',  gpa: 1.0 };
  return { grade: 'F', gpa: 0.0 };
};

// @desc    Get automated gradebook summary for a course
// @route   GET /api/assessments/gradebook/:courseId
// @access  Private
export const getGradebookSummary = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate('students', 'name campusID email');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const assessments = await Assessment.find({ course: courseId });
    const totalWeightageConfigured = assessments.reduce((sum, a) => sum + a.weightage, 0);

    const gradebook = course.students.map(student => {
      let cumulativeWeightedScore = 0;

      const studentAssessments = assessments.map(assessment => {
        const record = assessment.records.find(r => r.student?.toString() === student._id.toString());
        const marksObtained = record ? record.marksObtained : 0;
        const weightedMarks = assessment.totalMarks > 0 
          ? (marksObtained / assessment.totalMarks) * assessment.weightage 
          : 0;

        cumulativeWeightedScore += weightedMarks;

        return {
          assessmentId: assessment._id,
          title: assessment.title,
          type: assessment.type,
          totalMarks: assessment.totalMarks,
          weightage: assessment.weightage,
          marksObtained,
          weightedMarks: Math.round(weightedMarks * 10) / 10,
        };
      });

      // Round cumulative score to 1 decimal place
      const finalScore = Math.round(cumulativeWeightedScore * 10) / 10;
      const { grade, gpa } = getGradeInfo(finalScore);

      return {
        student: { id: student._id, name: student.name, campusID: student.campusID, email: student.email },
        assessments: studentAssessments,
        cumulativeScore: finalScore,
        grade,
        gpa,
      };
    });

    res.status(200).json({
      success: true,
      totalWeightageConfigured,
      data: gradebook,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all grades and assessments for a specific student
// @route   GET /api/assessments/student/:studentId
// @access  Private
export const getStudentGrades = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const courses = await Course.find({ students: studentId }).select('title code creditHours');

    const studentGradesSummary = await Promise.all(
      courses.map(async (course) => {
        const assessments = await Assessment.find({ course: course._id });
        let cumulativeWeightedScore = 0;

        const items = assessments.map(assessment => {
          const record = assessment.records.find(r => r.student?.toString() === studentId.toString());
          const marksObtained = record ? record.marksObtained : 0;
          const weightedMarks = assessment.totalMarks > 0 
            ? (marksObtained / assessment.totalMarks) * assessment.weightage 
            : 0;

          cumulativeWeightedScore += weightedMarks;

          return {
            assessmentId: assessment._id,
            title: assessment.title,
            type: assessment.type,
            totalMarks: assessment.totalMarks,
            weightage: assessment.weightage,
            marksObtained,
            weightedMarks: Math.round(weightedMarks * 10) / 10,
            date: assessment.date,
          };
        });

        const finalScore = Math.round(cumulativeWeightedScore * 10) / 10;
        const { grade, gpa } = getGradeInfo(finalScore);

        return {
          course: { id: course._id, title: course.title, code: course.code, creditHours: course.creditHours },
          assessments: items,
          cumulativeScore: finalScore,
          grade,
          gpa,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: studentGradesSummary,
    });
  } catch (err) {
    next(err);
  }
};
