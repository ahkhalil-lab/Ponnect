import { Router } from 'express';
import {
  createVaccination,
  getVaccinations,
  updateVaccination,
  deleteVaccination,
  createMedication,
  getMedications,
  updateMedication,
  deleteMedication,
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
  completeReminder,
} from '../controllers/health.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Vaccinations
router.post('/vaccinations', createVaccination);
router.get('/vaccinations/:dogId', getVaccinations);
router.put('/vaccinations/:id', updateVaccination);
router.delete('/vaccinations/:id', deleteVaccination);

// Medications
router.post('/medications', createMedication);
router.get('/medications/:dogId', getMedications);
router.put('/medications/:id', updateMedication);
router.delete('/medications/:id', deleteMedication);

// Reminders
router.post('/reminders', createReminder);
router.get('/reminders/:dogId', getReminders);
router.put('/reminders/:id', updateReminder);
router.delete('/reminders/:id', deleteReminder);
router.post('/reminders/:id/complete', completeReminder);

export default router;
