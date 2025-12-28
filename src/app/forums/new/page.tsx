'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

interface Category {
    id: string
    name: string
    slug: string
    icon: string | null
}

export default function NewThreadPage() {
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>([])
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check auth
                const authRes = await fetch('/api/auth/me')
                const authData = await authRes.json()
                if (!authData.success) {
                    router.push('/login?redirect=/forums/new')
                    return
                }

                // Fetch categories
                const catRes = await fetch('/api/forums/categories')
                const catData = await catRes.json()
                if (catData.success) {
                    setCategories(catData.data)
                    if (catData.data.length > 0) {
                        setCategoryId(catData.data[0].id)
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!title.trim()) {
            setError('Title is required')
            return
        }

        if (!content.trim()) {
            setError('Content is required')
            return
        }

        if (!categoryId) {
            setError('Please select a category')
            return
        }

        setIsSubmitting(true)

        try {
            const res = await fetch('/api/forums/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    categoryId,
                }),
            })

            const data = await res.json()

            if (data.success) {
                const category = categories.find(c => c.id === categoryId)
                router.push(`/forums/${category?.slug}/${data.data.id}`)
            } else {
                setError(data.error || 'Failed to create thread')
            }
        } catch (err) {
            console.error('Submit error:', err)
            setError('Failed to create thread. Please try again.')
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
                <Link href="/forums">Forums</Link>
                <span className={styles.separator}>/</span>
                <span>New Thread</span>
            </nav>

            <div className={`card ${styles.formCard}`}>
                <h1>Start a New Thread</h1>
                <p className={styles.subtitle}>
                    Share your question, story, or start a discussion with the community
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="category" className="input-label">
                            Category
                        </label>
                        <select
                            id="category"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className={`input ${styles.select}`}
                        >
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label htmlFor="title" className="input-label">
                            Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What's your topic about?"
                            className="input"
                            maxLength={200}
                        />
                        <span className={styles.charCount}>
                            {title.length}/200
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="content" className="input-label">
                            Content
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share your thoughts, questions, or experiences..."
                            className={`input ${styles.textarea}`}
                            rows={10}
                        />
                    </div>

                    <div className={styles.actions}>
                        <Link href="/forums" className="btn btn-ghost">
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
                                    Posting...
                                </>
                            ) : (
                                'Post Thread'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
