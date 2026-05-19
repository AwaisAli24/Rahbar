import { Router } from 'express';
import { getNotices, createNotice, deleteNotice } from '../controllers/noticeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Require authentication for all notice routes
router.use(protect);

// All authenticated users can view notices (filtered by role in controller)
router.get('/', getNotices);

// Only admins can create and delete notices
router.post('/', authorize('admin'), createNotice);
router.delete('/:id', authorize('admin'), deleteNotice);

export default router;
