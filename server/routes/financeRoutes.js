import { Router } from 'express';
import { 
  getFees, createFee, updateFeeStatus, deleteFee, createBulkFees, updateFee, autoGenerateFees,
  getSalaries, createSalary, updateSalaryStatus, deleteSalary 
} from '../controllers/financeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Require authentication for all finance routes
router.use(protect);

// ─── FEE ROUTES ───────────────────────────────────────────────────────────────
router.get('/fees', getFees);
router.post('/fees', authorize('admin'), createFee);
router.post('/fees/auto', authorize('admin'), autoGenerateFees);
router.post('/fees/bulk', authorize('admin'), createBulkFees);
router.put('/fees/:id', authorize('admin'), updateFee);
router.put('/fees/:id/status', authorize('admin'), updateFeeStatus);
router.delete('/fees/:id', authorize('admin'), deleteFee);
router.delete('/fees/:id', authorize('admin'), deleteFee);

// ─── SALARY ROUTES ────────────────────────────────────────────────────────────
// Faculty can view their salaries; Admins can do all
router.get('/salaries', getSalaries);
router.post('/salaries', authorize('admin'), createSalary);
router.put('/salaries/:id/status', authorize('admin'), updateSalaryStatus);
router.delete('/salaries/:id', authorize('admin'), deleteSalary);

export default router;
