import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/social/posts/[id]/comments - Get comments for a post
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { id: postId } = await params

        const comments = await prisma.socialComment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
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
            data: comments,
        })
    } catch (error) {
        console.error('Comments fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch comments' },
            { status: 500 }
        )
    }
}

// POST /api/social/posts/[id]/comments - Add a comment to a post
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
        const body = await request.json()
        const { content, parentId } = body

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Comment content is required' },
                { status: 400 }
            )
        }

        if (content.length > 1000) {
            return NextResponse.json(
                { success: false, error: 'Comment must be 1000 characters or less' },
                { status: 400 }
            )
        }

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

        const comment = await prisma.socialComment.create({
            data: {
                content: content.trim(),
                postId,
                authorId: user.id,
                parentId: parentId || null,
            },
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
