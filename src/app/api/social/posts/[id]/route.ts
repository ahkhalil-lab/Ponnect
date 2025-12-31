import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/social/posts/[id] - Get a single post with comments
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { id } = await params

        const post = await prisma.socialPost.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                        bio: true,
                        location: true,
                    },
                },
                taggedDogs: {
                    include: {
                        dog: {
                            select: {
                                id: true,
                                name: true,
                                photo: true,
                                breed: true,
                            },
                        },
                    },
                },
                likes: {
                    where: { userId: user.id },
                    select: { id: true },
                },
                comments: {
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
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        })

        if (!post) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                ...post,
                isLiked: post.likes.length > 0,
                likes: undefined,
                images: post.images ? JSON.parse(post.images) : [],
            },
        })
    } catch (error) {
        console.error('Social post fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch post' },
            { status: 500 }
        )
    }
}

// DELETE /api/social/posts/[id] - Delete a post
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { id } = await params

        const post = await prisma.socialPost.findUnique({
            where: { id },
            select: { authorId: true },
        })

        if (!post) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            )
        }

        if (post.authorId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Not authorized to delete this post' },
                { status: 403 }
            )
        }

        await prisma.socialPost.delete({
            where: { id },
        })

        return NextResponse.json({
            success: true,
            message: 'Post deleted successfully',
        })
    } catch (error) {
        console.error('Social post delete error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete post' },
            { status: 500 }
        )
    }
}
