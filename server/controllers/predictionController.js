import User from '../models/User.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Assessment from '../models/Assessment.js';

// Helper function to query predictions from Python ML microservice
const queryMLPrediction = async (studentData) => {
  try {
    const response = await fetch('http://localhost:5001/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData)
    });
    
    if (!response.ok) {
      throw new Error(`ML service returned status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error("Failed to connect to Python ML Service:", err.message);
    // Fallback: rule-based calculation if ML service is down
    const score = (
      0.30 * studentData.attendance_rate +
      0.25 * studentData.midterm_score +
      0.20 * studentData.quiz_avg +
      0.15 * studentData.assignment_avg +
      0.10 * (studentData.base_cgpa / 4.0 * 100)
    );
    const fail_prob = Math.max(0, Math.min(1, (100 - score) / 100));
    let risk_status = "Safe";
    if (fail_prob >= 0.80) risk_status = "Critical Risk";
    else if (fail_prob >= 0.60) risk_status = "High Risk";
    else if (fail_prob >= 0.30) risk_status = "Moderate Risk";

    return {
      success: true,
      fallback: true,
      prediction: fail_prob >= 0.48 ? 0 : 1,
      fail_probability: fail_prob,
      risk_percentage: fail_prob * 100,
      risk_status
    };
  }
};

// Helper function to compute features for a single student
const computeStudentFeatures = async (studentId) => {
  // 1. Fetch courses student is enrolled in
  const courses = await Course.find({ students: studentId });
  if (courses.length === 0) {
    return {
      attendance_rate: 85.0,
      quiz_avg: 75.0,
      assignment_avg: 75.0,
      midterm_score: 70.0,
      base_cgpa: 3.0
    };
  }

  const courseIds = courses.map(c => c._id);

  // 2. Compute Attendance Rate
  const attendanceSheets = await Attendance.find({ course: { $in: courseIds } });
  let totalSessions = 0;
  let presentScore = 0;

  attendanceSheets.forEach(sheet => {
    const record = sheet.records.find(r => r.student?.toString() === studentId.toString());
    if (record) {
      totalSessions++;
      if (record.status === 'Present' || record.status === 'Leave') {
        presentScore += 1.0;
      } else if (record.status === 'Late') {
        presentScore += 0.5;
      }
    }
  });

  const attendance_rate = totalSessions > 0 ? (presentScore / totalSessions) * 100 : 85.0;

  // 3. Compute Assessment Averages
  const assessments = await Assessment.find({ course: { $in: courseIds } });
  
  let quizSum = 0, quizCount = 0;
  let assignSum = 0, assignCount = 0;
  let midSum = 0, midCount = 0;

  assessments.forEach(assess => {
    const record = assess.records.find(r => r.student?.toString() === studentId.toString());
    if (record && assess.totalMarks > 0) {
      const percentage = (record.marksObtained / assess.totalMarks) * 100;
      if (assess.type === 'Quiz') {
        quizSum += percentage;
        quizCount++;
      } else if (assess.type === 'Assignment') {
        assignSum += percentage;
        assignCount++;
      } else if (assess.type === 'Midterm') {
        midSum += percentage;
        midCount++;
      }
    }
  });

  const quiz_avg = quizCount > 0 ? quizSum / quizCount : 75.0;
  const assignment_avg = assignCount > 0 ? assignSum / assignCount : 75.0;
  const midterm_score = midCount > 0 ? midSum / midCount : 70.0;

  // 4. Default CGPA
  const base_cgpa = 3.0;

  return {
    attendance_rate: Math.round(attendance_rate * 10) / 10,
    quiz_avg: Math.round(quiz_avg * 10) / 10,
    assignment_avg: Math.round(assignment_avg * 10) / 10,
    midterm_score: Math.round(midterm_score * 10) / 10,
    base_cgpa
  };
};

// @desc    Get predictive risk score for a single student
// @route   GET /api/predictions/student/:studentId
// @access  Private/Faculty/Admin
export const getStudentRiskDetails = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId).select('name campusID department program role');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const features = await computeStudentFeatures(studentId);
    const predictionResult = await queryMLPrediction(features);

    res.status(200).json({
      success: true,
      student,
      features,
      prediction: predictionResult
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all students classified as At-Risk (Moderate, High, Critical)
// @route   GET /api/predictions/dashboard
// @access  Private/Faculty/Admin
export const getAtRiskDashboard = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('name campusID department program');
    
    const studentsPredictionData = await Promise.all(
      students.map(async (student) => {
        const features = await computeStudentFeatures(student._id);
        const prediction = await queryMLPrediction(features);
        return {
          _id: student._id,
          name: student.name,
          campusID: student.campusID,
          department: student.department,
          program: student.program,
          features,
          prediction
        };
      })
    );

    // Filter out "Safe" students, sorting from Critical down to Moderate
    const atRiskList = studentsPredictionData
      .filter(item => item.prediction.risk_status !== 'Safe')
      .sort((a, b) => b.prediction.fail_probability - a.prediction.fail_probability);

    // Calculate total stats
    const totalStudents = students.length;
    const criticalCount = atRiskList.filter(item => item.prediction.risk_status === 'Critical Risk').length;
    const highCount = atRiskList.filter(item => item.prediction.risk_status === 'High Risk').length;
    const moderateCount = atRiskList.filter(item => item.prediction.risk_status === 'Moderate Risk').length;

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalAtRisk: atRiskList.length,
        criticalCount,
        highCount,
        moderateCount
      },
      data: atRiskList
    });
  } catch (err) {
    next(err);
  }
};
