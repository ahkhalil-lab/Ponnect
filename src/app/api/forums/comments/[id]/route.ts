import { NextResponse } from 'next/server'
import { getCurrentUser, canModerate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
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

        const comment = await prisma.comment.findUnique({
            where: { id },
        })

        if (!comment || comment.isDeleted) {
            return NextResponse.json(
                { success: false, error: 'Comment not found' },
                { status: 404 }
            )
        }

        // Only author can edit
        if (comment.authorId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { content } = body

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Content is required' },
                { status: 400 }
            )
        }

        const updated = await prisma.comment.update({
            where: { id },
            data: { content: content.trim() },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: updated,
        })
    } catch (error) {
        console.error('Comment update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update comment' },
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

        const comment = await prisma.comment.findUnique({
            where: { id },
        })

        if (!comment) {
            return NextResponse.json(
                { success: false, error: 'Comment not found' },
                { status: 404 }
            )
        }

        // Author or moderator can delete
        if (comment.authorId !== user.id && !canModerate(user)) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            )
        }

        // Soft delete
        await prisma.comment.update({
            where: { id },
            data: { isDeleted: true },
        })

        return NextResponse.json({
            success: true,
            message: 'Comment deleted',
        })
    } catch (error) {
        console.error('Comment delete error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete comment' },
            { status: 500 }
        )
    }
}
