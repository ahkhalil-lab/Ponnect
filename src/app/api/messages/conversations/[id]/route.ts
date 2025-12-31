import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/messages/conversations/[id] - Get messages in a conversation
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { id: conversationId } = await params
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        // Verify user is part of this conversation
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: user.id,
                },
            },
        })

        if (!participant) {
            return NextResponse.json(
                { success: false, error: 'Conversation not found' },
                { status: 404 }
            )
        }

        // Get conversation with other participant info
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        })

        // Get messages (newest first for pagination, then reverse for display)
        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
            }),
            prisma.message.count({ where: { conversationId } }),
        ])

        // Mark unread messages as read
        await prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: user.id },
                isRead: false,
            },
            data: { isRead: true },
        })

        const otherParticipant = conversation?.participants.find(p => p.userId !== user.id)?.user

        return NextResponse.json({
            success: true,
            data: {
                conversationId,
                otherUser: otherParticipant,
                messages: messages.reverse().map(msg => ({
                    ...msg,
                    isOwn: msg.senderId === user.id,
                })),
            },
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Messages fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch messages' },
            { status: 500 }
        )
    }
}

// POST /api/messages/conversations/[id] - Send a message
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { id: conversationId } = await params
        const body = await request.json()
        const { content } = body

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Message content is required' },
                { status: 400 }
            )
        }

        if (content.length > 2000) {
            return NextResponse.json(
                { success: false, error: 'Message must be 2000 characters or less' },
                { status: 400 }
            )
        }

        // Verify user is part of this conversation
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: user.id,
                },
            },
        })

        if (!participant) {
            return NextResponse.json(
                { success: false, error: 'Conversation not found' },
                { status: 404 }
            )
        }

        // Create message and update conversation timestamp
        const [message] = await prisma.$transaction([
            prisma.message.create({
                data: {
                    conversationId,
                    senderId: user.id,
                    content: content.trim(),
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
            }),
            prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() },
            }),
        ])

        return NextResponse.json({
            success: true,
            data: {
                ...message,
                isOwn: true,
            },
        }, { status: 201 })
    } catch (error) {
        console.error('Message send error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to send message' },
            { status: 500 }
        )
    }
}
