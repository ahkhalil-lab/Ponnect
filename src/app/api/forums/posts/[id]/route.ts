import { NextResponse } from 'next/server'
import { getCurrentUser, canModerate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        const post = await prisma.forumPost.findUnique({
            where: { id },
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
                category: true,
                _count: {
                    select: {
                        comments: true,
                        upvotes: true,
                    },
                },
                upvotes: user ? {
                    where: { userId: user.id },
                    select: { id: true },
                } : false,
            },
        })

        if (!post || post.isDeleted) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            )
        }

        // Increment view count
        await prisma.forumPost.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        })

        return NextResponse.json({
            success: true,
            data: {
                ...post,
                hasUpvoted: user ? post.upvotes.length > 0 : false,
                upvotes: undefined,
            },
        })
    } catch (error) {
        console.error('Forum post fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch post' },
            { status: 500 }
        )
    }
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

        const post = await prisma.forumPost.findUnique({
            where: { id },
        })

        if (!post || post.isDeleted) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            )
        }

        // Only author can edit
        if (post.authorId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { title, content, images } = body

        const updated = await prisma.forumPost.update({
            where: { id },
            data: {
                title: title?.trim() || post.title,
                content: content?.trim() || post.content,
                images: images !== undefined ? JSON.stringify(images) : post.images,
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
                category: true,
            },
        })

        return NextResponse.json({
            success: true,
            data: updated,
        })
    } catch (error) {
        console.error('Forum post update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update post' },
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

        const post = await prisma.forumPost.findUnique({
            where: { id },
        })

        if (!post) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            )
        }

        // Author or moderator can delete
        if (post.authorId !== user.id && !canModerate(user)) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            )
        }

        // Soft delete
        await prisma.forumPost.update({
            where: { id },
            data: { isDeleted: true },
        })

        return NextResponse.json({
            success: true,
            message: 'Post deleted',
        })
    } catch (error) {
        console.error('Forum post delete error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete post' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        if (!canModerate(user)) {
            return NextResponse.json(
                { success: false, error: 'Not authorized - moderator access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { isPinned, isClosed } = body

        const updated = await prisma.forumPost.update({
            where: { id },
            data: {
                ...(isPinned !== undefined && { isPinned }),
                ...(isClosed !== undefined && { isClosed }),
            },
        })

        return NextResponse.json({
            success: true,
            data: updated,
        })
    } catch (error) {
        console.error('Forum post moderate error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to moderate post' },
            { status: 500 }
        )
    }
}
