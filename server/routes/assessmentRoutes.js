import { Router } from 'express';
import { 
  getAssessments, 
  createAssessment, 
  updateMarks, 
  deleteAssessment, 
  getGradebookSummary, 
  getStudentGrades 
} from '../controllers/assessmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getAssessments);
router.post('/', createAssessment);
router.put('/:id/marks', updateMarks);
router.delete('/:id', deleteAssessment);
router.get('/gradebook/:courseId', getGradebookSummary);
router.get('/student/:studentId', getStudentGrades);

export default router;
