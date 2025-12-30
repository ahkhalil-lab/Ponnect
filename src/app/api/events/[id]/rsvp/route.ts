import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: eventId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({
                success: true,
                data: null,
            })
        }

        const rsvp = await prisma.eventRSVP.findUnique({
            where: {
                userId_eventId: {
                    userId: user.id,
                    eventId,
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: rsvp,
        })
    } catch (error) {
        console.error('RSVP fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch RSVP' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: eventId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        })

        if (!event) {
            return NextResponse.json(
                { success: false, error: 'Event not found' },
                { status: 404 }
            )
        }

        if (event.isCancelled) {
            return NextResponse.json(
                { success: false, error: 'Event is cancelled' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { status, dogsCount } = body

        if (!status || !['GOING', 'INTERESTED', 'MAYBE'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Valid status is required (GOING, INTERESTED, MAYBE)' },
                { status: 400 }
            )
        }

        // Check capacity if going
        if (status === 'GOING' && event.capacity) {
            const goingCount = await prisma.eventRSVP.count({
                where: {
                    eventId,
                    status: 'GOING',
                    userId: { not: user.id },
                },
            })

            if (goingCount >= event.capacity) {
                return NextResponse.json(
                    { success: false, error: 'Event is at full capacity' },
                    { status: 400 }
                )
            }
        }

        const rsvp = await prisma.eventRSVP.upsert({
            where: {
                userId_eventId: {
                    userId: user.id,
                    eventId,
                },
            },
            update: {
                status,
                dogsCount: dogsCount ? parseInt(dogsCount) : 1,
            },
            create: {
                userId: user.id,
                eventId,
                status,
                dogsCount: dogsCount ? parseInt(dogsCount) : 1,
            },
        })

        // Get updated counts
        const rsvpCounts = {
            going: await prisma.eventRSVP.count({ where: { eventId, status: 'GOING' } }),
            interested: await prisma.eventRSVP.count({ where: { eventId, status: 'INTERESTED' } }),
            maybe: await prisma.eventRSVP.count({ where: { eventId, status: 'MAYBE' } }),
        }

        return NextResponse.json({
            success: true,
            data: { rsvp, rsvpCounts },
        })
    } catch (error) {
        console.error('RSVP create error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to RSVP' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id: eventId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        await prisma.eventRSVP.delete({
            where: {
                userId_eventId: {
                    userId: user.id,
                    eventId,
                },
            },
        })

        // Get updated counts
        const rsvpCounts = {
            going: await prisma.eventRSVP.count({ where: { eventId, status: 'GOING' } }),
            interested: await prisma.eventRSVP.count({ where: { eventId, status: 'INTERESTED' } }),
            maybe: await prisma.eventRSVP.count({ where: { eventId, status: 'MAYBE' } }),
        }

        return NextResponse.json({
            success: true,
            data: { rsvpCounts },
            message: 'RSVP cancelled',
        })
    } catch (error) {
        console.error('RSVP delete error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to cancel RSVP' },
            { status: 500 }
        )
    }
}
