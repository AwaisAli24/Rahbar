import { Router } from 'express';
import {
  startClass,
  endClass,
  getSessionStatus,
  getMySessions,
  getAllFacultyAttendance,
  getFacultySessionsById,
  getFacultyAttendanceSummary,
} from '../controllers/facultyAttendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

// Faculty routes
router.post('/start-class', startClass);
router.post('/end-class', endClass);
router.get('/session-status', getSessionStatus);
router.get('/my-sessions', getMySessions);

// Admin routes
router.get('/all', getAllFacultyAttendance);
router.get('/summary', getFacultyAttendanceSummary);
router.get('/faculty/:facultyId', getFacultySessionsById);

export default router;
