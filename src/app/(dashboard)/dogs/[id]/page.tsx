'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import styles from './page.module.css'

interface HealthRecord {
    id: string
    type: string
    title: string
    date: string
    description: string | null
}

interface Dog {
    id: string
    name: string
    breed: string
    birthDate: string | null
    gender: string
    weight: number | null
    bio: string | null
    photo: string | null
    createdAt: string
    healthRecords: HealthRecord[]
    _count: {
        healthRecords: number
    }
}

export default function DogDetailPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [dog, setDog] = useState<Dog | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    useEffect(() => {
        const fetchDog = async () => {
            try {
                const res = await fetch(`/api/dogs/${id}`)
                const data = await res.json()

                if (data.success) {
                    setDog(data.data)
                } else if (res.status === 401) {
                    router.push('/login')
                } else {
                    router.push('/dogs')
                }
            } catch {
                router.push('/dogs')
            } finally {
                setIsLoading(false)
            }
        }

        fetchDog()
    }, [id, router])

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/dogs/${id}`, { method: 'DELETE' })
            const data = await res.json()

            if (data.success) {
                router.push('/dogs')
            }
        } catch {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const calculateAge = (birthDate: string | null) => {
        if (!birthDate) return 'Age unknown'

        const birth = new Date(birthDate)
        const today = new Date()
        let years = today.getFullYear() - birth.getFullYear()
        let months = today.getMonth() - birth.getMonth()

        if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
            years--
            months += 12
        }

        if (years === 0) {
            return `${months} month${months !== 1 ? 's' : ''} old`
        }
        if (months === 0) {
            return `${years} year${years !== 1 ? 's' : ''} old`
        }
        return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''} old`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    const getHealthRecordIcon = (type: string) => {
        switch (type) {
            case 'VACCINATION': return '💉'
            case 'MEDICATION': return '💊'
            case 'VET_VISIT': return '🏥'
            case 'WEIGHT': return '⚖️'
            default: return '📋'
        }
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading dog profile...</p>
            </div>
        )
    }

    if (!dog) return null

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href="/dogs" className={styles.backLink}>
                    ← Back to My Dogs
                </Link>
            </div>

            <div className={styles.content}>
                <div className={`card ${styles.profileCard}`}>
                    <div className={styles.photoSection}>
                        {dog.photo ? (
                            <img src={dog.photo} alt={dog.name} className={styles.photo} />
                        ) : (
                            <div className={styles.photoPlaceholder}>🐕</div>
                        )}
                    </div>

                    <div className={styles.infoSection}>
                        <div className={styles.nameRow}>
                            <h1>
                                {dog.name}
                                <span className={styles.gender}>
                                    {dog.gender === 'MALE' ? '♂️' : dog.gender === 'FEMALE' ? '♀️' : ''}
                                </span>
                            </h1>
                            <div className={styles.actions}>
                                <Link href={`/dogs/${dog.id}/edit`} className="btn btn-secondary btn-sm">
                                    Edit
                                </Link>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--color-error)' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        <p className={styles.breed}>{dog.breed}</p>
                        <p className={styles.age}>{calculateAge(dog.birthDate)}</p>

                        <div className={styles.details}>
                            {dog.weight && (
                                <div className={styles.detail}>
                                    <span className={styles.detailIcon}>⚖️</span>
                                    <span>{dog.weight} kg</span>
                                </div>
                            )}
                            {dog.birthDate && (
                                <div className={styles.detail}>
                                    <span className={styles.detailIcon}>🎂</span>
                                    <span>Born {formatDate(dog.birthDate)}</span>
                                </div>
                            )}
                        </div>

                        {dog.bio && (
                            <div className={styles.bio}>
                                <h3>About {dog.name}</h3>
                                <p>{dog.bio}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.sidebar}>
                    <div className={`card ${styles.healthCard}`}>
                        <div className={styles.cardHeader}>
                            <h3>Health Records</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="badge badge-primary">{dog._count.healthRecords}</span>
                                <Link href={`/dogs/${dog.id}/health/add`} className="btn btn-sm btn-primary">+</Link>
                            </div>
                        </div>

                        {dog.healthRecords.length === 0 ? (
                            <div className={styles.emptyHealth}>
                                <span>🏥</span>
                                <p>No health records yet</p>
                                <Link href={`/dogs/${dog.id}/health/add`} className="btn btn-outline btn-sm">
                                    + Add Record
                                </Link>
                            </div>
                        ) : (
                            <div className={styles.healthList}>
                                {dog.healthRecords.map((record) => (
                                    <div key={record.id} className={styles.healthItem}>
                                        <span className={styles.healthIcon}>
                                            {getHealthRecordIcon(record.type)}
                                        </span>
                                        <div className={styles.healthInfo}>
                                            <strong>{record.title}</strong>
                                            <span>{formatDate(record.date)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>Delete {dog.name}?</h2>
                        <p>This will permanently delete {dog.name}&apos;s profile and all health records. This action cannot be undone.</p>
                        <div className={styles.modalActions}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn btn-secondary"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="btn"
                                style={{ background: 'var(--color-error)', color: 'white' }}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
