import { Router } from 'express';
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  createComment,
  getComments,
} from '../controllers/forum.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/posts', getPosts);
router.get('/posts/:id', getPost);

router.use(authMiddleware);

router.post('/posts', createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.post('/posts/:id/comments', createComment);
router.get('/posts/:id/comments', getComments);

export default router;
