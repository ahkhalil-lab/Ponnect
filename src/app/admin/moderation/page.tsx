'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

interface ModerationItem {
    id: string
    title?: string
    content?: string
    description?: string
    createdAt: string
    author?: { id: string; name: string; email: string }
    creator?: { id: string; name: string; email: string }
    category?: { name: string }
}

export default function AdminModerationPage() {
    const [posts, setPosts] = useState<ModerationItem[]>([])
    const [events, setEvents] = useState<ModerationItem[]>([])
    const [activeTab, setActiveTab] = useState('events')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchQueue()
    }, [])

    const fetchQueue = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/moderation')
            const data = await res.json()

            if (data.success) {
                setPosts(data.data.posts)
                setEvents(data.data.events)
            }
        } catch (error) {
            console.error('Failed to fetch moderation queue:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAction = async (type: string, itemId: string, action: string) => {
        try {
            const res = await fetch('/api/admin/moderation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, itemId, action }),
            })

            if (res.ok) {
                if (type === 'post') {
                    setPosts(prev => prev.filter(p => p.id !== itemId))
                } else if (type === 'event') {
                    setEvents(prev => prev.filter(e => e.id !== itemId))
                }
            }
        } catch (error) {
            console.error('Moderation action failed:', error)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const truncate = (text: string, length: number) => {
        if (!text) return ''
        if (text.length <= length) return text
        return text.substring(0, length) + '...'
    }

    return (
        <div className={styles.page}>
            <h1>Content Moderation</h1>
            <p className={styles.subtitle}>Review and moderate flagged content</p>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    onClick={() => setActiveTab('events')}
                    className={`${styles.tab} ${activeTab === 'events' ? styles.active : ''}`}
                >
                    📅 Events
                    {events.length > 0 && <span className={styles.badge}>{events.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`${styles.tab} ${activeTab === 'posts' ? styles.active : ''}`}
                >
                    💬 Posts
                    {posts.length > 0 && <span className={styles.badge}>{posts.length}</span>}
                </button>
            </div>

            {isLoading ? (
                <div className={styles.loading}>
                    <div className="spinner spinner-lg"></div>
                </div>
            ) : (
                <div className={styles.queue}>
                    {activeTab === 'events' && (
                        events.length === 0 ? (
                            <div className={`card ${styles.emptyState}`}>
                                <div className={styles.emptyIcon}>✓</div>
                                <h3>No Pending Events</h3>
                                <p>All events have been reviewed</p>
                            </div>
                        ) : (
                            events.map((event) => (
                                <div key={event.id} className={`card ${styles.queueItem}`}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.itemType}>📅 Event</span>
                                        <span className={styles.itemDate}>{formatDate(event.createdAt)}</span>
                                    </div>
                                    <h3>{event.title}</h3>
                                    <p>{truncate(event.description || '', 200)}</p>
                                    <div className={styles.itemMeta}>
                                        <span>Created by: {event.creator?.name} ({event.creator?.email})</span>
                                    </div>
                                    <div className={styles.itemActions}>
                                        <button
                                            onClick={() => handleAction('event', event.id, 'approve')}
                                            className="btn btn-primary btn-sm"
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction('event', event.id, 'reject')}
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: 'var(--color-error)' }}
                                        >
                                            ✕ Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {activeTab === 'posts' && (
                        posts.length === 0 ? (
                            <div className={`card ${styles.emptyState}`}>
                                <div className={styles.emptyIcon}>✓</div>
                                <h3>No Flagged Posts</h3>
                                <p>No posts require moderation</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <div key={post.id} className={`card ${styles.queueItem}`}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.itemType}>💬 Post</span>
                                        <span className={styles.itemDate}>{formatDate(post.createdAt)}</span>
                                    </div>
                                    <h3>{post.title}</h3>
                                    <p>{truncate(post.content || '', 200)}</p>
                                    <div className={styles.itemMeta}>
                                        <span>Posted by: {post.author?.name} in {post.category?.name}</span>
                                    </div>
                                    <div className={styles.itemActions}>
                                        <button
                                            onClick={() => handleAction('post', post.id, 'approve')}
                                            className="btn btn-primary btn-sm"
                                        >
                                            ✓ Unlock
                                        </button>
                                        <button
                                            onClick={() => handleAction('post', post.id, 'remove')}
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: 'var(--color-error)' }}
                                        >
                                            🗑️ Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            )}
        </div>
    )
}
