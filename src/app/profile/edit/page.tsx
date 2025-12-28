'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface UserProfile {
    id: string
    name: string
    bio: string | null
    location: string | null
    avatar: string | null
}

export default function EditProfilePage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        location: '',
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile')
                const data = await res.json()

                if (data.success) {
                    const profile: UserProfile = data.data
                    setFormData({
                        name: profile.name || '',
                        bio: profile.bio || '',
                        location: profile.location || '',
                    })
                } else {
                    router.push('/login')
                }
            } catch {
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError('')
        setSuccess(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError('')
        setSuccess(false)

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (data.success) {
                setSuccess(true)
                setTimeout(() => {
                    router.push('/profile')
                }, 1000)
            } else {
                setError(data.error || 'Failed to update profile')
            }
        } catch {
            setError('An error occurred. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading profile...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href="/profile" className={styles.backLink}>
                    ← Back to Profile
                </Link>
                <h1>Edit Profile</h1>
            </div>

            <div className={`card ${styles.formCard}`}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.errorAlert}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className={styles.successAlert}>
                            Profile updated successfully! Redirecting...
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="name" className="input-label">
                            Display Name <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input"
                            placeholder="Your display name"
                            required
                            maxLength={100}
                        />
                        <span className={styles.hint}>{formData.name.length}/100 characters</span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="location" className="input-label">
                            Location
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g., Brisbane, QLD"
                        />
                        <span className={styles.hint}>Help other dog parents find you nearby</span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="bio" className="input-label">
                            Bio
                        </label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className="input"
                            placeholder="Tell us about yourself and your dogs..."
                            rows={4}
                            maxLength={500}
                        />
                        <span className={styles.hint}>{formData.bio.length}/500 characters</span>
                    </div>

                    <div className={styles.actions}>
                        <Link href="/profile" className="btn btn-secondary">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <span className="spinner spinner-sm"></span>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
