import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/community/members/[id] - Get public member profile
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

        const member = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                avatar: true,
                bio: true,
                location: true,
                role: true,
                expertType: true,
                credentials: true,
                isVerified: true,
                createdAt: true,
                dogs: {
                    select: {
                        id: true,
                        name: true,
                        photo: true,
                        breed: true,
                        gender: true,
                        birthDate: true,
                    },
                },
                _count: {
                    select: {
                        dogs: true,
                        posts: true,
                        socialPosts: true,
                    },
                },
            },
        })

        if (!member) {
            return NextResponse.json(
                { success: false, error: 'Member not found' },
                { status: 404 }
            )
        }

        // Get follow relationships
        const [isFollowing, followerCount, followingCount] = await Promise.all([
            prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: user.id,
                        followingId: id,
                    },
                },
            }),
            prisma.follow.count({ where: { followingId: id } }),
            prisma.follow.count({ where: { followerId: id } }),
        ])

        // Get recent social posts
        const recentPosts = await prisma.socialPost.findMany({
            where: { authorId: id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                taggedDogs: {
                    include: {
                        dog: {
                            select: {
                                id: true,
                                name: true,
                                photo: true,
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
                ...member,
                isFollowing: !!isFollowing,
                isCurrentUser: id === user.id,
                followerCount,
                followingCount,
                recentPosts: recentPosts.map(post => ({
                    ...post,
                    images: post.images ? JSON.parse(post.images) : [],
                })),
            },
        })
    } catch (error) {
        console.error('Member profile fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch member profile' },
            { status: 500 }
        )
    }
}
