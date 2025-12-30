import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const search = searchParams.get('search')
        const upcoming = searchParams.get('upcoming') !== 'false'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {
            isCancelled: false,
            isApproved: true,
        }

        if (upcoming) {
            where.date = { gte: new Date() }
        }

        if (category && category !== 'all') {
            where.category = category
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { location: { contains: search } },
            ]
        }

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                orderBy: { date: 'asc' },
                skip,
                take: limit,
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                    _count: {
                        select: { rsvps: true },
                    },
                },
            }),
            prisma.event.count({ where }),
        ])

        return NextResponse.json({
            success: true,
            data: events,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Events fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch events' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            title,
            description,
            category,
            date,
            endDate,
            location,
            address,
            latitude,
            longitude,
            capacity,
            isOffLeash,
            requiresTicket,
            ticketUrl,
            imageUrl,
        } = body

        if (!title || title.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Title is required' },
                { status: 400 }
            )
        }

        if (!description || description.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Description is required' },
                { status: 400 }
            )
        }

        const validCategories = ['MEETUP', 'TRAINING', 'COMPETITION', 'CHARITY', 'SOCIAL', 'OTHER']
        if (!category || !validCategories.includes(category)) {
            return NextResponse.json(
                { success: false, error: 'Valid category is required' },
                { status: 400 }
            )
        }

        if (!date) {
            return NextResponse.json(
                { success: false, error: 'Event date is required' },
                { status: 400 }
            )
        }

        if (!location || location.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Location is required' },
                { status: 400 }
            )
        }

        const event = await prisma.event.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                category,
                date: new Date(date),
                endDate: endDate ? new Date(endDate) : null,
                location: location.trim(),
                address: address?.trim() || null,
                latitude: latitude || null,
                longitude: longitude || null,
                capacity: capacity ? parseInt(capacity) : null,
                isOffLeash: isOffLeash || false,
                requiresTicket: requiresTicket || false,
                ticketUrl: ticketUrl?.trim() || null,
                imageUrl: imageUrl?.trim() || null,
                creatorId: user.id,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: event,
        }, { status: 201 })
    } catch (error) {
        console.error('Event creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create event' },
            { status: 500 }
        )
    }
}
