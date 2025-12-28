import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'ponnect-secret-key-change-in-production'
)

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Verify JWT token
        const { payload } = await jwtVerify(token, JWT_SECRET)
        const userId = payload.userId as string

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: user,
        })
    } catch (error) {
        console.error('Auth check error:', error)
        return NextResponse.json(
            { success: false, error: 'Invalid or expired token' },
            { status: 401 }
        )
    }
}
