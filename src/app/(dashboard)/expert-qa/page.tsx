'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './page.module.css'
import { ExpertQASkeleton } from '@/components/SkeletonLoader'

interface Question {
    id: string
    title: string
    content: string
    category: string
    status: string
    isPublic: boolean
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

const CATEGORIES = [
    { value: 'all', label: 'All Categories', icon: '📋' },
    { value: 'HEALTH', label: 'Health', icon: '🏥' },
    { value: 'TRAINING', label: 'Training', icon: '🎓' },
    { value: 'NUTRITION', label: 'Nutrition', icon: '🍖' },
    { value: 'BEHAVIOR', label: 'Behavior', icon: '🧠' },
]

export default function ExpertQAPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [questions, setQuestions] = useState<Question[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [category, setCategory] = useState(searchParams.get('category') || 'all')
    const [status, setStatus] = useState(searchParams.get('status') || 'all')

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                if (category !== 'all') params.set('category', category)
                if (status !== 'all') params.set('status', status)

                const [questionsRes, authRes] = await Promise.all([
                    fetch(`/api/expert-qa/questions?${params}`),
                    fetch('/api/auth/me'),
                ])

                const questionsData = await questionsRes.json()
                const authData = await authRes.json()

                if (questionsData.success) {
                    setQuestions(questionsData.data)
                }
                setIsAuthenticated(authData.success)
            } catch (error) {
                console.error('Failed to fetch questions:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [category, status])

    const handleCategoryChange = (newCategory: string) => {
        setCategory(newCategory)
        const params = new URLSearchParams()
        if (newCategory !== 'all') params.set('category', newCategory)
        if (status !== 'all') params.set('status', status)
        router.push(`/expert-qa?${params}`)
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

    const getStatusBadge = (questionStatus: string, answerCount: number) => {
        if (questionStatus === 'CLOSED') {
            return <span className={`badge ${styles.statusClosed}`}>Closed</span>
        }
        if (answerCount > 0) {
            return <span className={`badge badge-success ${styles.statusAnswered}`}>Answered</span>
        }
        return <span className={`badge badge-warning ${styles.statusPending}`}>Awaiting Expert</span>
    }

    const getCategoryIcon = (cat: string) => {
        const found = CATEGORIES.find(c => c.value === cat)
        return found?.icon || '📋'
    }

    if (isLoading) {
        return <ExpertQASkeleton />
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Expert Q&A</h1>
                    <p className={styles.subtitle}>
                        Get answers from verified veterinarians, trainers, and pet experts
                    </p>
                </div>
                {isAuthenticated ? (
                    <Link href="/expert-qa/ask" className="btn btn-primary">
                        Ask a Question
                    </Link>
                ) : (
                    <Link href="/login" className="btn btn-outline">
                        Login to Ask
                    </Link>
                )}
            </div>

            {/* Category Tabs */}
            <div className={styles.categoryTabs}>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => handleCategoryChange(cat.value)}
                        className={`${styles.categoryTab} ${category === cat.value ? styles.active : ''}`}
                    >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Status Filter */}
            <div className={styles.filters}>
                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value)
                        const params = new URLSearchParams()
                        if (category !== 'all') params.set('category', category)
                        if (e.target.value !== 'all') params.set('status', e.target.value)
                        router.push(`/expert-qa?${params}`)
                    }}
                    className={`input ${styles.statusSelect}`}
                >
                    <option value="all">All Questions</option>
                    <option value="PENDING">Awaiting Answer</option>
                    <option value="ANSWERED">Answered</option>
                    <option value="CLOSED">Closed</option>
                </select>
                <span className={styles.count}>
                    {questions.length} question{questions.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Questions List */}
            {questions.length === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <div className={styles.emptyIcon}>❓</div>
                    <h2>No Questions Yet</h2>
                    <p>Be the first to ask a question in this category!</p>
                    {isAuthenticated && (
                        <Link href="/expert-qa/ask" className="btn btn-primary">
                            Ask a Question
                        </Link>
                    )}
                </div>
            ) : (
                <div className={styles.questionsList}>
                    {questions.map((question) => (
                        <Link
                            key={question.id}
                            href={`/expert-qa/${question.id}`}
                            className={`card card-interactive ${styles.questionCard}`}
                        >
                            <div className={styles.questionHeader}>
                                <span className={styles.categoryBadge}>
                                    {getCategoryIcon(question.category)} {question.category}
                                </span>
                                {getStatusBadge(question.status, question._count.answers)}
                            </div>
                            <h3 className={styles.questionTitle}>{question.title}</h3>
                            <p className={styles.questionPreview}>
                                {question.content.length > 180
                                    ? question.content.substring(0, 180) + '...'
                                    : question.content}
                            </p>
                            <div className={styles.questionFooter}>
                                <div className={styles.questionAuthor}>
                                    <div className={`avatar avatar-sm ${styles.avatar}`}>
                                        {question.author.avatar ? (
                                            <img src={question.author.avatar} alt={question.author.name} />
                                        ) : (
                                            question.author.name[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <span>{question.author.name}</span>
                                </div>
                                <div className={styles.questionStats}>
                                    <span>{formatDate(question.createdAt)}</span>
                                    <span>💬 {question._count.answers} answer{question._count.answers !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
