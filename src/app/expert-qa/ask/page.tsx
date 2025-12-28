'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

const CATEGORIES = [
    { value: 'HEALTH', label: 'Health', icon: '🏥', description: 'Medical conditions, symptoms, treatments' },
    { value: 'TRAINING', label: 'Training', icon: '🎓', description: 'Obedience, tricks, house training' },
    { value: 'NUTRITION', label: 'Nutrition', icon: '🍖', description: 'Diet, food, feeding schedules' },
    { value: 'BEHAVIOR', label: 'Behavior', icon: '🧠', description: 'Anxiety, aggression, habits' },
]

export default function AskQuestionPage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('')
    const [isPublic, setIsPublic] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me')
                const data = await res.json()
                if (!data.success) {
                    router.push('/login?redirect=/expert-qa/ask')
                    return
                }
            } catch {
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!title.trim()) {
            setError('Title is required')
            return
        }

        if (!content.trim()) {
            setError('Please describe your question in detail')
            return
        }

        if (!category) {
            setError('Please select a category')
            return
        }

        setIsSubmitting(true)

        try {
            const res = await fetch('/api/expert-qa/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    category,
                    isPublic,
                }),
            })

            const data = await res.json()

            if (data.success) {
                router.push(`/expert-qa/${data.data.id}`)
            } else {
                setError(data.error || 'Failed to submit question')
            }
        } catch (err) {
            console.error('Submit error:', err)
            setError('Failed to submit question. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <nav className={styles.breadcrumb}>
                <Link href="/expert-qa">Expert Q&A</Link>
                <span className={styles.separator}>/</span>
                <span>Ask a Question</span>
            </nav>

            <div className={`card ${styles.formCard}`}>
                <h1>Ask an Expert</h1>
                <p className={styles.subtitle}>
                    Get professional advice from verified veterinarians, trainers, and pet nutrition experts
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    {/* Category Selection */}
                    <div className={styles.categorySection}>
                        <label className="input-label">Select a Category</label>
                        <div className={styles.categoryGrid}>
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`${styles.categoryOption} ${category === cat.value ? styles.selected : ''}`}
                                >
                                    <span className={styles.categoryIcon}>{cat.icon}</span>
                                    <span className={styles.categoryLabel}>{cat.label}</span>
                                    <span className={styles.categoryDesc}>{cat.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="title" className="input-label">
                            Question Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What would you like to ask?"
                            className="input"
                            maxLength={150}
                        />
                        <span className={styles.charCount}>
                            {title.length}/150
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="content" className="input-label">
                            Question Details
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Provide as much detail as possible to help experts give you the best answer. Include your dog's age, breed, symptoms, duration, etc."
                            className={`input ${styles.textarea}`}
                            rows={8}
                        />
                    </div>

                    {/* Visibility Toggle */}
                    <div className={styles.visibilitySection}>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                            />
                            <span className={styles.toggleSlider}></span>
                            <span className={styles.toggleLabel}>
                                {isPublic ? '🌐 Public Question' : '🔒 Private Question'}
                            </span>
                        </label>
                        <p className={styles.visibilityHint}>
                            {isPublic
                                ? 'Other users can see this question and learn from the answers'
                                : 'Only you and the experts can see this question'}
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <Link href="/expert-qa" className="btn btn-ghost">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner spinner-sm"></span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Question'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
