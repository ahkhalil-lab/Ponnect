import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/messages/conversations - List user's conversations
export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Get all conversations the user is part of
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: user.id },
                },
            },
            orderBy: { updatedAt: 'desc' },
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
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Get only the last message for preview
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        })

        // Get unread counts for each conversation
        const unreadCounts = await prisma.message.groupBy({
            by: ['conversationId'],
            where: {
                senderId: { not: user.id },
                isRead: false,
                conversationId: { in: conversations.map(c => c.id) },
            },
            _count: { id: true },
        })

        const unreadMap = new Map(unreadCounts.map(u => [u.conversationId, u._count.id]))

        // Transform conversations
        const transformedConversations = conversations.map(conv => {
            // Get the other participant (for 1:1 conversations)
            const otherParticipant = conv.participants.find(p => p.userId !== user.id)?.user
            const lastMessage = conv.messages[0] || null

            return {
                id: conv.id,
                otherUser: otherParticipant,
                lastMessage: lastMessage ? {
                    id: lastMessage.id,
                    content: lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : ''),
                    senderId: lastMessage.senderId,
                    senderName: lastMessage.sender.name,
                    createdAt: lastMessage.createdAt,
                    isOwn: lastMessage.senderId === user.id,
                } : null,
                unreadCount: unreadMap.get(conv.id) || 0,
                updatedAt: conv.updatedAt,
            }
        })

        return NextResponse.json({
            success: true,
            data: transformedConversations,
        })
    } catch (error) {
        console.error('Conversations fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch conversations' },
            { status: 500 }
        )
    }
}

// POST /api/messages/conversations - Start a new conversation
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { recipientId, message } = body

        if (!recipientId) {
            return NextResponse.json(
                { success: false, error: 'Recipient is required' },
                { status: 400 }
            )
        }

        if (recipientId === user.id) {
            return NextResponse.json(
                { success: false, error: 'Cannot message yourself' },
                { status: 400 }
            )
        }

        // Check recipient exists
        const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
            select: { id: true, name: true, avatar: true },
        })

        if (!recipient) {
            return NextResponse.json(
                { success: false, error: 'Recipient not found' },
                { status: 404 }
            )
        }

        // Check if conversation already exists between these users
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: user.id } } },
                    { participants: { some: { userId: recipientId } } },
                ],
            },
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

        if (existingConversation) {
            // Return existing conversation
            return NextResponse.json({
                success: true,
                data: {
                    id: existingConversation.id,
                    otherUser: recipient,
                    isNew: false,
                },
            })
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: user.id },
                        { userId: recipientId },
                    ],
                },
                messages: message ? {
                    create: {
                        content: message,
                        senderId: user.id,
                    },
                } : undefined,
            },
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

        return NextResponse.json({
            success: true,
            data: {
                id: conversation.id,
                otherUser: recipient,
                isNew: true,
            },
        }, { status: 201 })
    } catch (error) {
        console.error('Conversation creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create conversation' },
            { status: 500 }
        )
    }
}
