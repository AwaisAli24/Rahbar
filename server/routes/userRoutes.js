import { Router } from 'express';
import { getUsers, updateUser, deleteUser, getUserStats, uploadProfilePicture } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// All routes here are protected and restricted to Admin
router.use(protect);
router.use(authorize('admin'));

router.get('/',          getUsers);
router.get('/stats',     getUserStats);
router.put('/:id',       updateUser);
router.delete('/:id',    deleteUser);
router.post('/:id/photo', upload.single('profilePicture'), uploadProfilePicture);

export default router;
