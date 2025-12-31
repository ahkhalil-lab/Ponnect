import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/users/[id]/follow - Toggle follow on a user
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { id: targetUserId } = await params

        // Can't follow yourself
        if (targetUserId === user.id) {
            return NextResponse.json(
                { success: false, error: 'Cannot follow yourself' },
                { status: 400 }
            )
        }

        // Check target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, name: true },
        })

        if (!targetUser) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            )
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: user.id,
                    followingId: targetUserId,
                },
            },
        })

        if (existingFollow) {
            // Unfollow
            await prisma.follow.delete({
                where: { id: existingFollow.id },
            })

            const followerCount = await prisma.follow.count({
                where: { followingId: targetUserId },
            })

            return NextResponse.json({
                success: true,
                data: {
                    isFollowing: false,
                    followerCount,
                },
            })
        } else {
            // Follow
            await prisma.follow.create({
                data: {
                    followerId: user.id,
                    followingId: targetUserId,
                },
            })

            const followerCount = await prisma.follow.count({
                where: { followingId: targetUserId },
            })

            return NextResponse.json({
                success: true,
                data: {
                    isFollowing: true,
                    followerCount,
                },
            })
        }
    } catch (error) {
        console.error('Follow toggle error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to toggle follow' },
            { status: 500 }
        )
    }
}

// GET /api/users/[id]/follow - Check if current user follows this user
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { id: targetUserId } = await params

        const [follow, followerCount, followingCount] = await Promise.all([
            prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: user.id,
                        followingId: targetUserId,
                    },
                },
            }),
            prisma.follow.count({
                where: { followingId: targetUserId },
            }),
            prisma.follow.count({
                where: { followerId: targetUserId },
            }),
        ])

        return NextResponse.json({
            success: true,
            data: {
                isFollowing: !!follow,
                followerCount,
                followingCount,
            },
        })
    } catch (error) {
        console.error('Follow status error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to get follow status' },
            { status: 500 }
        )
    }
}
