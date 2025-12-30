'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Author {
    id: string
    name: string
    avatar: string | null
}

interface ForumResult {
    id: string
    title: string
    content: string
    createdAt: string
    upvotes: number
    author: Author
    category: { id: string; name: string; slug: string; icon: string | null }
    _count: { comments: number }
}

interface EventResult {
    id: string
    title: string
    description: string
    date: string
    location: string
    category: string
    creator: Author
    _count: { rsvps: number }
}

interface QuestionResult {
    id: string
    title: string
    content: string
    category: string
    status: string
    createdAt: string
    author: Author
    _count: { answers: number }
}

const RESULT_TYPES = [
    { value: 'all', label: 'All Results', icon: '🔍' },
    { value: 'forums', label: 'Forums', icon: '💬' },
    { value: 'events', label: 'Events', icon: '📅' },
    { value: 'qa', label: 'Expert Q&A', icon: '🩺' },
]

function SearchContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all'

    const [searchQuery, setSearchQuery] = useState(query)
    const [results, setResults] = useState<{
        forums: ForumResult[]
        events: EventResult[]
        questions: QuestionResult[]
        counts: { forums: number; events: number; questions: number; total: number }
    } | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (query) {
            performSearch()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, type])

    const performSearch = async () => {
        if (!query.trim()) return

        setIsLoading(true)
        try {
            const params = new URLSearchParams({ q: query })
            if (type !== 'all') params.set('type', type)

            const res = await fetch(`/api/search?${params}`)
            const data = await res.json()

            if (data.success) {
                setResults(data.data)
            }
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            const params = new URLSearchParams({ q: searchQuery })
            if (type !== 'all') params.set('type', type)
            router.push(`/search?${params}`)
        }
    }

    const handleTypeChange = (newType: string) => {
        const params = new URLSearchParams({ q: query })
        if (newType !== 'all') params.set('type', newType)
        router.push(`/search?${params}`)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const truncate = (text: string, length: number) => {
        if (text.length <= length) return text
        return text.substring(0, length) + '...'
    }

    return (
        <div className={styles.page}>
            {/* Search Header */}
            <div className={styles.header}>
                <h1>Search</h1>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search forums, events, Q&A..."
                        className={`input ${styles.searchInput}`}
                    />
                    <button type="submit" className="btn btn-primary">
                        Search
                    </button>
                </form>
            </div>

            {/* Type Filters */}
            <div className={styles.filters}>
                {RESULT_TYPES.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => handleTypeChange(t.value)}
                        className={`${styles.filterTab} ${type === t.value ? styles.active : ''}`}
                    >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                        {results?.counts && type === 'all' && (
                            <span className={styles.count}>
                                {t.value === 'all' ? results.counts.total :
                                    t.value === 'forums' ? results.counts.forums :
                                        t.value === 'events' ? results.counts.events :
                                            results.counts.questions}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Results */}
            {isLoading ? (
                <div className={styles.loading}>
                    <div className="spinner spinner-lg"></div>
                    <p>Searching...</p>
                </div>
            ) : !query ? (
                <div className={`card ${styles.emptyState}`}>
                    <div className={styles.emptyIcon}>🔍</div>
                    <h2>Start Searching</h2>
                    <p>Enter a search term to find forums, events, and Q&A</p>
                </div>
            ) : results && results.counts.total === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <div className={styles.emptyIcon}>😕</div>
                    <h2>No Results Found</h2>
                    <p>Try a different search term or filter</p>
                </div>
            ) : results && (
                <div className={styles.results}>
                    {/* Forum Results */}
                    {(type === 'all' || type === 'forums') && results.forums.length > 0 && (
                        <div className={styles.resultSection}>
                            <h2>💬 Forum Posts</h2>
                            {results.forums.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/forums/${post.category.slug}/${post.id}`}
                                    className={`card card-interactive ${styles.resultCard}`}
                                >
                                    <div className={styles.resultBadge}>
                                        {post.category.icon} {post.category.name}
                                    </div>
                                    <h3>{post.title}</h3>
                                    <p>{truncate(post.content, 150)}</p>
                                    <div className={styles.resultMeta}>
                                        <span>{post.author.name}</span>
                                        <span>👍 {post.upvotes}</span>
                                        <span>💬 {post._count.comments}</span>
                                        <span>{formatDate(post.createdAt)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Event Results */}
                    {(type === 'all' || type === 'events') && results.events.length > 0 && (
                        <div className={styles.resultSection}>
                            <h2>📅 Events</h2>
                            {results.events.map((event) => (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.id}`}
                                    className={`card card-interactive ${styles.resultCard}`}
                                >
                                    <div className={styles.resultBadge}>
                                        {event.category}
                                    </div>
                                    <h3>{event.title}</h3>
                                    <p>{truncate(event.description, 150)}</p>
                                    <div className={styles.resultMeta}>
                                        <span>📍 {event.location}</span>
                                        <span>👥 {event._count.rsvps} attending</span>
                                        <span>📅 {formatDate(event.date)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Q&A Results */}
                    {(type === 'all' || type === 'qa') && results.questions.length > 0 && (
                        <div className={styles.resultSection}>
                            <h2>🩺 Expert Q&A</h2>
                            {results.questions.map((question) => (
                                <Link
                                    key={question.id}
                                    href={`/expert-qa/${question.id}`}
                                    className={`card card-interactive ${styles.resultCard}`}
                                >
                                    <div className={styles.resultBadge}>
                                        {question.category}
                                    </div>
                                    <h3>{question.title}</h3>
                                    <p>{truncate(question.content, 150)}</p>
                                    <div className={styles.resultMeta}>
                                        <span>{question.author.name}</span>
                                        <span className={question.status === 'ANSWERED' ? styles.answered : ''}>
                                            {question.status === 'ANSWERED' ? '✓ Answered' : 'Pending'}
                                        </span>
                                        <span>💬 {question._count.answers} answers</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading search...</p>
            </div>
        }>
            <SearchContent />
        </Suspense>
    )
}
