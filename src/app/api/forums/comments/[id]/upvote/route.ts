import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: commentId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Check if comment exists
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        })

        if (!comment || comment.isDeleted) {
            return NextResponse.json(
                { success: false, error: 'Comment not found' },
                { status: 404 }
            )
        }

        // Check if already upvoted
        const existing = await prisma.commentUpvote.findUnique({
            where: {
                userId_commentId: {
                    userId: user.id,
                    commentId,
                },
            },
        })

        if (existing) {
            // Remove upvote
            await prisma.commentUpvote.delete({
                where: { id: existing.id },
            })

            const count = await prisma.commentUpvote.count({
                where: { commentId },
            })

            return NextResponse.json({
                success: true,
                data: { upvoted: false, count },
            })
        } else {
            // Add upvote
            await prisma.commentUpvote.create({
                data: {
                    userId: user.id,
                    commentId,
                },
            })

            const count = await prisma.commentUpvote.count({
                where: { commentId },
            })

            return NextResponse.json({
                success: true,
                data: { upvoted: true, count },
            })
        }
    } catch (error) {
        console.error('Comment upvote error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to toggle upvote' },
            { status: 500 }
        )
    }
}
