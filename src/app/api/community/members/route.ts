import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/community/members - Browse all dog parents with filters
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
        const location = searchParams.get('location')
        const search = searchParams.get('search')
        const hasDogsOnly = searchParams.get('hasDogsOnly') === 'true'

        // Build where clause with filters
        const where: Record<string, unknown> = {}

        if (location) {
            where.location = { contains: location }
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { bio: { contains: search } },
            ]
        }

        if (hasDogsOnly) {
            where.dogs = { some: {} }
        }

        const [members, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                    bio: true,
                    location: true,
                    role: true,
                    isVerified: true,
                    createdAt: true,
                    dogs: {
                        take: 3, // Show first 3 dogs
                        select: {
                            id: true,
                            name: true,
                            photo: true,
                            breed: true,
                        },
                    },
                    _count: {
                        select: {
                            dogs: true,
                            socialPosts: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ])

        // Get follow status for each member
        const followingIds = await prisma.follow.findMany({
            where: {
                followerId: user.id,
                followingId: { in: members.map(m => m.id) },
            },
            select: { followingId: true },
        })
        const followingSet = new Set(followingIds.map(f => f.followingId))

        const membersWithFollowStatus = members.map(member => ({
            ...member,
            isFollowing: followingSet.has(member.id),
            isCurrentUser: member.id === user.id,
        }))

        // Get unique locations for filter dropdown
        const locations = await prisma.user.findMany({
            where: { location: { not: null } },
            select: { location: true },
            distinct: ['location'],
            orderBy: { location: 'asc' },
        })

        return NextResponse.json({
            success: true,
            data: membersWithFollowStatus,
            filters: {
                locations: locations.map(l => l.location).filter(Boolean),
            },
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Community members fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch members' },
            { status: 500 }
        )
    }
}
