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

        const count = await prisma.notification.count({
            where: {
                userId: user.id,
                isRead: false,
            },
        })

        return NextResponse.json({
            success: true,
            data: { count },
        })
    } catch (error) {
        console.error('Notification count error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to get notification count' },
            { status: 500 }
        )
    }
}
