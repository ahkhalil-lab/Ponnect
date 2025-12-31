'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import styles from './page.module.css'

interface Conversation {
    id: string
    otherUser: {
        id: string
        name: string
        avatar: string | null
    } | null
    lastMessage: {
        id: string
        content: string
        senderId: string
        senderName: string
        createdAt: string
        isOwn: boolean
    } | null
    unreadCount: number
    updatedAt: string
}

interface Message {
    id: string
    content: string
    senderId: string
    sender: {
        id: string
        name: string
        avatar: string | null
    }
    isOwn: boolean
    isRead: boolean
    createdAt: string
}

export default function MessagesPage() {
    const searchParams = useSearchParams()
    const startWithUserId = searchParams.get('start')

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [otherUser, setOtherUser] = useState<{ id: string; name: string; avatar: string | null } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)
    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/messages/conversations')
            const data = await res.json()
            if (data.success) {
                setConversations(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const fetchMessages = useCallback(async (conversationId: string) => {
        try {
            setIsLoadingMessages(true)
            const res = await fetch(`/api/messages/conversations/${conversationId}`)
            const data = await res.json()
            if (data.success) {
                setMessages(data.data.messages)
                setOtherUser(data.data.otherUser)
                // Update conversation's unread count locally
                setConversations(prev => prev.map(c =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                ))
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        } finally {
            setIsLoadingMessages(false)
        }
    }, [])

    const startConversation = useCallback(async (recipientId: string) => {
        try {
            const res = await fetch('/api/messages/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientId }),
            })
            const data = await res.json()
            if (data.success) {
                setActiveConversationId(data.data.id)
                setOtherUser(data.data.otherUser)
                if (!data.data.isNew) {
                    fetchMessages(data.data.id)
                } else {
                    setMessages([])
                }
                // Refresh conversations list
                fetchConversations()
            }
        } catch (error) {
            console.error('Failed to start conversation:', error)
        }
    }, [fetchConversations, fetchMessages])

    useEffect(() => {
        fetchConversations()
    }, [fetchConversations])

    useEffect(() => {
        if (startWithUserId && !isLoading) {
            startConversation(startWithUserId)
        }
    }, [startWithUserId, isLoading, startConversation])

    useEffect(() => {
        if (activeConversationId) {
            fetchMessages(activeConversationId)

            // Set up polling for new messages
            pollIntervalRef.current = setInterval(() => {
                fetchMessages(activeConversationId)
            }, 5000) // Poll every 5 seconds
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
            }
        }
    }, [activeConversationId, fetchMessages])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeConversationId || isSending) return

        const messageContent = newMessage.trim()
        setNewMessage('')
        setIsSending(true)

        try {
            const res = await fetch(`/api/messages/conversations/${activeConversationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: messageContent }),
            })
            const data = await res.json()
            if (data.success) {
                setMessages(prev => [...prev, data.data])
                // Update conversation preview
                setConversations(prev => prev.map(c =>
                    c.id === activeConversationId
                        ? {
                            ...c,
                            lastMessage: {
                                id: data.data.id,
                                content: messageContent,
                                senderId: data.data.senderId,
                                senderName: 'You',
                                createdAt: data.data.createdAt,
                                isOwn: true,
                            },
                            updatedAt: new Date().toISOString(),
                        }
                        : c
                ))
            }
        } catch (error) {
            console.error('Failed to send message:', error)
            setNewMessage(messageContent) // Restore on failure
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (hours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        if (days < 7) {
            return `${days}d ago`
        }
        return date.toLocaleDateString()
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading messages...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            {/* Conversation List */}
            <div className={`${styles.conversationList} ${activeConversationId ? styles.conversationListHidden : ''}`}>
                <div className={styles.conversationHeader}>
                    <h2>Messages</h2>
                </div>
                <div className={styles.conversations}>
                    {conversations.length === 0 ? (
                        <div className={styles.emptyConversations}>
                            <div className={styles.emptyIcon}>💬</div>
                            <p>No conversations yet</p>
                            <p style={{ fontSize: '0.8rem' }}>Start chatting with other dog parents!</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`${styles.conversationItem} ${activeConversationId === conv.id ? styles.conversationItemActive : ''}`}
                                onClick={() => setActiveConversationId(conv.id)}
                            >
                                <div className={styles.conversationAvatar}>
                                    {conv.otherUser?.avatar ? (
                                        <img src={conv.otherUser.avatar} alt="" />
                                    ) : (
                                        conv.otherUser?.name[0]?.toUpperCase() || '?'
                                    )}
                                </div>
                                <div className={styles.conversationInfo}>
                                    <h4 className={styles.conversationName}>
                                        {conv.otherUser?.name || 'Unknown'}
                                    </h4>
                                    {conv.lastMessage && (
                                        <p className={styles.conversationPreview}>
                                            {conv.lastMessage.isOwn ? 'You: ' : ''}{conv.lastMessage.content}
                                        </p>
                                    )}
                                </div>
                                <div className={styles.conversationMeta}>
                                    {conv.lastMessage && (
                                        <span className={styles.conversationTime}>
                                            {formatTime(conv.lastMessage.createdAt)}
                                        </span>
                                    )}
                                    {conv.unreadCount > 0 && (
                                        <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={styles.chatArea}>
                {activeConversationId && otherUser ? (
                    <>
                        <div className={styles.chatHeader}>
                            <div className={styles.chatHeaderAvatar}>
                                {otherUser.avatar ? (
                                    <img src={otherUser.avatar} alt="" />
                                ) : (
                                    otherUser.name[0]?.toUpperCase()
                                )}
                            </div>
                            <div className={styles.chatHeaderInfo}>
                                <h3 className={styles.chatHeaderName}>{otherUser.name}</h3>
                                <Link href={`/community/members/${otherUser.id}`} className={styles.chatHeaderLink}>
                                    View Profile
                                </Link>
                            </div>
                        </div>

                        <div className={styles.messages}>
                            {isLoadingMessages ? (
                                <div className={styles.loading}>
                                    <div className="spinner"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className={styles.noConversation}>
                                    <p>No messages yet. Say hi! 👋</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`${styles.message} ${msg.isOwn ? styles.messageOwn : styles.messageOther}`}
                                    >
                                        {!msg.isOwn && (
                                            <div className={styles.messageAvatar}>
                                                {msg.sender.avatar ? (
                                                    <img src={msg.sender.avatar} alt="" />
                                                ) : (
                                                    msg.sender.name[0]?.toUpperCase()
                                                )}
                                            </div>
                                        )}
                                        <div>
                                            <div className={styles.messageBubble}>{msg.content}</div>
                                            <div className={styles.messageTime}>{formatTime(msg.createdAt)}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className={styles.composer}>
                            <textarea
                                className={styles.composerInput}
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || isSending}
                            >
                                {isSending ? '...' : 'Send'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.noConversation}>
                        <div className={styles.emptyIcon}>💬</div>
                        <h3>Select a conversation</h3>
                        <p>Choose from your existing conversations or start a new one from a member&apos;s profile</p>
                    </div>
                )}
            </div>
        </div>
    )
}
