import { Router } from 'express';
import {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  createAnswer,
  acceptAnswer,
} from '../controllers/question.controller';
import { authMiddleware, isVetOrTrainer } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getQuestions);
router.get('/:id', getQuestion);

router.use(authMiddleware);

router.post('/', createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);
router.post('/:id/answers', isVetOrTrainer, createAnswer);
router.post('/answers/:answerId/accept', acceptAnswer);

export default router;
