import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: postId } = await params
        const user = await getCurrentUser()

        const comments = await prisma.comment.findMany({
            where: {
                postId,
                isDeleted: false,
            },
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                        expertType: true,
                        isVerified: true,
                    },
                },
                _count: {
                    select: { upvotes: true },
                },
                upvotes: user ? {
                    where: { userId: user.id },
                    select: { id: true },
                } : false,
            },
        })

        // Transform to include hasUpvoted
        const transformedComments = comments.map(comment => ({
            ...comment,
            hasUpvoted: user ? comment.upvotes.length > 0 : false,
            upvotes: undefined,
        }))

        return NextResponse.json({
            success: true,
            data: transformedComments,
        })
    } catch (error) {
        console.error('Comments fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch comments' },
            { status: 500 }
        )
    }
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

        // Verify post exists and is not closed
        const post = await prisma.forumPost.findUnique({
            where: { id: postId },
        })

        if (!post || post.isDeleted) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            )
        }

        if (post.isClosed) {
            return NextResponse.json(
                { success: false, error: 'This thread is closed' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { content, parentId } = body

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Comment content is required' },
                { status: 400 }
            )
        }

        // If replying, verify parent comment exists
        if (parentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: parentId },
            })
            if (!parent || parent.postId !== postId) {
                return NextResponse.json(
                    { success: false, error: 'Invalid parent comment' },
                    { status: 400 }
                )
            }
        }

        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                authorId: user.id,
                postId,
                parentId: parentId || null,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                        expertType: true,
                        isVerified: true,
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: comment,
        }, { status: 201 })
    } catch (error) {
        console.error('Comment creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create comment' },
            { status: 500 }
        )
    }
}
