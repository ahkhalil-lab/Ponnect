'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

interface Stats {
    users: { total: number; new: number }
    posts: { total: number; new: number }
    events: { total: number; upcoming: number }
    questions: { total: number; pending: number }
    experts: { total: number; pending: number }
}

interface RecentUser {
    id: string
    name: string
    email: string
    createdAt: string
}

interface RecentPost {
    id: string
    title: string
    createdAt: string
    author: { id: string; name: string }
    category: { name: string }
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
    const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats')
                const data = await res.json()

                if (data.success) {
                    setStats(data.data.stats)
                    setRecentUsers(data.data.recentActivity.users)
                    setRecentPosts(data.data.recentActivity.posts)
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [])

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
        })
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading admin stats...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <h1>Admin Dashboard</h1>
            <p className={styles.subtitle}>Overview of your platform</p>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={`card ${styles.statCard}`}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats?.users.total || 0}</span>
                        <span className={styles.statLabel}>Total Users</span>
                        <span className={styles.statChange}>+{stats?.users.new || 0} this month</span>
                    </div>
                </div>

                <div className={`card ${styles.statCard}`}>
                    <div className={styles.statIcon}>💬</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats?.posts.total || 0}</span>
                        <span className={styles.statLabel}>Forum Posts</span>
                        <span className={styles.statChange}>+{stats?.posts.new || 0} this week</span>
                    </div>
                </div>

                <div className={`card ${styles.statCard}`}>
                    <div className={styles.statIcon}>📅</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats?.events.total || 0}</span>
                        <span className={styles.statLabel}>Events</span>
                        <span className={styles.statChange}>{stats?.events.upcoming || 0} upcoming</span>
                    </div>
                </div>

                <div className={`card ${styles.statCard}`}>
                    <div className={styles.statIcon}>🩺</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats?.questions.total || 0}</span>
                        <span className={styles.statLabel}>Q&A Questions</span>
                        <span className={styles.statChange}>{stats?.questions.pending || 0} pending</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <h2>Quick Actions</h2>
                <div className={styles.actionButtons}>
                    <Link href="/admin/users" className="btn btn-outline">
                        👥 Manage Users
                    </Link>
                    <Link href="/admin/moderation" className="btn btn-outline">
                        🛡️ Moderation Queue
                    </Link>
                    <Link href="/admin/experts" className="btn btn-outline">
                        ⭐ Expert Applications ({stats?.experts.pending || 0})
                    </Link>
                </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.activityGrid}>
                <div className={`card ${styles.activityCard}`}>
                    <h3>Recent Users</h3>
                    <div className={styles.activityList}>
                        {recentUsers.map((user) => (
                            <div key={user.id} className={styles.activityItem}>
                                <div className={styles.activityAvatar}>
                                    {user.name[0]?.toUpperCase()}
                                </div>
                                <div className={styles.activityInfo}>
                                    <strong>{user.name}</strong>
                                    <span>{user.email}</span>
                                </div>
                                <span className={styles.activityDate}>
                                    {formatDate(user.createdAt)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <Link href="/admin/users" className={styles.viewAll}>
                        View all users →
                    </Link>
                </div>

                <div className={`card ${styles.activityCard}`}>
                    <h3>Recent Posts</h3>
                    <div className={styles.activityList}>
                        {recentPosts.map((post) => (
                            <div key={post.id} className={styles.activityItem}>
                                <div className={styles.activityIcon}>💬</div>
                                <div className={styles.activityInfo}>
                                    <strong>{post.title}</strong>
                                    <span>by {post.author.name} in {post.category.name}</span>
                                </div>
                                <span className={styles.activityDate}>
                                    {formatDate(post.createdAt)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <Link href="/forums" className={styles.viewAll}>
                        View all posts →
                    </Link>
                </div>
            </div>
        </div>
    )
}
