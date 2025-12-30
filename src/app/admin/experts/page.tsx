'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

interface Expert {
    id: string
    name: string
    email: string
    role: string
    isVerified: boolean
    expertTitle: string | null
    expertCredentials: string | null
    createdAt: string
    _count: { expertAnswers: number }
}

export default function AdminExpertsPage() {
    const [pendingExperts, setPendingExperts] = useState<Expert[]>([])
    const [verifiedExperts, setVerifiedExperts] = useState<Expert[]>([])
    const [activeTab, setActiveTab] = useState('pending')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchExperts()
    }, [])

    const fetchExperts = async () => {
        setIsLoading(true)
        try {
            const [pendingRes, verifiedRes] = await Promise.all([
                fetch('/api/admin/users?role=EXPERT&verified=false'),
                fetch('/api/admin/users?role=EXPERT&verified=true'),
            ])

            const pendingData = await pendingRes.json()
            const verifiedData = await verifiedRes.json()

            if (pendingData.success) {
                setPendingExperts(pendingData.data.filter((u: Expert) => !u.isVerified))
            }
            if (verifiedData.success) {
                setVerifiedExperts(verifiedData.data.filter((u: Expert) => u.isVerified))
            }
        } catch (error) {
            console.error('Failed to fetch experts:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerify = async (userId: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isVerified: true }),
            })

            if (res.ok) {
                const expert = pendingExperts.find(e => e.id === userId)
                if (expert) {
                    setPendingExperts(prev => prev.filter(e => e.id !== userId))
                    setVerifiedExperts(prev => [...prev, { ...expert, isVerified: true }])
                }
            }
        } catch (error) {
            console.error('Failed to verify expert:', error)
        }
    }

    const handleReject = async (userId: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: 'USER' }),
            })

            if (res.ok) {
                setPendingExperts(prev => prev.filter(e => e.id !== userId))
            }
        } catch (error) {
            console.error('Failed to reject expert:', error)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    return (
        <div className={styles.page}>
            <h1>Expert Management</h1>
            <p className={styles.subtitle}>Review and verify expert applications</p>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`${styles.tab} ${activeTab === 'pending' ? styles.active : ''}`}
                >
                    ⏳ Pending Applications
                    {pendingExperts.length > 0 && (
                        <span className={styles.badge}>{pendingExperts.length}</span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('verified')}
                    className={`${styles.tab} ${activeTab === 'verified' ? styles.active : ''}`}
                >
                    ✓ Verified Experts ({verifiedExperts.length})
                </button>
            </div>

            {isLoading ? (
                <div className={styles.loading}>
                    <div className="spinner spinner-lg"></div>
                </div>
            ) : (
                <div className={styles.list}>
                    {activeTab === 'pending' && (
                        pendingExperts.length === 0 ? (
                            <div className={`card ${styles.emptyState}`}>
                                <div className={styles.emptyIcon}>✓</div>
                                <h3>No Pending Applications</h3>
                                <p>All expert applications have been reviewed</p>
                            </div>
                        ) : (
                            pendingExperts.map((expert) => (
                                <div key={expert.id} className={`card ${styles.expertCard}`}>
                                    <div className={styles.expertHeader}>
                                        <div className={styles.avatar}>
                                            {expert.name[0]?.toUpperCase()}
                                        </div>
                                        <div className={styles.expertInfo}>
                                            <h3>{expert.name}</h3>
                                            <span>{expert.email}</span>
                                        </div>
                                        <span className={styles.date}>Applied {formatDate(expert.createdAt)}</span>
                                    </div>

                                    {expert.expertTitle && (
                                        <div className={styles.field}>
                                            <label>Title/Specialization:</label>
                                            <p>{expert.expertTitle}</p>
                                        </div>
                                    )}

                                    {expert.expertCredentials && (
                                        <div className={styles.field}>
                                            <label>Credentials:</label>
                                            <p>{expert.expertCredentials}</p>
                                        </div>
                                    )}

                                    <div className={styles.expertActions}>
                                        <button
                                            onClick={() => handleVerify(expert.id)}
                                            className="btn btn-primary"
                                        >
                                            ✓ Verify Expert
                                        </button>
                                        <button
                                            onClick={() => handleReject(expert.id)}
                                            className="btn btn-ghost"
                                            style={{ color: 'var(--color-error)' }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {activeTab === 'verified' && (
                        verifiedExperts.length === 0 ? (
                            <div className={`card ${styles.emptyState}`}>
                                <div className={styles.emptyIcon}>⭐</div>
                                <h3>No Verified Experts</h3>
                                <p>Verify experts to see them here</p>
                            </div>
                        ) : (
                            <div className={styles.verifiedGrid}>
                                {verifiedExperts.map((expert) => (
                                    <div key={expert.id} className={`card ${styles.verifiedCard}`}>
                                        <div className={styles.avatar}>
                                            {expert.name[0]?.toUpperCase()}
                                        </div>
                                        <h4>{expert.name}</h4>
                                        <span className={styles.title}>{expert.expertTitle || 'Expert'}</span>
                                        <span className={styles.answers}>
                                            {expert._count?.expertAnswers || 0} answers
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}
