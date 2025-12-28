import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const createDog = async (req: AuthRequest, res: Response) => {
  try {
    const { name, breed, birthDate, weight, image } = req.body;

    const dog = await prisma.dog.create({
      data: {
        name,
        breed,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        weight,
        image,
        ownerId: req.userId!,
      },
    });

    res.status(201).json(dog);
  } catch (error) {
    console.error('Create dog error:', error);
    res.status(500).json({ error: 'Failed to create dog profile' });
  }
};

export const getUserDogs = async (req: AuthRequest, res: Response) => {
  try {
    const dogs = await prisma.dog.findMany({
      where: { ownerId: req.userId },
      include: {
        vaccinations: true,
        medications: true,
        reminders: {
          where: { completed: false },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    res.json(dogs);
  } catch (error) {
    console.error('Get dogs error:', error);
    res.status(500).json({ error: 'Failed to get dogs' });
  }
};

export const getDog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const dog = await prisma.dog.findFirst({
      where: {
        id,
        ownerId: req.userId,
      },
      include: {
        vaccinations: {
          orderBy: { date: 'desc' },
        },
        medications: {
          orderBy: { startDate: 'desc' },
        },
        reminders: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    res.json(dog);
  } catch (error) {
    console.error('Get dog error:', error);
    res.status(500).json({ error: 'Failed to get dog' });
  }
};

export const updateDog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, breed, birthDate, weight, image } = req.body;

    const dog = await prisma.dog.findFirst({
      where: {
        id,
        ownerId: req.userId,
      },
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    const updatedDog = await prisma.dog.update({
      where: { id },
      data: {
        name,
        breed,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        weight,
        image,
      },
    });

    res.json(updatedDog);
  } catch (error) {
    console.error('Update dog error:', error);
    res.status(500).json({ error: 'Failed to update dog' });
  }
};

export const deleteDog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const dog = await prisma.dog.findFirst({
      where: {
        id,
        ownerId: req.userId,
      },
    });

    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    await prisma.dog.delete({
      where: { id },
    });

    res.json({ message: 'Dog deleted successfully' });
  } catch (error) {
    console.error('Delete dog error:', error);
    res.status(500).json({ error: 'Failed to delete dog' });
  }
};
