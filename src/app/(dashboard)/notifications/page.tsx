'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    link: string | null
    isRead: boolean
    createdAt: string
}

const NOTIFICATION_TYPES = [
    { value: 'all', label: 'All', icon: '📬' },
    { value: 'FORUM_REPLY', label: 'Forum', icon: '💬' },
    { value: 'EVENT_REMINDER', label: 'Events', icon: '📅' },
    { value: 'HEALTH_REMINDER', label: 'Health', icon: '🏥' },
    { value: 'EXPERT_ANSWER', label: 'Expert Q&A', icon: '🩺' },
    { value: 'SYSTEM', label: 'System', icon: '⚙️' },
]

export default function NotificationsPage() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                if (filter !== 'all') params.set('type', filter)

                const res = await fetch(`/api/notifications?${params}`)
                const data = await res.json()

                if (res.status === 401) {
                    router.push('/login')
                    return
                }

                if (data.success) {
                    setNotifications(data.data)
                    setUnreadCount(data.unreadCount)
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchNotifications()
    }, [filter, router])

    const handleMarkAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRead: true }),
            })

            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                )
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error('Mark as read error:', error)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            const res = await fetch('/api/notifications/read-all', {
                method: 'POST',
            })

            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
                setUnreadCount(0)
            }
        } catch (error) {
            console.error('Mark all as read error:', error)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                const notification = notifications.find(n => n.id === id)
                setNotifications(prev => prev.filter(n => n.id !== id))
                if (notification && !notification.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1))
                }
            }
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await handleMarkAsRead(notification.id)
        }
        if (notification.link) {
            router.push(notification.link)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / (1000 * 60))
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`
        return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
    }

    const getTypeIcon = (type: string) => {
        const found = NOTIFICATION_TYPES.find(t => t.value === type)
        return found?.icon || '📬'
    }

    // Group notifications by date
    const groupedNotifications = notifications.reduce((acc, notification) => {
        const date = new Date(notification.createdAt)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        let key: string
        if (date.toDateString() === today.toDateString()) {
            key = 'Today'
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = 'Yesterday'
        } else {
            key = date.toLocaleDateString('en-AU', { month: 'long', day: 'numeric' })
        }

        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(notification)
        return acc
    }, {} as Record<string, Notification[]>)

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading notifications...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Notifications</h1>
                    <p className={styles.subtitle}>
                        {unreadCount > 0
                            ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                            : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="btn btn-outline"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
                {NOTIFICATION_TYPES.map((type) => (
                    <button
                        key={type.value}
                        onClick={() => setFilter(type.value)}
                        className={`${styles.filterTab} ${filter === type.value ? styles.active : ''}`}
                    >
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <div className={styles.emptyIcon}>🔔</div>
                    <h2>No Notifications</h2>
                    <p>You&apos;re all caught up! Check back later for updates.</p>
                </div>
            ) : (
                <div className={styles.notificationsList}>
                    {Object.entries(groupedNotifications).map(([date, items]) => (
                        <div key={date} className={styles.dateGroup}>
                            <h3 className={styles.dateLabel}>{date}</h3>
                            {items.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`card ${styles.notificationCard} ${!notification.isRead ? styles.unread : ''}`}
                                >
                                    <div
                                        className={styles.notificationMain}
                                        onClick={() => handleNotificationClick(notification)}
                                        style={{ cursor: notification.link ? 'pointer' : 'default' }}
                                    >
                                        <span className={styles.typeIcon}>
                                            {getTypeIcon(notification.type)}
                                        </span>
                                        <div className={styles.notificationContent}>
                                            <div className={styles.notificationHeader}>
                                                <strong>{notification.title}</strong>
                                                <span className={styles.notificationTime}>
                                                    {formatDate(notification.createdAt)}
                                                </span>
                                            </div>
                                            <p className={styles.notificationMessage}>
                                                {notification.message}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <span className={styles.unreadDot}></span>
                                        )}
                                    </div>
                                    <div className={styles.notificationActions}>
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className="btn btn-sm btn-ghost"
                                            >
                                                Mark read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notification.id)}
                                            className="btn btn-sm btn-ghost"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Settings Link */}
            <div className={styles.settingsLink}>
                <Link href="/settings/notifications" className="btn btn-ghost">
                    ⚙️ Notification Settings
                </Link>
            </div>
        </div>
    )
}
