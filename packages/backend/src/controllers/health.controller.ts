import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

// Vaccinations
export const createVaccination = async (req: AuthRequest, res: Response) => {
  try {
    const { dogId, name, date, nextDue, veterinarian, notes } = req.body;

    // Verify dog ownership
    const dog = await prisma.dog.findFirst({
      where: { id: dogId, ownerId: req.userId },
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    const vaccination = await prisma.vaccination.create({
      data: {
        dogId,
        name,
        date: new Date(date),
        nextDue: nextDue ? new Date(nextDue) : undefined,
        veterinarian,
        notes,
      },
    });

    res.status(201).json(vaccination);
  } catch (error) {
    console.error('Create vaccination error:', error);
    res.status(500).json({ error: 'Failed to create vaccination record' });
  }
};

export const getVaccinations = async (req: AuthRequest, res: Response) => {
  try {
    const { dogId } = req.params;

    const dog = await prisma.dog.findFirst({
      where: { id: dogId, ownerId: req.userId },
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    const vaccinations = await prisma.vaccination.findMany({
      where: { dogId },
      orderBy: { date: 'desc' },
    });

    res.json(vaccinations);
  } catch (error) {
    console.error('Get vaccinations error:', error);
    res.status(500).json({ error: 'Failed to get vaccinations' });
  }
};

export const updateVaccination = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, date, nextDue, veterinarian, notes } = req.body;

    const vaccination = await prisma.vaccination.findUnique({
      where: { id },
      include: { dog: true },
    });

    if (!vaccination || vaccination.dog.ownerId !== req.userId) {
      return res.status(404).json({ error: 'Vaccination not found' });
    }

    const updated = await prisma.vaccination.update({
      where: { id },
      data: {
        name,
        date: date ? new Date(date) : undefined,
        nextDue: nextDue ? new Date(nextDue) : undefined,
        veterinarian,
        notes,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update vaccination error:', error);
    res.status(500).json({ error: 'Failed to update vaccination' });
  }
};

export const deleteVaccination = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const vaccination = await prisma.vaccination.findUnique({
      where: { id },
      include: { dog: true },
    });

    if (!vaccination || vaccination.dog.ownerId !== req.userId) {
      return res.status(404).json({ error: 'Vaccination not found' });
    }

    await prisma.vaccination.delete({ where: { id } });

    res.json({ message: 'Vaccination deleted successfully' });
  } catch (error) {
    console.error('Delete vaccination error:', error);
    res.status(500).json({ error: 'Failed to delete vaccination' });
  }
};

// Medications
export const createMedication = async (req: AuthRequest, res: Response) => {
  try {
    const { dogId, name, dosage, frequency, startDate, endDate, notes } = req.body;

    const dog = await prisma.dog.findFirst({
      where: { id: dogId, ownerId: req.userId },
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    const medication = await prisma.medication.create({
      data: {
        dogId,
        name,
        dosage,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        notes,
      },
    });

    res.status(201).json(medication);
  } catch (error) {
    console.error('Create medication error:', error);
    res.status(500).json({ error: 'Failed to create medication record' });
  }
};

export const getMedications = async (req: AuthRequest, res: Response) => {
  try {
    const { dogId } = req.params;

    const dog = await prisma.dog.findFirst({
      where: { id: dogId, ownerId: req.userId },
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    const medications = await prisma.medication.findMany({
      where: { dogId },
      orderBy: { startDate: 'desc' },
    });

    res.json(medications);
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ error: 'Failed to get medications' });
  }
};

export const updateMedication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, dosage, frequency, startDate, endDate, notes } = req.body;

    const medication = await prisma.medication.findUnique({
      where: { id },
      include: { dog: true },
    });

    if (!medication || medication.dog.ownerId !== req.userId) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const updated = await prisma.medication.update({
      where: { id },
      data: {
        name,
        dosage,
        frequency,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        notes,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ error: 'Failed to update medication' });
  }
};

export const deleteMedication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const medication = await prisma.medication.findUnique({
      where: { id },
      include: { dog: true },
    });

    if (!medication || medication.dog.ownerId !== req.userId) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    await prisma.medication.delete({ where: { id } });

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ error: 'Failed to delete medication' });
  }
};

// Reminders
export const createReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { dogId, title, description, dueDate, type } = req.body;

    const dog = await prisma.dog.findFirst({
      where: { id: dogId, ownerId: req.userId },
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    const reminder = await prisma.reminder.create({
      data: {
        dogId,
        title,
        description,
        dueDate: new Date(dueDate),
        type,
      },
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
};

export const getReminders = async (req: AuthRequest, res: Response) => {
  try {
    const { dogId } = req.params;
    const { completed } = req.query;

    const dog = await prisma.dog.findFirst({
      where: { id: dogId, ownerId: req.userId },
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    const where: any = { dogId };
    if (completed !== undefined) {
      where.completed = completed === 'true';
    }

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Failed to get reminders' });
  }
};

export const updateReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, type } = req.body;

    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: { dog: true },
    });

    if (!reminder || reminder.dog.ownerId !== req.userId) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        type,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
};

export const deleteReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: { dog: true },
    });

    if (!reminder || reminder.dog.ownerId !== req.userId) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    await prisma.reminder.delete({ where: { id } });

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
};

export const completeReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: { dog: true },
    });

    if (!reminder || reminder.dog.ownerId !== req.userId) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: { completed: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Complete reminder error:', error);
    res.status(500).json({ error: 'Failed to complete reminder' });
  }
};
