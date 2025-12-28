'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './page.module.css'

interface Post {
    id: string
    title: string
    content: string
    viewCount: number
    isPinned: boolean
    isClosed: boolean
    createdAt: string
    author: {
        id: string
        name: string
        avatar: string | null
        role: string
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

interface Category {
    id: string
    name: string
    slug: string
    description: string | null
    icon: string | null
    color: string | null
}

interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}

interface Props {
    params: Promise<{ category: string }>
}

export default function CategoryPage({ params }: Props) {
    const { category: categorySlug } = use(params)
    const router = useRouter()
    const searchParams = useSearchParams()
    const [posts, setPosts] = useState<Post[]>([])
    const [category, setCategory] = useState<Category | null>(null)
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [sort, setSort] = useState(searchParams.get('sort') || 'latest')

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Fetch category info
                const catRes = await fetch('/api/forums/categories')
                const catData = await catRes.json()
                if (catData.success) {
                    const cat = catData.data.find((c: Category) => c.slug === categorySlug)
                    if (cat) {
                        setCategory(cat)
                    }
                }

                // Fetch posts
                const page = searchParams.get('page') || '1'
                const postsRes = await fetch(
                    `/api/forums/posts?category=${categorySlug}&sort=${sort}&page=${page}`
                )
                const postsData = await postsRes.json()
                if (postsData.success) {
                    setPosts(postsData.data)
                    setPagination(postsData.pagination)
                }
            } catch (error) {
                console.error('Failed to fetch category data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [categorySlug, sort, searchParams])

    const handleSortChange = (newSort: string) => {
        setSort(newSort)
        router.push(`/forums/${categorySlug}?sort=${newSort}`)
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
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading threads...</p>
            </div>
        )
    }

    if (!category) {
        return (
            <div className={styles.notFound}>
                <h2>Category not found</h2>
                <Link href="/forums" className="btn btn-primary">
                    Back to Forums
                </Link>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb}>
                <Link href="/forums">Forums</Link>
                <span className={styles.separator}>/</span>
                <span>{category.name}</span>
            </nav>

            {/* Category Header */}
            <div
                className={styles.header}
                style={{ '--category-color': category.color || '#FF6B35' } as React.CSSProperties}
            >
                <div className={styles.headerContent}>
                    <span className={styles.categoryIcon}>{category.icon || '💬'}</span>
                    <div>
                        <h1>{category.name}</h1>
                        <p className={styles.description}>{category.description}</p>
                    </div>
                </div>
                <Link href="/forums/new" className="btn btn-primary">
                    + New Thread
                </Link>
            </div>

            {/* Sort Controls */}
            <div className={styles.controls}>
                <div className={styles.sortButtons}>
                    <button
                        className={`btn btn-sm ${sort === 'latest' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => handleSortChange('latest')}
                    >
                        Latest
                    </button>
                    <button
                        className={`btn btn-sm ${sort === 'popular' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => handleSortChange('popular')}
                    >
                        Popular
                    </button>
                </div>
                <span className={styles.count}>
                    {pagination?.total || 0} thread{pagination?.total !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <div className={styles.emptyIcon}>📝</div>
                    <h2>No Threads Yet</h2>
                    <p>Be the first to start a discussion in this category!</p>
                    <Link href="/forums/new" className="btn btn-primary">
                        Start a Thread
                    </Link>
                </div>
            ) : (
                <div className={styles.postsList}>
                    {posts.map((post) => (
                        <Link
                            key={post.id}
                            href={`/forums/${categorySlug}/${post.id}`}
                            className={`card card-interactive ${styles.postCard} ${post.isPinned ? styles.pinned : ''}`}
                        >
                            {post.isPinned && (
                                <span className={styles.pinnedBadge}>📌 Pinned</span>
                            )}
                            {post.isClosed && (
                                <span className={styles.closedBadge}>🔒 Closed</span>
                            )}
                            <div className={styles.postMain}>
                                <h3 className={styles.postTitle}>{post.title}</h3>
                                <p className={styles.postPreview}>
                                    {post.content.length > 200
                                        ? post.content.substring(0, 200) + '...'
                                        : post.content}
                                </p>
                            </div>
                            <div className={styles.postMeta}>
                                <div className={styles.postAuthor}>
                                    <div className={`avatar avatar-sm ${styles.avatar}`}>
                                        {post.author.avatar ? (
                                            <img src={post.author.avatar} alt={post.author.name} />
                                        ) : (
                                            post.author.name[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <div className={styles.authorInfo}>
                                        <span className={styles.authorName}>{post.author.name}</span>
                                        <span className={styles.postTime}>{formatDate(post.createdAt)}</span>
                                    </div>
                                </div>
                                <div className={styles.postStats}>
                                    <span title="Comments">💬 {post._count.comments}</span>
                                    <span title="Upvotes">👍 {post._count.upvotes}</span>
                                    <span title="Views">👁 {post.viewCount}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className={styles.pagination}>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <Link
                            key={page}
                            href={`/forums/${categorySlug}?sort=${sort}&page=${page}`}
                            className={`btn btn-sm ${page === pagination.page ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            {page}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
