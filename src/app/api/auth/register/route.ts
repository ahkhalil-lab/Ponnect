import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/utils'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password, name, location } = body

        // Validate required fields
        if (!email || !password || !name) {
            return NextResponse.json(
                { success: false, error: 'Email, password, and name are required' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Validate password strength
        if (password.length < 8) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'An account with this email already exists' },
                { status: 409 }
            )
        }

        // Hash password
        const passwordHash = await hashPassword(password)

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                name,
                location: location || null,
                role: 'USER',
                isVerified: false,
                isEmailVerified: false,
            },
            select: {
                id: true,
                email: true,
                name: true,
                location: true,
                role: true,
                createdAt: true,
            }
        })

        return NextResponse.json(
            {
                success: true,
                data: user,
                message: 'Account created successfully. Please verify your email.'
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Registration error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : undefined
        console.error('Error details:', { message: errorMessage, stack: errorStack })
        return NextResponse.json(
            { success: false, error: 'An error occurred during registration', details: errorMessage },
            { status: 500 }
        )
    }
}
