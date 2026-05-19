import User from '../models/User.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Assessment from '../models/Assessment.js';

// @desc    Get dashboard analytics data
// @route   GET /api/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res, next) => {
  try {
    // 1. Core KPIs
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const activeCourses = await Course.countDocuments();
    
    // Total Assessments (using this as a proxy for activity)
    const totalAssessments = await Assessment.countDocuments();

    // 2. Department-wise Student Distribution
    const departmentDistribution = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $project: { department: { $ifNull: ['$_id', 'Unassigned'] }, count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    // Format for Recharts
    const formattedDeptData = departmentDistribution.map(d => ({
      name: d.department === 'Computer Science' ? 'CS' : 
            d.department === 'Software Engineering' ? 'SE' : 
            d.department === 'Information Technology' ? 'IT' : 
            d.department === 'Artificial Intelligence' ? 'AI' : 
            d.department === 'Business Administration' ? 'BBA' : d.department,
      students: d.count
    }));

    // 3. Faculty by Designation
    const facultyDistribution = await User.aggregate([
      { $match: { role: 'faculty' } },
      { $group: { _id: '$designation', count: { $sum: 1 } } },
      { $project: { designation: { $ifNull: ['$_id', 'Unassigned'] }, count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    // 4. Recent Activity (Latest Assessments or Courses created)
    // We will mix recent courses and assessments for a lively activity feed
    const recentAssessments = await Assessment.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('course', 'code title');
    
    const recentCourses = await Course.find()
      .sort({ createdAt: -1 })
      .limit(2);

    // Format activity feed
    let activityFeed = [];
    recentAssessments.forEach(a => {
      activityFeed.push({
        id: a._id,
        type: 'assessment',
        title: `New ${a.type} published for ${a.course?.code || 'Course'}`,
        timestamp: a.createdAt
      });
    });
    recentCourses.forEach(c => {
      activityFeed.push({
        id: c._id,
        type: 'course',
        title: `New course ${c.code} added to catalog`,
        timestamp: c.createdAt
      });
    });

    // Sort combined activity by timestamp descending
    activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    activityFeed = activityFeed.slice(0, 5); // keep top 5

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalStudents,
          totalFaculty,
          activeCourses,
          totalAssessments
        },
        charts: {
          departmentStudents: formattedDeptData,
          facultyDesignations: facultyDistribution
        },
        activity: activityFeed
      }
    });
  } catch (err) {
    next(err);
  }
};
