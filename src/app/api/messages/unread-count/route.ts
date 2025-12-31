import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/messages/unread-count - Get total unread message count
export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Get conversations the user is part of
        const userConversations = await prisma.conversationParticipant.findMany({
            where: { userId: user.id },
            select: { conversationId: true },
        })

        const conversationIds = userConversations.map(c => c.conversationId)

        // Count unread messages in those conversations (not sent by user)
        const unreadCount = await prisma.message.count({
            where: {
                conversationId: { in: conversationIds },
                senderId: { not: user.id },
                isRead: false,
            },
        })

        return NextResponse.json({
            success: true,
            data: { count: unreadCount },
        })
    } catch (error) {
        console.error('Unread count error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to get unread count' },
            { status: 500 }
        )
    }
}
