import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  attendEvent,
  getEventAttendees,
} from '../controllers/event.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEvent);
router.get('/:id/attendees', getEventAttendees);

router.use(authMiddleware);

router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:id/attend', attendEvent);

export default router;
