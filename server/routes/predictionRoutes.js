import { Router } from 'express';
import { getStudentRiskDetails, getAtRiskDashboard } from '../controllers/predictionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all prediction routes
router.use(protect);

// Dashboards and general listings only accessible by Faculty or Admin
router.get('/dashboard', authorize('admin', 'faculty'), getAtRiskDashboard);

// Details for a single student (could be viewed by student themselves, faculty, or admin)
router.get('/student/:studentId', getStudentRiskDetails);

export default router;
