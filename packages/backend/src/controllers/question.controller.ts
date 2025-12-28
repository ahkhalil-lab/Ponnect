import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, category } = req.body;

    const question = await prisma.question.create({
      data: {
        title,
        content,
        category,
        authorId: req.userId!,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json(question);
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
};

export const getQuestions = async (req: Request, res: Response) => {
  try {
    const { category, status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (category) where.category = String(category);
    if (status) where.status = String(status);

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          _count: {
            select: { answers: true },
          },
        },
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      questions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
};

export const getQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        answers: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                role: true,
                isVerified: true,
              },
            },
          },
          orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    res.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to get question' });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;

    const question = await prisma.question.findFirst({
      where: {
        id,
        authorId: req.userId,
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found or unauthorized' });
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: { title, content, category },
    });

    res.json(updatedQuestion);
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findFirst({
      where: {
        id,
        authorId: req.userId,
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found or unauthorized' });
    }

    await prisma.question.delete({
      where: { id },
    });

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

export const createAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const answer = await prisma.answer.create({
      data: {
        content,
        questionId: id,
        authorId: req.userId!,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
            isVerified: true,
          },
        },
      },
    });

    // Update question status
    await prisma.question.update({
      where: { id },
      data: { status: 'ANSWERED' },
    });

    res.status(201).json(answer);
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({ error: 'Failed to create answer' });
  }
};

export const acceptAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { answerId } = req.params;

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: { question: true },
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Check if user is question author
    if (answer.question.authorId !== req.userId) {
      return res.status(403).json({ error: 'Only question author can accept answers' });
    }

    // Unaccept all other answers
    await prisma.answer.updateMany({
      where: { questionId: answer.questionId },
      data: { isAccepted: false },
    });

    // Accept this answer
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: { isAccepted: true },
    });

    res.json(updatedAnswer);
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({ error: 'Failed to accept answer' });
  }
};
