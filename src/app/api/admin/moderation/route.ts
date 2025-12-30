import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
            return NextResponse.json(
                { success: false, error: 'Moderator access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'all'

        const items: {
            posts: unknown[]
            events: unknown[]
            comments: unknown[]
        } = {
            posts: [],
            events: [],
            comments: [],
        }

        // Get flagged/reported posts (using isPinned as a simple flag for demo)
        if (type === 'all' || type === 'posts') {
            items.posts = await prisma.forumPost.findMany({
                where: { isLocked: true },
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { id: true, name: true, email: true } },
                    category: { select: { name: true } },
                },
            })
        }

        // Get unapproved events
        if (type === 'all' || type === 'events') {
            items.events = await prisma.event.findMany({
                where: { isApproved: false, isCancelled: false },
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    creator: { select: { id: true, name: true, email: true } },
                },
            })
        }

        return NextResponse.json({
            success: true,
            data: items,
            counts: {
                posts: items.posts.length,
                events: items.events.length,
                comments: items.comments.length,
            },
        })
    } catch (error) {
        console.error('Moderation queue error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch moderation queue' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
            return NextResponse.json(
                { success: false, error: 'Moderator access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { action, type, itemId } = body

        if (!action || !type || !itemId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        let result: unknown = null

        switch (type) {
            case 'post':
                if (action === 'approve') {
                    result = await prisma.forumPost.update({
                        where: { id: itemId },
                        data: { isLocked: false },
                    })
                } else if (action === 'remove') {
                    result = await prisma.forumPost.delete({
                        where: { id: itemId },
                    })
                }
                break

            case 'event':
                if (action === 'approve') {
                    result = await prisma.event.update({
                        where: { id: itemId },
                        data: { isApproved: true },
                    })
                } else if (action === 'reject') {
                    result = await prisma.event.update({
                        where: { id: itemId },
                        data: { isCancelled: true },
                    })
                }
                break

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid type' },
                    { status: 400 }
                )
        }

        return NextResponse.json({
            success: true,
            data: result,
            message: `${type} ${action}d successfully`,
        })
    } catch (error) {
        console.error('Moderation action error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to perform moderation action' },
            { status: 500 }
        )
    }
}
