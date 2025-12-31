import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/social/posts - Get social feed (own posts + following)
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit
        const feedType = searchParams.get('type') || 'following' // 'following' | 'explore'

        // Get IDs of users the current user follows
        const following = await prisma.follow.findMany({
            where: { followerId: user.id },
            select: { followingId: true },
        })
        const followingIds = following.map(f => f.followingId)

        // Build where clause based on feed type
        const where = feedType === 'explore'
            ? {} // Show all posts for explore
            : {
                OR: [
                    { authorId: user.id }, // Own posts
                    { authorId: { in: followingIds } }, // Following posts
                ],
            }

        const [posts, total] = await Promise.all([
            prisma.socialPost.findMany({
                where,
                orderBy: { createdAt: 'desc' },
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
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
            }),
            prisma.socialPost.count({ where }),
        ])

        // Transform posts to include isLiked flag
        const transformedPosts = posts.map(post => ({
            ...post,
            isLiked: post.likes.length > 0,
            likes: undefined, // Remove raw likes array
            images: post.images ? JSON.parse(post.images) : [],
        }))

        return NextResponse.json({
            success: true,
            data: transformedPosts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Social feed fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch feed' },
            { status: 500 }
        )
    }
}

// POST /api/social/posts - Create a new social post
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
        const { content, images, dogIds } = body

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Content is required' },
                { status: 400 }
            )
        }

        if (content.length > 2000) {
            return NextResponse.json(
                { success: false, error: 'Content must be 2000 characters or less' },
                { status: 400 }
            )
        }

        // Validate dogIds belong to the user
        if (dogIds && dogIds.length > 0) {
            const userDogs = await prisma.dog.findMany({
                where: {
                    id: { in: dogIds },
                    ownerId: user.id,
                },
                select: { id: true },
            })

            if (userDogs.length !== dogIds.length) {
                return NextResponse.json(
                    { success: false, error: 'One or more tagged dogs do not belong to you' },
                    { status: 400 }
                )
            }
        }

        const post = await prisma.socialPost.create({
            data: {
                content: content.trim(),
                images: images && images.length > 0 ? JSON.stringify(images) : null,
                authorId: user.id,
                taggedDogs: dogIds && dogIds.length > 0
                    ? {
                        create: dogIds.map((dogId: string) => ({
                            dogId,
                        })),
                    }
                    : undefined,
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
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: {
                ...post,
                isLiked: false,
                images: post.images ? JSON.parse(post.images) : [],
            },
        }, { status: 201 })
    } catch (error) {
        console.error('Social post creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create post' },
            { status: 500 }
        )
    }
}
