'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

const EXPERT_TYPES = [
    { value: 'VET', label: 'Veterinarian', icon: '🩺', description: 'Licensed veterinary professional' },
    { value: 'TRAINER', label: 'Dog Trainer', icon: '🎓', description: 'Certified dog training professional' },
    { value: 'NUTRITIONIST', label: 'Pet Nutritionist', icon: '🥗', description: 'Animal nutrition specialist' },
    { value: 'BEHAVIORIST', label: 'Animal Behaviorist', icon: '🧠', description: 'Certified animal behavior consultant' },
]

interface User {
    role: string
    expertType: string | null
    isVerified: boolean
}

export default function ExpertApplyPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [formData, setFormData] = useState({
        expertType: '',
        credentials: '',
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me')
                const data = await res.json()

                if (data.success) {
                    setUser(data.data)
                } else {
                    router.push('/login')
                }
            } catch {
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }

        fetchUser()
    }, [router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError('')
    }

    const handleTypeSelect = (type: string) => {
        setFormData(prev => ({ ...prev, expertType: type }))
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        try {
            const res = await fetch('/api/expert/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (data.success) {
                setSuccess(true)
            } else {
                setError(data.error || 'Failed to submit application')
            }
        } catch {
            setError('An error occurred. Please try again.')
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

    // Already an expert
    if (user?.role === 'EXPERT' || user?.role === 'ADMIN') {
        return (
            <div className={styles.page}>
                <div className={`card ${styles.statusCard}`}>
                    <div className={styles.statusIcon}>
                        {user.isVerified ? '✅' : '⏳'}
                    </div>
                    <h1>{user.isVerified ? 'You\'re a Verified Expert!' : 'Application Pending'}</h1>
                    <p>
                        {user.isVerified
                            ? 'Your expert status has been verified. You can now answer questions and help the community.'
                            : 'Your application is being reviewed by our team. We\'ll notify you once it\'s approved.'
                        }
                    </p>
                    <Link href="/dashboard" className="btn btn-primary">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    // Success state
    if (success) {
        return (
            <div className={styles.page}>
                <div className={`card ${styles.statusCard}`}>
                    <div className={styles.statusIcon}>🎉</div>
                    <h1>Application Submitted!</h1>
                    <p>
                        Thank you for applying to become a verified expert. Our team will review your credentials and get back to you within 2-3 business days.
                    </p>
                    <Link href="/dashboard" className="btn btn-primary">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href="/profile" className={styles.backLink}>
                    ← Back to Profile
                </Link>
                <h1>Become a Verified Expert</h1>
                <p className={styles.subtitle}>
                    Share your professional expertise with the Ponnect community and help dog parents make informed decisions.
                </p>
            </div>

            <div className={`card ${styles.benefitsCard}`}>
                <h2>Expert Benefits</h2>
                <div className={styles.benefits}>
                    <div className={styles.benefit}>
                        <span className={styles.benefitIcon}>✓</span>
                        <span>Verified badge on your profile</span>
                    </div>
                    <div className={styles.benefit}>
                        <span className={styles.benefitIcon}>✓</span>
                        <span>Answer questions in Expert Q&A</span>
                    </div>
                    <div className={styles.benefit}>
                        <span className={styles.benefitIcon}>✓</span>
                        <span>Build credibility in the community</span>
                    </div>
                    <div className={styles.benefit}>
                        <span className={styles.benefitIcon}>✓</span>
                        <span>Priority support from Ponnect</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {error && (
                    <div className={styles.errorAlert}>
                        {error}
                    </div>
                )}

                <div className={`card ${styles.formSection}`}>
                    <h2>Select Your Expertise</h2>
                    <p>Choose the category that best describes your professional background.</p>

                    <div className={styles.typeGrid}>
                        {EXPERT_TYPES.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                className={`${styles.typeCard} ${formData.expertType === type.value ? styles.typeCardActive : ''}`}
                                onClick={() => handleTypeSelect(type.value)}
                            >
                                <span className={styles.typeIcon}>{type.icon}</span>
                                <strong>{type.label}</strong>
                                <span>{type.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`card ${styles.formSection}`}>
                    <h2>Your Credentials</h2>
                    <p>Tell us about your qualifications, certifications, and experience.</p>

                    <div className="input-group">
                        <label htmlFor="credentials" className="input-label">
                            Professional Credentials <span className={styles.required}>*</span>
                        </label>
                        <textarea
                            id="credentials"
                            name="credentials"
                            value={formData.credentials}
                            onChange={handleChange}
                            className="input"
                            placeholder="Example: I am a registered veterinarian (BVSc) with 10 years of experience in small animal medicine. I completed my degree at the University of Queensland and have worked at several Brisbane clinics..."
                            rows={6}
                            required
                            minLength={20}
                            maxLength={1000}
                        />
                        <span className={styles.hint}>
                            {formData.credentials.length}/1000 characters (minimum 20)
                        </span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Link href="/profile" className="btn btn-secondary">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting || !formData.expertType || formData.credentials.length < 20}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner spinner-sm"></span>
                                Submitting...
                            </>
                        ) : (
                            'Submit Application'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
