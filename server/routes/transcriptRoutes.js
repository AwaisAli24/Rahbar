import { Router } from 'express';
import {
  getAllTranscripts,
  getStudentTranscript,
} from '../controllers/transcriptController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getAllTranscripts);
router.get('/:studentId', getStudentTranscript);

export default router;
