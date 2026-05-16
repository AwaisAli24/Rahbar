import { Router } from 'express';
import { 
  getAttendance, 
  markAttendance, 
  getAttendanceSummary,
  getStudentAttendance
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getAttendance);
router.post('/', markAttendance);
router.get('/summary/:courseId', getAttendanceSummary);
router.get('/student/:studentId', getStudentAttendance);

export default router;
