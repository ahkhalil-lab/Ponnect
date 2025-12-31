import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/community/dogs/[id] - Get public dog profile
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

        const dog = await prisma.dog.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        bio: true,
                        location: true,
                        role: true,
                        isVerified: true,
                        createdAt: true,
                        _count: {
                            select: {
                                dogs: true,
                                posts: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        healthRecords: true,
                    },
                },
            },
        })

        if (!dog) {
            return NextResponse.json(
                { success: false, error: 'Dog not found' },
                { status: 404 }
            )
        }

        // Check if current user follows the owner
        const isFollowing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: user.id,
                    followingId: dog.owner.id,
                },
            },
        })

        // Get follower count for the owner
        const ownerFollowerCount = await prisma.follow.count({
            where: { followingId: dog.owner.id },
        })

        // Calculate age
        let age = null
        if (dog.birthDate) {
            const birth = new Date(dog.birthDate)
            const today = new Date()
            const years = today.getFullYear() - birth.getFullYear()
            const months = today.getMonth() - birth.getMonth()
            age = { years, months: months < 0 ? months + 12 : months }
        }

        return NextResponse.json({
            success: true,
            data: {
                ...dog,
                age,
                owner: {
                    ...dog.owner,
                    isFollowing: !!isFollowing,
                    followerCount: ownerFollowerCount,
                },
                isOwnDog: dog.ownerId === user.id,
            },
        })
    } catch (error) {
        console.error('Dog profile fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dog profile' },
            { status: 500 }
        )
    }
}
