import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const isRead = searchParams.get('isRead')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {
            userId: user.id,
        }

        if (type && type !== 'all') {
            where.type = type
        }

        if (isRead !== null && isRead !== 'all') {
            where.isRead = isRead === 'true'
        }

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: { userId: user.id, isRead: false },
            }),
        ])

        return NextResponse.json({
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Notifications fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch notifications' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        // This endpoint is for internal use to create notifications
        const body = await request.json()
        const { userId, type, title, message, link } = body

        if (!userId || !type || !title || !message) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const validTypes = ['FORUM_REPLY', 'UPVOTE', 'EVENT_REMINDER', 'HEALTH_REMINDER', 'EXPERT_ANSWER', 'SYSTEM']
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid notification type' },
                { status: 400 }
            )
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link: link || null,
            },
        })

        return NextResponse.json({
            success: true,
            data: notification,
        }, { status: 201 })
    } catch (error) {
        console.error('Notification creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create notification' },
            { status: 500 }
        )
    }
}
