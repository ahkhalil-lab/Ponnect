import { NextResponse } from 'next/server'
import { getCurrentUser, ROLES, EXPERT_TYPES } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Check if already an expert
        if (user.role === ROLES.EXPERT || user.role === ROLES.ADMIN) {
            return NextResponse.json(
                { success: false, error: 'You are already registered as an expert' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { expertType, credentials } = body

        // Validate expert type
        const validTypes = Object.values(EXPERT_TYPES)
        if (!expertType || !validTypes.includes(expertType)) {
            return NextResponse.json(
                { success: false, error: 'Please select a valid expert type' },
                { status: 400 }
            )
        }

        // Validate credentials
        if (!credentials || credentials.trim().length < 20) {
            return NextResponse.json(
                { success: false, error: 'Please provide detailed credentials (at least 20 characters)' },
                { status: 400 }
            )
        }

        if (credentials.length > 1000) {
            return NextResponse.json(
                { success: false, error: 'Credentials must be less than 1000 characters' },
                { status: 400 }
            )
        }

        // Update user to pending expert status
        // In a real app, this would go to a moderation queue
        // For demo purposes, we set role to EXPERT but isVerified to false
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                role: ROLES.EXPERT,
                expertType: expertType,
                credentials: credentials.trim(),
                isVerified: false, // Needs admin verification
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                expertType: true,
                isVerified: true,
            },
        })

        return NextResponse.json({
            success: true,
            data: updatedUser,
            message: 'Your application has been submitted. Our team will review your credentials.'
        })
    } catch (error) {
        console.error('Expert application error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to submit application' },
            { status: 500 }
        )
    }
}
