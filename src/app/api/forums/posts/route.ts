import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const search = searchParams.get('search')
        const sort = searchParams.get('sort') || 'latest'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {
            isDeleted: false,
        }

        if (category) {
            where.category = { slug: category }
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { content: { contains: search } },
            ]
        }

        const orderBy: Record<string, string> = sort === 'popular'
            ? { viewCount: 'desc' }
            : { createdAt: 'desc' }

        const [posts, total] = await Promise.all([
            prisma.forumPost.findMany({
                where,
                orderBy: [
                    { isPinned: 'desc' },
                    orderBy,
                ],
                skip,
                take: limit,
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
                    _count: {
                        select: {
                            comments: true,
                            upvotes: true,
                        },
                    },
                },
            }),
            prisma.forumPost.count({ where }),
        ])

        return NextResponse.json({
            success: true,
            data: posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Forum posts fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch posts' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { title, content, categoryId, images } = body

        if (!title || title.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Title is required' },
                { status: 400 }
            )
        }

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Content is required' },
                { status: 400 }
            )
        }

        if (!categoryId) {
            return NextResponse.json(
                { success: false, error: 'Category is required' },
                { status: 400 }
            )
        }

        // Verify category exists
        const category = await prisma.forumCategory.findUnique({
            where: { id: categoryId },
        })

        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Invalid category' },
                { status: 400 }
            )
        }

        const post = await prisma.forumPost.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                images: images ? JSON.stringify(images) : null,
                authorId: user.id,
                categoryId,
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
            data: post,
        }, { status: 201 })
    } catch (error) {
        console.error('Forum post creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create post' },
            { status: 500 }
        )
    }
}
