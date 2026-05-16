import { Router } from 'express';
import { 
  getTimetable, 
  createTimetableSlot, 
  deleteTimetableSlot 
} from '../controllers/timetableController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getTimetable);

// Admin-only operations for modifying the timetable
router.post('/', authorize('admin'), createTimetableSlot);
router.delete('/:id', authorize('admin'), deleteTimetableSlot);

export default router;
