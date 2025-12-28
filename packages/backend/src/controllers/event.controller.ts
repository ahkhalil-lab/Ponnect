import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, location, latitude, longitude, startTime, endTime, maxAttendees, image } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        location,
        latitude,
        longitude,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        maxAttendees,
        image,
        organizerId: req.userId!,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { location, upcoming = 'true', page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (location && typeof location === 'string') {
      // Sanitize location input to prevent SQL injection
      const sanitizedLocation = location.replace(/[^\w\s,]/g, '');
      where.location = { contains: sanitizedLocation, mode: 'insensitive' };
    }

    if (upcoming === 'true') {
      where.startTime = { gte: new Date() };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { startTime: 'asc' },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          _count: {
            select: { attendees: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      events,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
};

export const getEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        _count: {
          select: { attendees: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, location, latitude, longitude, startTime, endTime, maxAttendees, image } = req.body;

    const event = await prisma.event.findFirst({
      where: {
        id,
        organizerId: req.userId,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        location,
        latitude,
        longitude,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        maxAttendees,
        image,
      },
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findFirst({
      where: {
        id,
        organizerId: req.userId,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    await prisma.event.delete({
      where: { id },
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

export const attendEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { attendees: { where: { status: 'GOING' } } },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event is full
    if (event.maxAttendees && event._count.attendees >= event.maxAttendees && status === 'GOING') {
      return res.status(400).json({ error: 'Event is full' });
    }

    const attendee = await prisma.eventAttendee.upsert({
      where: {
        userId_eventId: {
          userId: req.userId!,
          eventId: id,
        },
      },
      update: { status },
      create: {
        userId: req.userId!,
        eventId: id,
        status,
      },
    });

    res.json(attendee);
  } catch (error) {
    console.error('Attend event error:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

export const getEventAttendees = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    res.json(attendees);
  } catch (error) {
    console.error('Get attendees error:', error);
    res.status(500).json({ error: 'Failed to get attendees' });
  }
};
