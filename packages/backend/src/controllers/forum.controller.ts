import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, category } = req.body;

    const post = await prisma.forumPost.create({
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
            role: true,
          },
        },
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = category ? { category: String(category) } : {};

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
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
              role: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.forumPost.count({ where }),
    ]);

    res.json({
      posts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
};

export const getPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await prisma.forumPost.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
          },
        },
      },
    });

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;

    const post = await prisma.forumPost.findFirst({
      where: {
        id,
        authorId: req.userId,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    const updatedPost = await prisma.forumPost.update({
      where: { id },
      data: { title, content, category },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
          },
        },
      },
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const post = await prisma.forumPost.findFirst({
      where: {
        id,
        authorId: req.userId,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    await prisma.forumPost.delete({
      where: { id },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.forumComment.create({
      data: {
        content,
        postId: id,
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
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comments = await prisma.forumComment.findMany({
      where: { postId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
          },
        },
      },
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
};
