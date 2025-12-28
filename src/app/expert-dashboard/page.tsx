'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Question {
    id: string
    title: string
    content: string
    category: string
    status: string
    createdAt: string
    author: {
        id: string
        name: string
        avatar: string | null
    }
    _count: {
        answers: number
    }
}

interface ExpertStats {
    totalAnswers: number
    acceptedAnswers: number
    totalHelpful: number
}

interface CurrentUser {
    id: string
    name: string
    role: string
    expertType: string | null
    isVerified: boolean
}

export default function ExpertDashboardPage() {
    const router = useRouter()
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
    const [pendingQuestions, setPendingQuestions] = useState<Question[]>([])
    const [myAnsweredQuestions, setMyAnsweredQuestions] = useState<Question[]>([])
    const [stats, setStats] = useState<ExpertStats>({ totalAnswers: 0, acceptedAnswers: 0, totalHelpful: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'pending' | 'answered'>('pending')
    const [categoryFilter, setCategoryFilter] = useState('all')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const authRes = await fetch('/api/auth/me')
                const authData = await authRes.json()

                if (!authData.success) {
                    router.push('/login')
                    return
                }

                const user = authData.data
                if (user.role !== 'EXPERT' && user.role !== 'ADMIN') {
                    router.push('/expert-apply')
                    return
                }

                if (user.role === 'EXPERT' && !user.isVerified) {
                    router.push('/expert-apply?pending=true')
                    return
                }

                setCurrentUser({
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    expertType: user.expertType,
                    isVerified: user.isVerified,
                })

                // Fetch pending questions
                const pendingRes = await fetch('/api/expert-qa/questions?status=PENDING')
                const pendingData = await pendingRes.json()
                if (pendingData.success) {
                    setPendingQuestions(pendingData.data)
                }

                // Fetch questions this expert has answered
                const answeredRes = await fetch('/api/expert-qa/questions?status=ANSWERED')
                const answeredData = await answeredRes.json()
                if (answeredData.success) {
                    // Filter to show questions where this expert answered
                    // For now, show all answered questions
                    setMyAnsweredQuestions(answeredData.data)
                }

                // Stats would typically come from a dedicated endpoint
                // For now, we calculate basic stats
                setStats({
                    totalAnswers: answeredData.data?.length || 0,
                    acceptedAnswers: 0,
                    totalHelpful: 0,
                })
            } catch (error) {
                console.error('Failed to fetch data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [router])

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

    const getCategoryIcon = (cat: string) => {
        const icons: Record<string, string> = {
            HEALTH: '🏥',
            TRAINING: '🎓',
            NUTRITION: '🍖',
            BEHAVIOR: '🧠',
        }
        return icons[cat] || '📋'
    }

    const filteredQuestions = activeTab === 'pending'
        ? pendingQuestions.filter(q => categoryFilter === 'all' || q.category === categoryFilter)
        : myAnsweredQuestions.filter(q => categoryFilter === 'all' || q.category === categoryFilter)

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading dashboard...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Expert Dashboard</h1>
                    <p className={styles.subtitle}>
                        Welcome back, {currentUser?.name}
                        {currentUser?.expertType && (
                            <span className={`badge badge-expert ${styles.expertBadge}`}>
                                ✓ {currentUser.expertType}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={`card ${styles.statCard}`}>
                    <span className={styles.statIcon}>📝</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{pendingQuestions.length}</span>
                        <span className={styles.statLabel}>Pending Questions</span>
                    </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className={styles.statIcon}>💬</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalAnswers}</span>
                        <span className={styles.statLabel}>Your Answers</span>
                    </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className={styles.statIcon}>✓</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.acceptedAnswers}</span>
                        <span className={styles.statLabel}>Accepted</span>
                    </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className={styles.statIcon}>👍</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalHelpful}</span>
                        <span className={styles.statLabel}>Helpful Votes</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`${styles.tab} ${activeTab === 'pending' ? styles.active : ''}`}
                >
                    📥 Pending Queue ({pendingQuestions.length})
                </button>
                <button
                    onClick={() => setActiveTab('answered')}
                    className={`${styles.tab} ${activeTab === 'answered' ? styles.active : ''}`}
                >
                    ✓ Answered
                </button>
            </div>

            {/* Category Filter */}
            <div className={styles.filters}>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`input ${styles.filterSelect}`}
                >
                    <option value="all">All Categories</option>
                    <option value="HEALTH">🏥 Health</option>
                    <option value="TRAINING">🎓 Training</option>
                    <option value="NUTRITION">🍖 Nutrition</option>
                    <option value="BEHAVIOR">🧠 Behavior</option>
                </select>
            </div>

            {/* Questions List */}
            {filteredQuestions.length === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <p>
                        {activeTab === 'pending'
                            ? 'No pending questions in this category. Great job!'
                            : 'No answered questions yet.'}
                    </p>
                </div>
            ) : (
                <div className={styles.questionsList}>
                    {filteredQuestions.map((question) => (
                        <Link
                            key={question.id}
                            href={`/expert-qa/${question.id}`}
                            className={`card card-interactive ${styles.questionCard}`}
                        >
                            <div className={styles.questionHeader}>
                                <span className={styles.categoryBadge}>
                                    {getCategoryIcon(question.category)} {question.category}
                                </span>
                                <span className={styles.questionTime}>{formatDate(question.createdAt)}</span>
                            </div>
                            <h3 className={styles.questionTitle}>{question.title}</h3>
                            <p className={styles.questionPreview}>
                                {question.content.length > 150
                                    ? question.content.substring(0, 150) + '...'
                                    : question.content}
                            </p>
                            <div className={styles.questionFooter}>
                                <span>Asked by {question.author.name}</span>
                                <span>💬 {question._count.answers} answer{question._count.answers !== 1 ? 's' : ''}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
