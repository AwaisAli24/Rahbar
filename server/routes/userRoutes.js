import { Router } from 'express';
import { getUsers, updateUser, deleteUser, getUserStats } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// All routes here are protected and restricted to Admin
router.use(protect);
router.use(authorize('admin'));

router.get('/',    getUsers);
router.get('/stats', getUserStats);
router.put('/:id',    updateUser);
router.delete('/:id', deleteUser);

export default router;
