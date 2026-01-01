'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { ForumsSkeleton } from '@/components/SkeletonLoader'

interface Category {
    id: string
    name: string
    slug: string
    description: string | null
    icon: string | null
    color: string | null
    order: number
    _count: {
        posts: number
    }
}

interface Post {
    id: string
    title: string
    content: string
    createdAt: string
    author: {
        id: string
        name: string
        avatar: string | null
    }
    category: {
        slug: string
        name: string
    }
    _count: {
        comments: number
        upvotes: number
    }
}

export default function ForumsPage() {
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>([])
    const [recentPosts, setRecentPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, postsRes, authRes] = await Promise.all([
                    fetch('/api/forums/categories'),
                    fetch('/api/forums/posts?limit=5'),
                    fetch('/api/auth/me'),
                ])

                const catData = await catRes.json()
                const postsData = await postsRes.json()
                const authData = await authRes.json()

                if (catData.success) {
                    setCategories(catData.data)
                }
                if (postsData.success) {
                    setRecentPosts(postsData.data)
                }
                setIsAuthenticated(authData.success)
            } catch (error) {
                console.error('Failed to fetch forum data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/forums?search=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(hours / 24)

        if (hours < 1) return 'Just now'
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`
        return date.toLocaleDateString()
    }

    if (isLoading) {
        return <ForumsSkeleton />
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Community Forums</h1>
                    <p className={styles.subtitle}>
                        Connect with fellow dog parents, share experiences, and get advice
                    </p>
                </div>
                {isAuthenticated ? (
                    <Link href="/forums/new" className="btn btn-primary">
                        + New Thread
                    </Link>
                ) : (
                    <Link href="/login" className="btn btn-outline">
                        Login to Post
                    </Link>
                )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className={styles.searchForm}>
                <input
                    type="text"
                    placeholder="Search forums..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`input ${styles.searchInput}`}
                />
                <button type="submit" className="btn btn-secondary">
                    🔍 Search
                </button>
            </form>

            <div className={styles.content}>
                {/* Categories Grid */}
                <section className={styles.categoriesSection}>
                    <h2>Browse by Category</h2>
                    <div className={styles.categoriesGrid}>
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/forums/${category.slug}`}
                                className={`card card-interactive ${styles.categoryCard}`}
                                style={{ '--category-color': category.color || '#FF6B35' } as React.CSSProperties}
                            >
                                <div className={styles.categoryIcon}>
                                    {category.icon || '💬'}
                                </div>
                                <div className={styles.categoryInfo}>
                                    <h3>{category.name}</h3>
                                    <p>{category.description}</p>
                                </div>
                                <div className={styles.categoryMeta}>
                                    <span className={styles.postCount}>
                                        {category._count.posts} thread{category._count.posts !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Recent Posts */}
                <section className={styles.recentSection}>
                    <h2>Recent Discussions</h2>
                    {recentPosts.length === 0 ? (
                        <div className={`card ${styles.emptyState}`}>
                            <p>No discussions yet. Be the first to start a thread!</p>
                        </div>
                    ) : (
                        <div className={styles.recentList}>
                            {recentPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/forums/${post.category.slug}/${post.id}`}
                                    className={`card card-interactive ${styles.postCard}`}
                                >
                                    <div className={styles.postHeader}>
                                        <span className={styles.postCategory}>
                                            {post.category.name}
                                        </span>
                                        <span className={styles.postTime}>
                                            {formatDate(post.createdAt)}
                                        </span>
                                    </div>
                                    <h3 className={styles.postTitle}>{post.title}</h3>
                                    <p className={styles.postPreview}>
                                        {post.content.length > 150
                                            ? post.content.substring(0, 150) + '...'
                                            : post.content}
                                    </p>
                                    <div className={styles.postFooter}>
                                        <div className={styles.postAuthor}>
                                            <div className={`avatar avatar-sm ${styles.avatar}`}>
                                                {post.author.avatar ? (
                                                    <img src={post.author.avatar} alt={post.author.name} />
                                                ) : (
                                                    post.author.name[0]?.toUpperCase()
                                                )}
                                            </div>
                                            <span>{post.author.name}</span>
                                        </div>
                                        <div className={styles.postStats}>
                                            <span>💬 {post._count.comments}</span>
                                            <span>👍 {post._count.upvotes}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
