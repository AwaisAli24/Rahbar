import { Router } from 'express';
import { 
  createCourse, getCourses, getCourse, 
  enrollStudents, deleteCourse, updateCourseFaculty 
} from '../controllers/courseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getCourses);
router.get('/:id', getCourse);

// Admin-only operations
router.post('/', authorize('admin'), createCourse);
router.post('/:id/enroll', authorize('admin'), enrollStudents);
router.put('/:id/faculty', authorize('admin'), updateCourseFaculty);
router.delete('/:id', authorize('admin'), deleteCourse);

export default router;
