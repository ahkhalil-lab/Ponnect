import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/social/posts/[id]/like - Toggle like on a post
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { id: postId } = await params

        // Check post exists
        const post = await prisma.socialPost.findUnique({
            where: { id: postId },
            select: { id: true },
        })

        if (!post) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            )
        }

        // Check if already liked
        const existingLike = await prisma.socialLike.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId: user.id,
                },
            },
        })

        if (existingLike) {
            // Unlike
            await prisma.socialLike.delete({
                where: { id: existingLike.id },
            })

            const likeCount = await prisma.socialLike.count({
                where: { postId },
            })

            return NextResponse.json({
                success: true,
                data: {
                    isLiked: false,
                    likeCount,
                },
            })
        } else {
            // Like
            await prisma.socialLike.create({
                data: {
                    postId,
                    userId: user.id,
                },
            })

            const likeCount = await prisma.socialLike.count({
                where: { postId },
            })

            return NextResponse.json({
                success: true,
                data: {
                    isLiked: true,
                    likeCount,
                },
            })
        }
    } catch (error) {
        console.error('Like toggle error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to toggle like' },
            { status: 500 }
        )
    }
}
