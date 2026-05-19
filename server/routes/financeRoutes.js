import { Router } from 'express';
import { 
  getFees, createFee, updateFeeStatus, deleteFee,
  getSalaries, createSalary, updateSalaryStatus, deleteSalary 
} from '../controllers/financeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Require authentication for all finance routes
router.use(protect);

// ─── FEE ROUTES ───────────────────────────────────────────────────────────────
// Students can view their fees; Admins can do all
router.get('/fees', getFees);
router.post('/fees', authorize('admin'), createFee);
router.put('/fees/:id/status', authorize('admin'), updateFeeStatus);
router.delete('/fees/:id', authorize('admin'), deleteFee);

// ─── SALARY ROUTES ────────────────────────────────────────────────────────────
// Faculty can view their salaries; Admins can do all
router.get('/salaries', getSalaries);
router.post('/salaries', authorize('admin'), createSalary);
router.put('/salaries/:id/status', authorize('admin'), updateSalaryStatus);
router.delete('/salaries/:id', authorize('admin'), deleteSalary);

export default router;
