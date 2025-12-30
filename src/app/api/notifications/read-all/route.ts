import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        await prisma.notification.updateMany({
            where: {
                userId: user.id,
                isRead: false,
            },
            data: { isRead: true },
        })

        return NextResponse.json({
            success: true,
            message: 'All notifications marked as read',
        })
    } catch (error) {
        console.error('Mark all read error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to mark notifications as read' },
            { status: 500 }
        )
    }
}
