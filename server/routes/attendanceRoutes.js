import { Router } from 'express';
import { 
  getAttendance, 
  markAttendance, 
  getAttendanceSummary,
  getStudentAttendance,
  clearCourseAttendance,
  getStudentAbsenceLogs,
  updateStudentAttendanceRecord,
  reverseWithdrawal
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getAttendance);
router.post('/', markAttendance);
router.get('/summary/:courseId', getAttendanceSummary);
router.get('/student/:studentId', getStudentAttendance);
router.get('/absences/:courseId/:studentId', getStudentAbsenceLogs);
router.put('/update-record', updateStudentAttendanceRecord);
router.post('/reverse-withdrawal', reverseWithdrawal);
router.delete('/clear/:courseId', clearCourseAttendance);

export default router;
