import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: postId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Check if post exists
        const post = await prisma.forumPost.findUnique({
            where: { id: postId },
        })

        if (!post || post.isDeleted) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            )
        }

        // Check if already upvoted
        const existing = await prisma.postUpvote.findUnique({
            where: {
                userId_postId: {
                    userId: user.id,
                    postId,
                },
            },
        })

        if (existing) {
            // Remove upvote
            await prisma.postUpvote.delete({
                where: { id: existing.id },
            })

            const count = await prisma.postUpvote.count({
                where: { postId },
            })

            return NextResponse.json({
                success: true,
                data: { upvoted: false, count },
            })
        } else {
            // Add upvote
            await prisma.postUpvote.create({
                data: {
                    userId: user.id,
                    postId,
                },
            })

            const count = await prisma.postUpvote.count({
                where: { postId },
            })

            return NextResponse.json({
                success: true,
                data: { upvoted: true, count },
            })
        }
    } catch (error) {
        console.error('Post upvote error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to toggle upvote' },
            { status: 500 }
        )
    }
}
