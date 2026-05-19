import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Public or Private access to fetch current campus configuration
router.get('/', getSettings);

// Admin-only access to update campus configuration
router.put('/', protect, authorize('admin'), updateSettings);

export default router;
