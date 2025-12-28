import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Get user with their dogs
        const fullProfile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                name: true,
                bio: true,
                location: true,
                avatar: true,
                role: true,
                expertType: true,
                credentials: true,
                isVerified: true,
                isEmailVerified: true,
                createdAt: true,
                dogs: {
                    select: {
                        id: true,
                        name: true,
                        breed: true,
                        birthDate: true,
                        gender: true,
                        photo: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        posts: true,
                        dogs: true,
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: fullProfile,
        })
    } catch (error) {
        console.error('Profile fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch profile' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { name, bio, location, avatar } = body

        // Validate required fields
        if (!name || name.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Name is required' },
                { status: 400 }
            )
        }

        if (name.length > 100) {
            return NextResponse.json(
                { success: false, error: 'Name must be less than 100 characters' },
                { status: 400 }
            )
        }

        if (bio && bio.length > 500) {
            return NextResponse.json(
                { success: false, error: 'Bio must be less than 500 characters' },
                { status: 400 }
            )
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: name.trim(),
                bio: bio?.trim() || null,
                location: location?.trim() || null,
                avatar: avatar || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                bio: true,
                location: true,
                avatar: true,
                role: true,
                expertType: true,
                isVerified: true,
                createdAt: true,
            },
        })

        return NextResponse.json({
            success: true,
            data: updatedUser,
        })
    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update profile' },
            { status: 500 }
        )
    }
}
