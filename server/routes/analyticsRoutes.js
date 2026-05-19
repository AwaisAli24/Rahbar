import { Router } from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Only Admins should see the overall campus analytics dashboard
router.get('/', protect, authorize('admin'), getAnalytics);

export default router;
