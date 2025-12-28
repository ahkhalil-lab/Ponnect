import { Router } from 'express';
import { createDog, getUserDogs, getDog, updateDog, deleteDog } from '../controllers/dog.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createDog);
router.get('/', getUserDogs);
router.get('/:id', getDog);
router.put('/:id', updateDog);
router.delete('/:id', deleteDog);

export default router;
