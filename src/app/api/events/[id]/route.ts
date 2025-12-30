import { NextResponse } from 'next/server'
import { getCurrentUser, canModerate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                rsvps: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                _count: {
                    select: { rsvps: true },
                },
            },
        })

        if (!event) {
            return NextResponse.json(
                { success: false, error: 'Event not found' },
                { status: 404 }
            )
        }

        // Get RSVP counts by status
        const rsvpCounts = {
            going: event.rsvps.filter(r => r.status === 'GOING').length,
            interested: event.rsvps.filter(r => r.status === 'INTERESTED').length,
            maybe: event.rsvps.filter(r => r.status === 'MAYBE').length,
        }

        // Get current user's RSVP if logged in
        const userRsvp = user
            ? event.rsvps.find(r => r.userId === user.id)
            : null

        return NextResponse.json({
            success: true,
            data: {
                ...event,
                rsvpCounts,
                userRsvp: userRsvp ? { status: userRsvp.status, dogsCount: userRsvp.dogsCount } : null,
            },
        })
    } catch (error) {
        console.error('Event fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch event' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const event = await prisma.event.findUnique({
            where: { id },
        })

        if (!event) {
            return NextResponse.json(
                { success: false, error: 'Event not found' },
                { status: 404 }
            )
        }

        if (event.creatorId !== user.id && !canModerate(user)) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
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
            capacity,
            isOffLeash,
            requiresTicket,
            ticketUrl,
            imageUrl,
        } = body

        const updated = await prisma.event.update({
            where: { id },
            data: {
                title: title?.trim() || event.title,
                description: description?.trim() || event.description,
                category: category || event.category,
                date: date ? new Date(date) : event.date,
                endDate: endDate ? new Date(endDate) : event.endDate,
                location: location?.trim() || event.location,
                address: address?.trim() ?? event.address,
                capacity: capacity !== undefined ? parseInt(capacity) : event.capacity,
                isOffLeash: isOffLeash !== undefined ? isOffLeash : event.isOffLeash,
                requiresTicket: requiresTicket !== undefined ? requiresTicket : event.requiresTicket,
                ticketUrl: ticketUrl?.trim() ?? event.ticketUrl,
                imageUrl: imageUrl?.trim() ?? event.imageUrl,
            },
        })

        return NextResponse.json({
            success: true,
            data: updated,
        })
    } catch (error) {
        console.error('Event update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update event' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const event = await prisma.event.findUnique({
            where: { id },
        })

        if (!event) {
            return NextResponse.json(
                { success: false, error: 'Event not found' },
                { status: 404 }
            )
        }

        if (event.creatorId !== user.id && !canModerate(user)) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            )
        }

        // Soft delete by marking as cancelled
        await prisma.event.update({
            where: { id },
            data: { isCancelled: true },
        })

        return NextResponse.json({
            success: true,
            message: 'Event cancelled',
        })
    } catch (error) {
        console.error('Event cancel error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to cancel event' },
            { status: 500 }
        )
    }
}
