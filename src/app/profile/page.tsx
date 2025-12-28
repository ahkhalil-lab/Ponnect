'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Dog {
    id: string
    name: string
    breed: string
    birthDate: string | null
    gender: string
    photo: string | null
}

interface UserProfile {
    id: string
    name: string
    email: string
    bio: string | null
    location: string | null
    avatar: string | null
    role: string
    expertType: string | null
    credentials: string | null
    isVerified: boolean
    createdAt: string
    dogs: Dog[]
    _count: {
        posts: number
        dogs: number
    }
}

export default function ProfilePage() {
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile')
                const data = await res.json()

                if (data.success) {
                    setProfile(data.data)
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    const getRoleBadge = (role: string, expertType: string | null) => {
        if (role === 'ADMIN') return { label: 'Admin', class: 'badge-error' }
        if (role === 'MODERATOR') return { label: 'Moderator', class: 'badge-warning' }
        if (role === 'EXPERT') {
            const type = expertType || 'Expert'
            return { label: type.charAt(0) + type.slice(1).toLowerCase(), class: 'badge-expert' }
        }
        return { label: 'Member', class: 'badge-primary' }
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading profile...</p>
            </div>
        )
    }

    if (!profile) {
        return null
    }

    const badge = getRoleBadge(profile.role, profile.expertType)

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>My Profile</h1>
                <Link href="/profile/edit" className="btn btn-primary">
                    Edit Profile
                </Link>
            </div>

            <div className={styles.content}>
                <div className={`card ${styles.profileCard}`}>
                    <div className={styles.avatarSection}>
                        <div className={`avatar avatar-xl ${styles.avatar}`}>
                            {profile.avatar ? (
                                <img src={profile.avatar} alt={profile.name} />
                            ) : (
                                profile.name[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div className={styles.nameSection}>
                            <h2>{profile.name}</h2>
                            <span className={`badge ${badge.class}`}>{badge.label}</span>
                            {profile.isVerified && (
                                <span className={styles.verified} title="Verified">✓</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.details}>
                        {profile.bio && (
                            <div className={styles.bio}>
                                <p>{profile.bio}</p>
                            </div>
                        )}

                        <div className={styles.info}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoIcon}>📧</span>
                                <span>{profile.email}</span>
                            </div>
                            {profile.location && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoIcon}>📍</span>
                                    <span>{profile.location}</span>
                                </div>
                            )}
                            <div className={styles.infoItem}>
                                <span className={styles.infoIcon}>📅</span>
                                <span>Member since {formatDate(profile.createdAt)}</span>
                            </div>
                        </div>

                        {profile.role === 'EXPERT' && profile.credentials && (
                            <div className={styles.credentials}>
                                <h4>Credentials</h4>
                                <p>{profile.credentials}</p>
                            </div>
                        )}
                    </div>

                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>{profile._count.dogs}</span>
                            <span className={styles.statLabel}>Dogs</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>{profile._count.posts}</span>
                            <span className={styles.statLabel}>Forum Posts</span>
                        </div>
                    </div>
                </div>

                <div className={styles.sidebar}>
                    <div className={`card ${styles.dogsCard}`}>
                        <div className={styles.cardHeader}>
                            <h3>My Dogs</h3>
                            <Link href="/dogs/new" className="btn btn-sm btn-primary">
                                + Add
                            </Link>
                        </div>
                        {profile.dogs.length === 0 ? (
                            <div className={styles.emptyDogs}>
                                <span className={styles.emptyIcon}>🐕</span>
                                <p>No dogs added yet</p>
                                <Link href="/dogs/new" className="btn btn-outline btn-sm">
                                    Add Your First Dog
                                </Link>
                            </div>
                        ) : (
                            <div className={styles.dogsList}>
                                {profile.dogs.map((dog) => (
                                    <Link
                                        key={dog.id}
                                        href={`/dogs/${dog.id}`}
                                        className={styles.dogItem}
                                    >
                                        <div className={`avatar avatar-md ${styles.dogAvatar}`}>
                                            {dog.photo ? (
                                                <img src={dog.photo} alt={dog.name} />
                                            ) : (
                                                '🐕'
                                            )}
                                        </div>
                                        <div className={styles.dogInfo}>
                                            <strong>{dog.name}</strong>
                                            <span>{dog.breed}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {profile.role === 'USER' && (
                        <div className={`card ${styles.expertCta}`}>
                            <h4>Are you a professional?</h4>
                            <p>Apply to become a verified expert and help dog parents with your expertise.</p>
                            <Link href="/expert-apply" className="btn btn-secondary btn-sm w-full">
                                Apply as Expert
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
